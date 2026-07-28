const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create a Subscription
exports.createSubscription = async (req, res) => {
  try {
    const { planType } = req.body;
    const plan_id = planType === 'yearly' ? process.env.RAZORPAY_PLAN_YEARLY : process.env.RAZORPAY_PLAN_MONTHLY;

    console.log("Creating sub for Plan:", plan_id); // CHECK THIS IN TERMINAL

    const options = {
      plan_id: plan_id,
      customer_notify: 1,
      total_count: planType === 'yearly' ? 1 : 12, 
      notes: { planType, userId: req.body.userId }
    };

    const subscription = await razorpay.subscriptions.create(options);
    res.json(subscription); 
  } catch (error) {
    // THIS LOG WILL TELL YOU THE EXACT RAZORPAY REASON
    console.error("🚨 Razorpay API Error:", error.error); 
    res.status(500).json({ error: error.error?.description || "Could not create subscription" });
  }
};
// 2. Verify Subscription
exports.verifySubscription = async (req, res) => {
  try {
    const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    // IMPORTANT: Subscription signatures use payment_id + subscription_id
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_payment_id + "|" + razorpay_subscription_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      await User.findByIdAndUpdate(userId, { membershipStatus: 'premier' });
      res.json({ success: true, message: "Upgraded to Premier!" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
};