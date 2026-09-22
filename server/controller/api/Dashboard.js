/**
 * @file controller/api/Dashboard.js
 * @description API Controller for Admin dashboard analytical queries.
 * Returns pure JSON responses suitable for the React admin panel.
 */

const User = require("../../model/User");
const Order = require("../../model/Order");
const Product = require("../../model/Product");
const Category = require("../../model/Category");

/**
 * @desc    Get dashboard metrics, charts data, and listings summaries.
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin Only)
 */
exports.getDashboardData = async (req, res) => {
    try {
        const { filter = 'daily', startDate, endDate } = req.query;

        // Match condition for date filtering
        let matchStage = { status: 'DELIVERED' };
        let dateFilter = {};
        const now = new Date();

        if (filter === 'daily') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            dateFilter = { $match: { createdAt: { $gte: startOfDay } } };
        } else if (filter === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(now.getDate() - 7);
            dateFilter = { $match: { createdAt: { $gte: lastWeek } } };
        } else if (filter === 'yearly') {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            dateFilter = { $match: { createdAt: { $gte: oneYearAgo } } };
        } else if (filter === 'custom' && startDate && endDate) {
            dateFilter = {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                    }
                }
            };
        }

        // --- Stats Cards calculations ---
        const revenueAggregation = [
            { $match: { status: 'DELIVERED' } }
        ];
        if (Object.keys(dateFilter).length > 0) revenueAggregation.push(dateFilter);
        revenueAggregation.push({ $group: { _id: null, total: { $sum: '$totalAmount' } } });

        const [revenueResult] = await Order.aggregate(revenueAggregation);
        const totalRevenue = revenueResult ? revenueResult.total : 0;

        const orderCountAggregation = [];
        if (Object.keys(dateFilter).length > 0) orderCountAggregation.push(dateFilter);
        orderCountAggregation.push({ $count: 'total' });

        const [orderCountResult] = await Order.aggregate(orderCountAggregation);
        const totalOrders = orderCountResult ? orderCountResult.total : 0;

        let userQuery = {};
        if (dateFilter && dateFilter.$match && dateFilter.$match.createdAt) {
            userQuery.createdAt = dateFilter.$match.createdAt;
        }
        const totalCustomers = await User.countDocuments(userQuery);

        let productQuery = { isBlocked: false };
        if (dateFilter && dateFilter.$match && dateFilter.$match.createdAt) {
            productQuery.createdAt = dateFilter.$match.createdAt;
        }
        const totalProducts = await Product.countDocuments(productQuery);

        // --- Chart Sales Data generation ---
        let chartData = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (filter === 'daily') {
            const hourlySalesRaw = await Order.aggregate([
                { $match: { status: { $nin: ['CANCELLED', 'Returned'] }, createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } },
                {
                    $group: {
                        _id: { hour: { $hour: '$createdAt' } },
                        revenue: { $sum: '$totalAmount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.hour': 1 } }
            ]);

            for (let i = 23; i >= 0; i--) {
                const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
                const hour = hourDate.getHours();
                const found = hourlySalesRaw.find(h => h._id.hour === hour);
                chartData.push({
                    label: `${hour}:00`,
                    revenue: found ? found.revenue : 0,
                    count: found ? found.count : 0
                });
            }
        } else if (filter === 'weekly') {
            const dailySalesRaw = await Order.aggregate([
                { $match: { status: { $nin: ['CANCELLED', 'Returned'] }, createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        revenue: { $sum: '$totalAmount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]);

            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const day = d.getDate();
                const month = d.getMonth() + 1;
                const year = d.getFullYear();
                const found = dailySalesRaw.find(ds => ds._id.year === year && ds._id.month === month && ds._id.day === day);
                chartData.push({
                    label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
                    revenue: found ? found.revenue : 0,
                    count: found ? found.count : 0
                });
            }
        } else if (filter === 'custom' && startDate && endDate) {
            const startStr = startDate.includes('T') ? startDate : startDate + 'T00:00:00.000Z';
            const endStr = endDate.includes('T') ? endDate : endDate + 'T23:59:59.999Z';
            const start = new Date(startStr);
            const end = new Date(endStr);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            
            const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
            
            if (diffDays <= 31) {
                const aggregationPipeline = [
                    { $match: { status: { $nin: ['CANCELLED', 'Returned'] }, createdAt: { $gte: start, $lte: end } } },
                    {
                        $group: {
                            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
                            revenue: { $sum: '$totalAmount' },
                            count: { $sum: 1 }
                        }
                    }
                ];
                const customSalesRaw = await Order.aggregate(aggregationPipeline);
                
                for (let i = 0; i < diffDays; i++) {
                    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
                    const day = d.getDate();
                    const month = d.getMonth() + 1;
                    const year = d.getFullYear();
                    const found = customSalesRaw.find(ds => ds._id.year === year && ds._id.month === month && ds._id.day === day);
                    chartData.push({
                        label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                        revenue: found ? found.revenue : 0,
                        count: found ? found.count : 0
                    });
                }
            } else {
                const aggregationPipeline = [
                    { $match: { status: { $nin: ['CANCELLED', 'Returned'] }, createdAt: { $gte: start, $lte: end } } },
                    {
                        $group: {
                            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                            revenue: { $sum: '$totalAmount' },
                            count: { $sum: 1 }
                        }
                    }
                ];
                const customSalesRaw = await Order.aggregate(aggregationPipeline);
                
                let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
                const endDateObj = new Date(end.getFullYear(), end.getMonth(), 1);
                
                while (currentDate <= endDateObj) {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth() + 1;
                    const found = customSalesRaw.find(m => m._id.year === year && m._id.month === month);
                    chartData.push({
                        label: `${monthNames[month - 1]} ${year}`,
                        revenue: found ? found.revenue : 0,
                        count: found ? found.count : 0
                    });
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            }
        } else {
            // Default: Yearly logic
            const aggregationPipeline = [
                { $match: { status: { $nin: ['CANCELLED', 'Returned'] } } }
            ];
            if (Object.keys(dateFilter).length > 0) aggregationPipeline.push(dateFilter);

            aggregationPipeline.push({
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            });
            aggregationPipeline.push({ $sort: { '_id.year': 1, '_id.month': 1 } });

            const monthlySalesRaw = await Order.aggregate(aggregationPipeline);

            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const year = d.getFullYear();
                const month = d.getMonth() + 1;
                const found = monthlySalesRaw.find(m => m._id.year === year && m._id.month === month);
                chartData.push({
                    label: `${monthNames[month - 1]} ${year}`,
                    revenue: found ? found.revenue : 0,
                    count: found ? found.count : 0
                });
            }
        }
        const monthlySales = chartData;

        // --- Order Status Breakdown ---
        const statusBreakdownRaw = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const statusBreakdown = {};
        statusBreakdownRaw.forEach(s => { statusBreakdown[s._id] = s.count; });

        // --- Top 5 Selling Products ---
        const topProducts = await Order.aggregate([
            { $match: { status: { $nin: ['CANCELLED'] } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.productName' },
                    image: { $first: '$items.productImage' },
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.priceAtPurchase', '$items.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // --- Recent 5 Orders ---
        const recentOrders = await Order.find({})
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(5);

        // --- Category-wise Sales ---
        const categorySalesRaw = await Order.aggregate([
            { $match: { status: 'DELIVERED' } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'product.category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$category.name',
                    totalRevenue: { $sum: { $multiply: ['$items.priceAtPurchase', '$items.quantity'] } },
                    totalSold: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 }
        ]);
        const categorySales = categorySalesRaw.filter(c => c._id != null);

        return res.status(200).json({
            success: true,
            stats: {
                totalRevenue,
                totalOrders,
                totalCustomers,
                totalProducts
            },
            salesData: monthlySales,
            statusBreakdown,
            topProducts,
            recentOrders,
            categorySales
        });
    } catch (err) {
        console.error("API getDashboardData error:", err);
        return res.status(500).json({ success: false, message: "Failed to load dashboard data." });
    }
};
