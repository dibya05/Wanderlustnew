import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/user.js';
import Post from '../models/post.js';

async function checkAndFixIndexes() {
  try {
    await connectDB();
    
    // Check posts count
    const postCount = await Post.countDocuments();
    console.log(`Database count of posts: ${postCount}`);

    // Check users count
    const userCount = await User.countDocuments();
    console.log(`Database count of users: ${userCount}`);

    // List indexes on Users collection
    const userIndexes = await mongoose.connection.db.collection('users').indexes();
    console.log('Current indexes on Users collection:');
    console.log(JSON.stringify(userIndexes, null, 2));

    // Check if username_1 exists and drop it
    const hasUsernameIndex = userIndexes.some(index => index.name === 'username_1');
    if (hasUsernameIndex) {
      console.log('⚠️ Leftover unique index "username_1" detected. Dropping it...');
      await mongoose.connection.db.collection('users').dropIndex('username_1');
      console.log('✓ Successfully dropped index "username_1"!');
    } else {
      console.log('✓ No leftover "username_1" index found.');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error checking/fixing database:', error);
    process.exit(1);
  }
}

checkAndFixIndexes();
