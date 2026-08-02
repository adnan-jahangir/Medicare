import connectDB from './db.js';
import { Order } from './models.js';
import dotenv from 'dotenv';
dotenv.config();

connectDB().then(async () => {
  const order = await Order.findOne({ status: 'Driver Assigned' });
  if (order) {
    console.log('Advancing order:', order._id);
    order.status = 'Arrived';
    order.otp = '1234';
    order.otpExpiresAt = new Date(Date.now() + 15 * 60000);
    await order.save();
    console.log('Order status set to Arrived, OTP set to 1234');
  } else {
    console.log('No order in Driver Assigned status found');
  }
  process.exit(0);
}).catch(console.error);
