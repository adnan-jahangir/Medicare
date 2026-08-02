import connectDB from './db.js';
import { Order, User } from './models.js';
import dotenv from 'dotenv';
dotenv.config();

connectDB().then(async () => {
  const drivers = await User.find({ role: 'driver' });
  console.log('Registered Drivers:', drivers.map(d => ({ name: d.name, email: d.email, isApproved: d.isApproved })));

  const orders = await Order.find({});
  console.log('Orders & Statuses:', orders.map(o => ({ id: o._id, status: o.status, driverId: o.driverId, otp: o.otp })));

  process.exit(0);
}).catch(console.error);
