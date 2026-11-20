/**
 * @file controller/Address.js
 * @description Backward-compatible wrapper delegating address operations to controllers/user/profile.controller.js
 */

const profileController = require("../controllers/user/profile.controller");

exports.getAddressPage = profileController.getAddressPage;
exports.addAddress = profileController.addAddress;
exports.editAddress = profileController.editAddress;
exports.deleteAddress = profileController.deleteAddress;
