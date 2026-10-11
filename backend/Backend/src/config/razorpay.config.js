const razorpay = require('razorpay');
const dotenv = require('dotenv');
dotenv.config();


exports.createRazorpayInstance = () => {
    return new razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

