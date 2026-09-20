const db = require("../config/db");
const fileStore = require("../data/fileStore");
const Product = require("../models/Product");

const matchesText = (product, search) => {
  const text = `${product.name} ${product.description}`.toLowerCase();
  return text.includes(search.toLowerCase());
};

const getProducts = async (req, res, next) => {
  try {
    const { search = "", category = "", minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      let products = [...store.products];

      if (search) {
        products = products.filter((product) => matchesText(product, search));
      }

      if (category) {
        products = products.filter((product) => product.category === category);
      }

      if (minPrice) {
        products = products.filter((product) => product.price >= Number(minPrice));
      }

      if (maxPrice) {
        products = products.filter((product) => product.price <= Number(maxPrice));
      }

      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const pageNumber = Math.max(Number(page), 1);
      const pageSize = Math.max(Number(limit), 1);
      const skip = (pageNumber - 1) * pageSize;
      const pagedProducts = products.slice(skip, skip + pageSize);
      const categories = [...new Set(store.products.map((product) => product.category))];

      res.json({
        products: pagedProducts,
        page: pageNumber,
        pages: Math.ceil(products.length / pageSize) || 1,
        total: products.length,
        categories,
      });
      return;
    }

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * pageSize;

    const [products, total, categories] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Product.countDocuments(query),
      Product.distinct("category"),
    ]);

    res.json({
      products,
      page: pageNumber,
      pages: Math.ceil(total / pageSize) || 1,
      total,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const product = store.products.find((item) => item._id === req.params.id);

      if (!product) {
        res.status(404);
        throw new Error("Product not found");
      }

      res.json(product);
      return;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const product = {
        _id: fileStore.id(),
        ...req.body,
        price: Number(req.body.price),
        stock: Number(req.body.stock),
        createdAt: fileStore.now(),
        updatedAt: fileStore.now(),
      };

      store.products.push(product);
      await fileStore.writeStore(store);
      res.status(201).json(product);
      return;
    }

    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const productIndex = store.products.findIndex((item) => item._id === req.params.id);

      if (productIndex === -1) {
        res.status(404);
        throw new Error("Product not found");
      }

      const product = {
        ...store.products[productIndex],
        ...req.body,
        updatedAt: fileStore.now(),
      };
      if (req.body.price !== undefined) product.price = Number(req.body.price);
      if (req.body.stock !== undefined) product.stock = Number(req.body.stock);

      store.products[productIndex] = product;
      await fileStore.writeStore(store);
      res.json(product);
      return;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const originalLength = store.products.length;
      store.products = store.products.filter((item) => item._id !== req.params.id);

      if (store.products.length === originalLength) {
        res.status(404);
        throw new Error("Product not found");
      }

      await fileStore.writeStore(store);
      res.json({ message: "Product removed" });
      return;
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.json({ message: "Product removed" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
