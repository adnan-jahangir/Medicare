import connectDB from './db.js';
import { User } from './models.js';
import dotenv from 'dotenv';
dotenv.config();

connectDB().then(async () => {
  const users = await User.find({ role: 'driver' });
  users.forEach(u => {
    console.log(`Driver Name: ${u.name}, Email: ${u.email}, ID: ${u._id}`);
  });
  process.exit(0);
}).catch(console.error);
