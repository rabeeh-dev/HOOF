const Cart = require('../model/Cart');
const Address = require('../model/Address');
const Order = require('../model/Order');
const Product = require('../model/Product');

exports.prepareCheckout = async (userId) => {

  const cart = await Cart.findOne({ userId })
    .populate('items.productId');

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const addresses = await Address.find({ userId });

  let subtotal = 0;

  // Create transformed cartItems with totalPrice
  const cartItems = cart.items.map(item => {

    const totalPrice = item.productId.salePrice * item.quantity;

    subtotal += totalPrice;

    return {
      ...item.toObject(),
      totalPrice
    };
  });

  const shippingCharge = subtotal > 999 ? 0 : 50;
  const totalAmount = subtotal + shippingCharge;

  return {
    cartItems,
    addresses,
    subtotal,
    shippingCharge,
    totalAmount
  };
};


exports.createOrder = async (userId, addressId) => {

  const cart = await Cart.findOne({ userId })
    .populate('items.productId');

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart empty");
  }

  const address = await Address.findOne({ _id: addressId, userId });

  if (!address) {
    throw new Error("Invalid address");
  }

  let subtotal = 0;
  const orderItems = [];

  for (const item of cart.items) {

    const product = item.productId;

    if (!product || product.isBlocked) {
      throw new Error("Product unavailable");
    }

    // Validate stock (simple version without variants)
    if (product.quantity < item.quantity) {
      throw new Error("Insufficient stock");
    }

    subtotal += product.salePrice * item.quantity;

    orderItems.push({
      productId: product._id,
      productName: product.productName,
      productImage: product.productImage[0],
      priceAtPurchase: product.salePrice,
      quantity: item.quantity
    });

    // Deduct stock
    product.quantity -= item.quantity;
    await product.save();
  }

  const shippingCharge = subtotal > 999 ? 0 : 50;
  const totalAmount = subtotal + shippingCharge;

  const newOrder = new Order({
    userId,
    items: orderItems,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.mobile,
      street: address.houseName,
      city: address.city,
      state: address.state,
      zip: address.pincode
    },
    subtotal,
    shippingCharge,
    totalAmount,
    paymentMethod: "COD"
  });

  await newOrder.save();

  // Clear cart
  cart.items = [];
  await cart.save();

  return newOrder;
};

