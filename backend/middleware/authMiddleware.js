const jwt = require("jsonwebtoken");
const db = require("../config/db");
const User = require("../models/User");
const fileStore = require("../data/fileStore");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    next(new Error("Not authorized, token missing"));
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");

    if (db.usingFileDb()) {
      const store = await fileStore.readStore();
      const user = store.users.find((item) => item._id === decoded.id);

      if (!user) {
        res.status(401);
        next(new Error("Not authorized, user not found"));
        return;
      }

      req.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        avatar: user.avatar || "",
      };
      next();
      return;
    }

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      res.status(401);
      next(new Error("Not authorized, user not found"));
      return;
    }

    next();
  } catch (error) {
    res.status(401);
    next(new Error("Not authorized, token failed"));
  }
};

module.exports = { protect };
