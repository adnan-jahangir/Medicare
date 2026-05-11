import mongoose from 'mongoose';
import connectDB from './db.js';
import dotenv from 'dotenv';
import { User } from './models.js';

dotenv.config();

const seed = async () => {
  await connectDB();
  
  // Checking/inserting a single document forces MongoDB to create the schema and database!
  const user = new User({
    name: 'Admin Admin',
    email: 'admin@medicare.com',
    password_hash: 'temporay-hash-12345',
    role: 'admin'
  });
  
  await user.save();
  console.log('Database Triggered! Admin user saved!');
  process.exit();
};

seed();