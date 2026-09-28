import mongoose from 'mongoose';
import { User } from '../src/models/user.model.js';
import { env } from '../src/config/env.js';

async function createAdmin() {
  const email = process.argv[2] || 'admin@nexuscommerce.com';
  const password = process.argv[3] || 'AdminPassword123!';
  const name = process.argv[4] || 'Nexus Administrator';

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected successfully.`);

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    existingUser.role = 'ADMIN';
    existingUser.isActive = true;
    existingUser.emailVerified = true;
    if (process.argv[3]) {
      existingUser.password = password;
    }
    await existingUser.save();
    console.log(`\nUpdated existing user to ADMIN:`);
    console.log(`Email:    ${existingUser.email}`);
    console.log(`Role:     ${existingUser.role}`);
  } else {
    const adminUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    });
    await adminUser.save();
    console.log(`\nCreated new ADMIN user successfully:`);
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     ADMIN`);
  }

  console.log(`\nYou can now log in at http://localhost:3000/login and visit http://localhost:3000/admin\n`);
  await mongoose.disconnect();
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('Error creating admin user:', err);
  process.exit(1);
});
