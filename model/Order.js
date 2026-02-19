const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      productName: String,
      productImage: String,
      priceAtPurchase: Number,
      quantity: Number,
      variantSize: String
    }
  ],

  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },

  subtotal: Number,
  shippingCharge: Number,
  totalAmount: Number,

  paymentMethod: {
    type: String,
    default: "COD"
  },

  status: {
    type: String,
    enum: ["Pending", "Processing", "SHIPPED", "Out for Delivery", "DELIVERED", "CANCELLED", "Return Requested", "Returned"],
    default: "Pending"
  },

  statusHistory: [
    {
      status: String,
      changedAt: {
        type: Date,
        default: Date.now
      },
      note: String
    }
  ],


}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
