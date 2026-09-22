const express = require("express");
const router = express.Router();
const addressController = require("../controller/Address");
const { isUser } = require("../middleware/auth");

/**
 * @desc    Render the address management page.
 * @route   GET /user/address
 * @access  Private (isUser)
 */
router.get('/', isUser, addressController.getAddressPage);

/**
 * @desc    Create and save a new delivery address.
 * @route   POST /user/address/add
 * @access  Private (isUser)
 */
router.post('/add', isUser, addressController.addAddress);

/**
 * @desc    Update an existing delivery address.
 * @route   PUT /user/address/edit/:id
 * @access  Private (isUser)
 */
router.put('/edit/:id', isUser, addressController.editAddress);

/**
 * @desc    Remove a specific delivery address by ID.
 * @route   DELETE /user/address/delete/:id
 * @access  Private (isUser)
 */
router.delete('/delete/:id', isUser, addressController.deleteAddress);

module.exports = router;
