require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testPlans() {
  try {
    // This tests if your KEY_ID and SECRET are correct
    const plans = await razorpay.plans.all();
    console.log("✅ Connection Successful!");
    console.log("Available Plan IDs in your Dashboard:");
    plans.items.forEach(plan => console.log(`- ${plan.id} (${plan.item.name})`));
  } catch (error) {
    console.error("❌ Connection Failed!");
    console.error("Error Detail:", error.description || error.message);
  }
}

testPlans();