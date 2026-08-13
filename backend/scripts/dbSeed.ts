import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import User from '../models/user.js';
import Post from '../models/post.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  try {
    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ email: 'johndoe@example.com' });
    if (!user) {
      console.log('👤 Creating seed user...');
      user = await User.create({
        userName: 'johndoe',
        fullName: 'John Doe',
        email: 'johndoe@example.com',
        password: 'Password123!', // contains uppercase, lowercase, number, and special character
        avatar: 'https://i.ibb.co/3z72vmc/clean-lake-mountains-range-trees-nature-4k.webp',
        role: 'USER',
      });
      console.log(`✓ Seed user created: ${user.email} (ID: ${user._id})`);
    } else {
      console.log(`✓ Seed user already exists: ${user.email}`);
    }

    const postCount = await Post.countDocuments();
    if (postCount === 0) {
      console.log('📝 Seeding posts from sample_posts.json...');
      
      const samplePostsPath = path.join(__dirname, '../data/sample_posts.json');
      const rawData = fs.readFileSync(samplePostsPath, 'utf8');
      const postsData = JSON.parse(rawData);

      const mappedPosts = postsData.map((post: any) => {
        // Strip the MongoDB-specific $oid and $date if present
        const timeOfPost = post.timeOfPost && post.timeOfPost.$date 
          ? new Date(post.timeOfPost.$date) 
          : new Date();

        return {
          authorName: post.authorName || 'John Doe',
          title: post.title,
          imageLink: post.imageLink,
          categories: post.categories,
          description: post.description,
          isFeaturedPost: post.isFeaturedPost || false,
          timeOfPost: timeOfPost,
          authorId: user!._id,
        };
      });

      const insertedPosts = await Post.insertMany(mappedPosts);
      console.log(`✓ Seeded ${insertedPosts.length} posts successfully.`);

      // Update the user's posts array
      const postIds = insertedPosts.map(p => p._id);
      await User.findByIdAndUpdate(user._id, { $set: { posts: postIds } });
      console.log('✓ Updated seed user with the seeded posts.');
    } else {
      console.log(`✓ Database already has ${postCount} posts. Skipping posts seeding.`);
    }

    console.log('✨ Database seeding complete!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
