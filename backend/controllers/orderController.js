const db = require("../config/db");
const Order = require("../models/Order");
const Product = require("../models/Product");
const fileStore = require("../data/fileStore");

const createOrder = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      res.status(400);
      throw new Error("Order must include products");
    }

    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const orderItems = [];
      let totalAmount = 0;

      for (const item of products) {
        const product = store.products.find((candidate) => candidate._id === item.product);
        const quantity = Number(item.quantity);

        if (!product) {
          res.status(404);
          throw new Error("One or more products were not found");
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
          res.status(400);
          throw new Error("Quantity must be at least 1");
        }

        if (product.stock < quantity) {
          res.status(400);
          throw new Error(`${product.name} has only ${product.stock} item(s) left`);
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.image,
          quantity,
          price: product.price,
        });
        totalAmount += product.price * quantity;
      }

      orderItems.forEach((item) => {
        const product = store.products.find((candidate) => candidate._id === item.product);
        product.stock -= item.quantity;
        product.updatedAt = fileStore.now();
      });

      const order = {
        _id: fileStore.id(),
        user: req.user._id,
        products: orderItems,
        totalAmount,
        status: "Placed",
        createdAt: fileStore.now(),
        updatedAt: fileStore.now(),
      };

      store.orders.push(order);
      await fileStore.writeStore(store);
      res.status(201).json(order);
      return;
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of products) {
      const product = await Product.findById(item.product);
      const quantity = Number(item.quantity);

      if (!product) {
        res.status(404);
        throw new Error("One or more products were not found");
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        res.status(400);
        throw new Error("Quantity must be at least 1");
      }

      if (product.stock < quantity) {
        res.status(400);
        throw new Error(`${product.name} has only ${product.stock} item(s) left`);
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        quantity,
        price: product.price,
      });
      totalAmount += product.price * quantity;
    }

    const order = await Order.create({
      user: req.user._id,
      products: orderItems,
      totalAmount,
      status: "Placed",
    });

    await Promise.all(
      orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        })
      )
    );

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const orders = store.orders
        .filter((order) => order.user === req.user._id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(orders);
      return;
    }

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const order = store.orders.find((item) => item._id === req.params.id && item.user === req.user._id);

      if (!order) {
        res.status(404);
        throw new Error("Order not found");
      }

      res.json(order);
      return;
    }

    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders, getOrderById };
