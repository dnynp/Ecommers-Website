const express = require("express");
const { createOrder, getMyOrders, getOrderById } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, createOrder).get(protect, getMyOrders);
router.route("/:id").get(protect, getOrderById);

module.exports = router;
