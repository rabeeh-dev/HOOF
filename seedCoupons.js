require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('./model/Coupon');

async function seedCoupons() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("Connected to DB for seeding...");

        const coupons = [
            {
                couponCode: 'WELCOME10',
                description: 'Get 10% off on your first order!',
                discountType: 'percentage',
                discountValue: 10,
                minPurchaseAmount: 500,
                maxDiscountAmount: 200,
                expiryDate: new Date('2026-12-31'),
                usageLimit: 1000,
                isActive: true
            },
            {
                couponCode: 'HOOF500',
                description: 'Flat ₹500 off on orders above ₹5000',
                discountType: 'fixed',
                discountValue: 500,
                minPurchaseAmount: 5000,
                expiryDate: new Date('2026-12-31'),
                usageLimit: 500,
                isActive: true
            },
            {
                couponCode: 'SNEAKERHEAD',
                description: 'Exclusive 20% off for sneaker enthusiasts!',
                discountType: 'percentage',
                discountValue: 20,
                minPurchaseAmount: 2000,
                maxDiscountAmount: 1000,
                expiryDate: new Date('2026-12-31'),
                usageLimit: 100,
                isActive: true
            }
        ];

        for (const couponData of coupons) {
            await Coupon.findOneAndUpdate(
                { couponCode: couponData.couponCode },
                couponData,
                { upsert: true, new: true }
            );
        }

        console.log("Coupons seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seedCoupons();
