import connectDB from './db.js';
import { Order } from './models.js';
import dotenv from 'dotenv';
dotenv.config();

connectDB().then(async () => {
  const order = await Order.findOne({ status: 'Arrived' });
  if (order) {
    console.log('Resetting order status to Driver Assigned:', order._id);
    order.status = 'Driver Assigned';
    order.otp = undefined;
    order.otpExpiresAt = undefined;
    await order.save();
    console.log('Order reset successfully.');
  } else {
    console.log('No order in Arrived status found to reset.');
  }
  process.exit(0);
}).catch(console.error);
