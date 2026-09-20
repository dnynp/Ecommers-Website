const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const User = require("../models/User");
const fileStore = require("../data/fileStore");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "dev_secret_change_me", {
    expiresIn: "30d",
  });
};

const SYMBOL_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

const validatePasswordRules = (password) => {
  if (!password || password.length < 3 || password.length > 15) {
    throw new Error("Password must be between 3 and 15 characters");
  }
  if (!SYMBOL_REGEX.test(password)) {
    throw new Error("Password must contain at least one special symbol (e.g. @, #, $, !)");
  }
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone = "", address = "", avatar = "" } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email, and password are required");
    }

    try {
      validatePasswordRules(password);
    } catch (valErr) {
      res.status(400);
      throw valErr;
    }

    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const normalizedEmail = email.toLowerCase().trim();
      const userExists = store.users.find((user) => user.email === normalizedEmail);

      if (userExists) {
        res.status(409);
        throw new Error("Email already registered");
      }

      const user = {
        _id: fileStore.id(),
        name: name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        phone: phone.trim(),
        address: address.trim(),
        avatar: avatar || "",
        createdAt: fileStore.now(),
        updatedAt: fileStore.now(),
      };

      store.users.push(user);
      await fileStore.writeStore(store);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
        token: generateToken(user._id),
      });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409);
      throw new Error("Email already registered");
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      avatar,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      avatar: user.avatar || "",
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const user = store.users.find((item) => item.email === email.toLowerCase().trim());

      if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          address: user.address || "",
          avatar: user.avatar || "",
          token: generateToken(user._id),
        });
        return;
      }

      res.status(401);
      throw new Error("Invalid email or password");
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
        token: generateToken(user._id),
      });
      return;
    }

    res.status(401);
    throw new Error("Invalid email or password");
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const user = store.users.find((u) => u._id === req.user._id);
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
      });
      return;
    }

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const { name, phone, address, avatar, password } = req.body;

    if (password) {
      validatePasswordRules(password);
    }

    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const userIndex = store.users.findIndex((u) => u._id === req.user._id);

      if (userIndex === -1) {
        res.status(404);
        throw new Error("User not found");
      }

      const user = store.users[userIndex];
      if (name) user.name = name.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (address !== undefined) user.address = address.trim();
      if (avatar !== undefined) user.avatar = avatar;
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      user.updatedAt = fileStore.now();

      store.users[userIndex] = user;
      await fileStore.writeStore(store);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
        token: generateToken(user._id),
      });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address !== undefined) user.address = address.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (password) user.password = password;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || "",
      address: updatedUser.address || "",
      avatar: updatedUser.avatar || "",
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
