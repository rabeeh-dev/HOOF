/**
 * @file controllers/admin/customer.controller.js
 * @description Controller handling administrator customer management: customer listing, blocking/unblocking, and referral reward settings.
 */

const User = require('../../models/User');
const userService = require('../../services/user.service');

/**
 * @desc    Load the paginated customer management list with order metrics.
 * @route   GET /admin/customers
 * @access  Private (isAdminLogin)
 */
exports.loadCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const { search } = req.query;
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const totalUsers = await User.countDocuments(query);

    const pipeline = [];
    if (Object.keys(query).length > 0) {
      pipeline.push({ $match: query });
    }
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          as: 'orders',
        },
      },
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalSpend: {
            $reduce: {
              input: '$orders',
              initialValue: 0,
              in: {
                $cond: [
                  { $ne: ['$$this.status', 'CANCELLED'] },
                  { $add: ['$$value', { $ifNull: ['$$this.totalAmount', 0] }] },
                  '$$value',
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          password: 0,
          orders: 0,
        },
      }
    );

    const users = await User.aggregate(pipeline);

    res.render('Admin/user-management', {
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit) || 1,
      search: search || '',
      title: 'Customers | HOOF Admin',
      layout: false,
    });
    });
  } catch (error) {
    console.error('Load Customers Error:', error.message);
    res.status(500).send('Error loading customer data');
  }
};

/**
 * @desc    Toggle the isBlocked status of a specific customer.
 * @route   PATCH /admin/users/:id/:action
 * @access  Private (isAdminLogin)
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id, action } = req.params;
    const blockStatus = action === 'block';

    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: blockStatus },
      { returnDocument: 'after' }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('user:statusChanged', { userId: id, isBlocked: blockStatus });
    }

    return res.status(200).json({
      success: true,
      message: `User ${blockStatus ? 'blocked' : 'unblocked'} successfully`,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    console.error('Toggle User Status Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * @desc    Load administrative referral program configuration and performance stats.
 * @route   GET /admin/referral
 * @access  Private (isAdminLogin)
 */
exports.loadReferralSettings = async (req, res) => {
  try {
    const { config, stats } = await userService.getAdminReferralSettings();

    res.render('Admin/referral-settings', {
      config,
      stats,
      title: 'Referral Settings | HOOF Admin',
      layout: false,
    });
  } catch (error) {
    console.error('Load Referral Settings Error:', error.message);
    res.redirect('/admin/dashboard');
  }
};

/**
 * @desc    Update administrative referral program parameters.
 * @route   PATCH /admin/referral
 * @access  Private (isAdminLogin)
 */
exports.updateReferralSettings = async (req, res) => {
  try {
    await userService.updateAdminReferralSettings(req.body);
    return res.json({ success: true, message: 'Referral settings updated successfully' });
  } catch (error) {
    console.error('Update Referral Settings Error:', error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update settings',
    });
  }
};
