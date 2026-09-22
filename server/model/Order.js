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
      variantSize: String,
      itemStatus: {
        type: String,
        enum: ['Active', 'Cancelled', 'Return Requested', 'Return Approved', 'Picked Up', 'Returned'],
        default: 'Active'
      },
      returnReason: {
        type: String,
        default: ''
      }
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
  couponCode: String,
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: Number,

  paymentMethod: {
    type: String,
    default: "COD"
  },

  paymentStatus: {
    type: String,
    default: "Pending"
  },

  status: {
    type: String,
    enum: ["Pending", "Processing", "SHIPPED", "Out for Delivery", "DELIVERED", "CANCELLED", "Return Requested", "Return Approved", "Picked Up", "Returned"],
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

  razorpayOrderId: String,
  razorpayPaymentId: String,


}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
