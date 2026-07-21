import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, family: 4 });
  const result = await mongoose.connection.collection('users').deleteMany({ isVerified: false });
  console.log('✅ Deleted unverified users:', result.deletedCount);
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await mongoose.disconnect();
}
