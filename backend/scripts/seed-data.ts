import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Category } from '../src/models/category.model.js';
import { Brand } from '../src/models/brand.model.js';
import { Product } from '../src/models/product.model.js';
import { Coupon } from '../src/models/coupon.model.js';
import { FAQ } from '../src/models/faq.model.js';
import { Order } from '../src/models/order.model.js';
import { Review } from '../src/models/review.model.js';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected successfully.');

  // 1. Seed Categories
  console.log('Seeding Categories...');
  const categoryData = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Laptops, smartphones, audio equipment and next-gen gadgets.',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Audio & Sound',
      slug: 'audio',
      description: 'Studio-grade headphones, earbuds, and premium wireless soundbars.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Smart Wearables',
      slug: 'wearables',
      description: 'Connected smartwatches, health trackers, and smart rings.',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Footwear & Sneakers',
      slug: 'footwear',
      description: 'High-performance running shoes, sneakers, and lifestyle footwear.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Apparel & Fashion',
      slug: 'apparel',
      description: 'Modern minimalist streetwear, technical apparel, and everyday fits.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Bags, wallets, organizers, and tech carry accessories.',
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
      isActive: true,
    },
  ];

  const categoriesMap: Record<string, any> = {};
  for (const cat of categoryData) {
    const existing = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true, new: true }
    );
    categoriesMap[cat.slug] = existing;
  }

  // 2. Seed Brands
  console.log('Seeding Brands...');
  const brandData = [
    {
      name: 'Apple',
      slug: 'apple',
      description: 'Innovative personal technology, smartphones, and computers.',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
      website: 'https://apple.com',
      isActive: true,
    },
    {
      name: 'Sony',
      slug: 'sony',
      description: 'Pioneers in high-resolution audio, imaging, and gaming consoles.',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg',
      website: 'https://sony.com',
      isActive: true,
    },
    {
      name: 'Nike',
      slug: 'nike',
      description: 'World-renowned athletic footwear, apparel, and performance gear.',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
      website: 'https://nike.com',
      isActive: true,
    },
    {
      name: 'Bose',
      slug: 'bose',
      description: 'Legendary noise-cancelling technology and acoustic excellence.',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Bose_logo.svg',
      website: 'https://bose.com',
      isActive: true,
    },
    {
      name: 'Samsung',
      slug: 'samsung',
      description: 'Cutting-edge displays, Galaxy smartphones, and smart electronics.',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
      website: 'https://samsung.com',
      isActive: true,
    },
    {
      name: 'Nexus Originals',
      slug: 'nexus-originals',
      description: 'Proprietary minimalist everyday carry and high-durability essentials.',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      website: 'https://nexuscommerce.local',
      isActive: true,
    },
  ];

  const brandsMap: Record<string, any> = {};
  for (const b of brandData) {
    const existing = await Brand.findOneAndUpdate(
      { slug: b.slug },
      { $set: b },
      { upsert: true, new: true }
    );
    brandsMap[b.slug] = existing;
  }

  // 3. Seed Users (Admin & Customer)
  console.log('Seeding Demo Users...');
  const usersToSeed = [
    {
      name: 'Nexus Administrator',
      email: 'admin@nexuscommerce.com',
      password: 'AdminPassword123!',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      phone: '+919876543210',
      addresses: [
        {
          street: '100 Nexus Tech Park, Cyber City',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560100',
          country: 'India',
          isDefault: true,
        },
      ],
    },
    {
      name: 'Demo Customer',
      email: 'user@example.com',
      password: 'UserPassword123!',
      role: 'USER',
      isActive: true,
      emailVerified: true,
      phone: '+919812345678',
      addresses: [
        {
          street: '42 MG Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
          isDefault: true,
        },
      ],
    },
  ];

  const usersMap: Record<string, any> = {};
  for (const u of usersToSeed) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = new User(u);
      await user.save();
    } else {
      user.role = u.role as any;
      user.name = u.name;
      user.phone = u.phone;
      user.isActive = true;
      user.emailVerified = true;
      if (u.addresses) user.addresses = u.addresses as any;
      await user.save();
    }
    usersMap[u.email] = user;
  }

  // 4. Seed Products
  console.log('Seeding Demo Products...');
  const productsData = [
    {
      name: 'Sony WH-1000XM5 Wireless Headphones',
      slug: 'sony-wh-1000xm5-wireless-headphones',
      description: 'Industry-leading noise cancelling with two processors and 8 microphones. Enjoy unprecedented clarity with High-Resolution Audio and crystal clear hands-free calling with 4 beamforming microphones.',
      shortDescription: 'Flagship wireless active noise cancelling headphones with 30-hour battery life.',
      category: categoriesMap['audio']._id,
      brand: brandsMap['sony']._id,
      price: 29990,
      compareAtPrice: 34990,
      discount: 14,
      stock: 45,
      SKU: 'SNY-WH1000XM5-BLK',
      tags: ['audio', 'headphones', 'bluetooth', 'noise-cancelling', 'sony'],
      images: [
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', alt: 'Sony WH-1000XM5 Headphones Black', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80', alt: 'Side Profile', isPrimary: false },
      ],
      specifications: [
        { name: 'Driver Unit', value: '30mm, Dome type' },
        { name: 'Battery Life', value: 'Up to 30 Hours (NC ON)' },
        { name: 'Weight', value: 'Approx. 250g' },
        { name: 'Bluetooth', value: 'v5.2 (LDAC, AAC, SBC)' },
      ],
      attributes: [
        { name: 'Color', value: 'Midnight Black' },
        { name: 'Form Factor', value: 'Over Ear' },
      ],
      variants: [
        { name: 'Midnight Black', sku: 'SNY-WH1000XM5-BLK', price: 29990, stock: 25, attributes: [{ name: 'Color', value: 'Black' }] },
        { name: 'Silver White', sku: 'SNY-WH1000XM5-SLV', price: 29990, stock: 20, attributes: [{ name: 'Color', value: 'Silver' }] },
      ],
      rating: 4.8,
      reviewCount: 38,
      isActive: true,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
    },
    {
      name: 'Apple iPhone 15 Pro Max (256GB)',
      slug: 'apple-iphone-15-pro-max-256gb',
      description: 'Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
      shortDescription: 'Aerospace-grade titanium design with A17 Pro Bionic chip and 5x optical zoom.',
      category: categoriesMap['electronics']._id,
      brand: brandsMap['apple']._id,
      price: 154900,
      compareAtPrice: 159900,
      discount: 3,
      stock: 18,
      SKU: 'APL-IP15PM-256-NT',
      tags: ['electronics', 'apple', 'smartphone', 'iphone', '5g', 'titanium'],
      images: [
        { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80', alt: 'Apple iPhone 15 Pro Natural Titanium', isPrimary: true },
      ],
      specifications: [
        { name: 'Display', value: '6.7-inch Super Retina XDR OLED ProMotion 120Hz' },
        { name: 'Processor', value: 'A17 Pro chip with 6-core GPU' },
        { name: 'Camera', value: '48MP Main | 12MP Ultra Wide | 12MP 5x Telephoto' },
      ],
      attributes: [
        { name: 'Color', value: 'Natural Titanium' },
        { name: 'Storage', value: '256GB' },
      ],
      variants: [
        { name: 'Natural Titanium 256GB', sku: 'APL-IP15PM-256-NT', price: 154900, stock: 10, attributes: [{ name: 'Color', value: 'Natural Titanium' }] },
        { name: 'Blue Titanium 256GB', sku: 'APL-IP15PM-256-BT', price: 154900, stock: 8, attributes: [{ name: 'Color', value: 'Blue Titanium' }] },
      ],
      rating: 4.9,
      reviewCount: 64,
      isActive: true,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
    },
    {
      name: 'Nike Air Zoom Pegasus 40 Running Shoes',
      slug: 'nike-air-zoom-pegasus-40',
      description: 'A springy ride for every run, the Peg familiar, just-for-you feel returns to help you accomplish your goals. This version has the same responsiveness and neutral support you love, but with improved comfort in sensitive areas of your foot.',
      shortDescription: 'Responsive daily running trainer with dual Zoom Air units and engineered mesh.',
      category: categoriesMap['footwear']._id,
      brand: brandsMap['nike']._id,
      price: 9995,
      compareAtPrice: 11995,
      discount: 17,
      stock: 60,
      SKU: 'NKE-PEG40-RED-09',
      tags: ['footwear', 'nike', 'running', 'shoes', 'sneakers', 'sports'],
      images: [
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80', alt: 'Nike Pegasus 40 Red', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80', alt: 'Sneaker Angle View', isPrimary: false },
      ],
      specifications: [
        { name: 'Cushioning', value: 'Nike React technology with 2 Zoom Air units' },
        { name: 'Drop', value: '10mm' },
        { name: 'Weight', value: '288g (Men size 9)' },
      ],
      attributes: [
        { name: 'Color', value: 'Crimson Red' },
        { name: 'Gender', value: 'Unisex' },
      ],
      variants: [
        { name: 'UK 8 / Crimson Red', sku: 'NKE-PEG40-RED-08', price: 9995, stock: 20, attributes: [{ name: 'Size', value: 'UK 8' }] },
        { name: 'UK 9 / Crimson Red', sku: 'NKE-PEG40-RED-09', price: 9995, stock: 25, attributes: [{ name: 'Size', value: 'UK 9' }] },
        { name: 'UK 10 / Crimson Red', sku: 'NKE-PEG40-RED-10', price: 9995, stock: 15, attributes: [{ name: 'Size', value: 'UK 10' }] },
      ],
      rating: 4.7,
      reviewCount: 42,
      isActive: true,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
    },
    {
      name: 'Apple Watch Ultra 2 Titanium GPS + Cellular',
      slug: 'apple-watch-ultra-2-titanium',
      description: 'The most rugged and capable Apple Watch pushes the limits again. Featuring the all-new S9 SiP, a magical new way to use your watch without touching the screen, and the brightest Apple display ever.',
      shortDescription: '49mm aerospace-grade titanium case with up to 72 hours in Low Power Mode.',
      category: categoriesMap['wearables']._id,
      brand: brandsMap['apple']._id,
      price: 89900,
      compareAtPrice: 89900,
      discount: 0,
      stock: 12,
      SKU: 'APL-WTCH-ULTRA2-49',
      tags: ['wearables', 'apple', 'smartwatch', 'fitness', 'gps', 'cellular'],
      images: [
        { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80', alt: 'Apple Watch Ultra 2 on wrist', isPrimary: true },
      ],
      specifications: [
        { name: 'Case Size', value: '49mm Titanium' },
        { name: 'Water Resistance', value: '100m water resistant, 40m dive rated' },
        { name: 'Display Brightness', value: '3000 nits peak' },
      ],
      attributes: [
        { name: 'Band Style', value: 'Orange Ocean Band' },
      ],
      variants: [
        { name: 'Orange Ocean Band', sku: 'APL-WTCH-ULTRA2-ORG', price: 89900, stock: 6, attributes: [{ name: 'Band', value: 'Orange Ocean' }] },
        { name: 'Blue Trail Loop', sku: 'APL-WTCH-ULTRA2-TRL', price: 89900, stock: 6, attributes: [{ name: 'Band', value: 'Trail Loop' }] },
      ],
      rating: 4.9,
      reviewCount: 29,
      isActive: true,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: true,
    },
    {
      name: 'Bose QuietComfort Ultra Wireless Earbuds',
      slug: 'bose-quietcomfort-ultra-earbuds',
      description: 'Breakthrough spatialized audio for more immersive listening that makes your music feel more real than ever before. World-class noise cancellation and CustomTune technology sound shaped to you.',
      shortDescription: 'World-class noise cancellation with spatial audio and up to 6 hours listening time.',
      category: categoriesMap['audio']._id,
      brand: brandsMap['bose']._id,
      price: 25900,
      compareAtPrice: 28900,
      discount: 10,
      stock: 30,
      SKU: 'BOS-QCU-EARBUDS-BLK',
      tags: ['audio', 'earbuds', 'bose', 'wireless', 'noise-cancelling'],
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', alt: 'Bose Wireless Earbuds Case', isPrimary: true },
      ],
      specifications: [
        { name: 'Battery', value: '6 hours (4 hours with Immersive Audio)' },
        { name: 'Microphones', value: '9 microphones total' },
        { name: 'Bluetooth', value: 'v5.3 (9 meters range)' },
      ],
      attributes: [
        { name: 'Color', value: 'Black' },
      ],
      variants: [
        { name: 'Black', sku: 'BOS-QCU-EARBUDS-BLK', price: 25900, stock: 15, attributes: [{ name: 'Color', value: 'Black' }] },
        { name: 'White Smoke', sku: 'BOS-QCU-EARBUDS-WHT', price: 25900, stock: 15, attributes: [{ name: 'Color', value: 'White Smoke' }] },
      ],
      rating: 4.6,
      reviewCount: 19,
      isActive: true,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: true,
    },
    {
      name: 'Samsung Galaxy S24 Ultra 5G (512GB)',
      slug: 'samsung-galaxy-s24-ultra-512gb',
      description: 'Meet Galaxy S24 Ultra, the ultimate form of Galaxy Ultra with a new titanium exterior and a 6.8-inch flat display. It is an absolute marvel of design with Galaxy AI built in.',
      shortDescription: 'Galaxy AI with 200MP camera, titanium frame and built-in S Pen.',
      category: categoriesMap['electronics']._id,
      brand: brandsMap['samsung']._id,
      price: 139999,
      compareAtPrice: 144999,
      discount: 3,
      stock: 15,
      SKU: 'SAM-S24U-512-GRY',
      tags: ['electronics', 'samsung', 'galaxy', 'android', 'ai', '5g'],
      images: [
        { url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80', alt: 'Samsung Galaxy S24 Ultra', isPrimary: true },
      ],
      specifications: [
        { name: 'Display', value: '6.8-inch Dynamic AMOLED 2X QHD+ 120Hz' },
        { name: 'Processor', value: 'Snapdragon 8 Gen 3 for Galaxy' },
        { name: 'Battery', value: '5000 mAh with 45W Fast Charging' },
      ],
      attributes: [
        { name: 'Color', value: 'Titanium Gray' },
        { name: 'Storage', value: '512GB' },
      ],
      variants: [
        { name: 'Titanium Gray 512GB', sku: 'SAM-S24U-512-GRY', price: 139999, stock: 15, attributes: [{ name: 'Color', value: 'Titanium Gray' }] },
      ],
      rating: 4.8,
      reviewCount: 31,
      isActive: true,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
    },
    {
      name: 'Nexus Minimalist Carbon Carry Backpack',
      slug: 'nexus-minimalist-carbon-carry-backpack',
      description: 'Engineered from military-grade Cordura ballistic nylon with YKK AquaGuard waterproof zippers. Features dedicated 16-inch laptop compartment, hidden passport pocket, and expandable capacity.',
      shortDescription: '24L waterproof urban commuter backpack with magnetic Fidlock closures.',
      category: categoriesMap['accessories']._id,
      brand: brandsMap['nexus-originals']._id,
      price: 6499,
      compareAtPrice: 8999,
      discount: 28,
      stock: 40,
      SKU: 'NXS-BAG-CRB-24L',
      tags: ['accessories', 'backpack', 'travel', 'minimalist', 'waterproof', 'nexus-originals'],
      images: [
        { url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80', alt: 'Nexus Backpack Matte Black', isPrimary: true },
      ],
      specifications: [
        { name: 'Capacity', value: '24 Liters' },
        { name: 'Laptop Sleeve', value: 'Up to 16-inch MacBook Pro' },
        { name: 'Material', value: '1000D Cordura Nylon' },
      ],
      attributes: [
        { name: 'Color', value: 'Stealth Black' },
      ],
      variants: [
        { name: 'Stealth Black', sku: 'NXS-BAG-CRB-24L', price: 6499, stock: 40, attributes: [{ name: 'Color', value: 'Stealth Black' }] },
      ],
      rating: 4.9,
      reviewCount: 52,
      isActive: true,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
    },
    {
      name: 'Nexus MagSafe Slim Leather Card Wallet',
      slug: 'nexus-magsafe-slim-leather-wallet',
      description: 'Crafted from full-grain vegetable-tanned Italian leather with strong built-in neodymium magnets that securely snap to the back of your iPhone. Holds up to 3 cards with RFID shielding.',
      shortDescription: 'Full-grain Italian leather magnetic cardholder with RFID protection.',
      category: categoriesMap['accessories']._id,
      brand: brandsMap['nexus-originals']._id,
      price: 1999,
      compareAtPrice: 2999,
      discount: 33,
      stock: 85,
      SKU: 'NXS-WLT-MAG-BRN',
      tags: ['accessories', 'wallet', 'leather', 'magsafe', 'nexus-originals'],
      images: [
        { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', alt: 'Nexus Leather Wallet', isPrimary: true },
      ],
      specifications: [
        { name: 'Capacity', value: '3 Credit Cards or Cash' },
        { name: 'Compatibility', value: 'iPhone 12 through iPhone 16 MagSafe' },
        { name: 'Leather Type', value: 'Italian Full-Grain Vegetable Tanned' },
      ],
      attributes: [
        { name: 'Color', value: 'Saddle Brown' },
      ],
      variants: [
        { name: 'Saddle Brown', sku: 'NXS-WLT-MAG-BRN', price: 1999, stock: 50, attributes: [{ name: 'Color', value: 'Saddle Brown' }] },
        { name: 'Obsidian Black', sku: 'NXS-WLT-MAG-BLK', price: 1999, stock: 35, attributes: [{ name: 'Color', value: 'Obsidian Black' }] },
      ],
      rating: 4.7,
      reviewCount: 23,
      isActive: true,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: true,
    },
  ];

  const seededProducts: any[] = [];
  for (const prod of productsData) {
    const existing = await Product.findOneAndUpdate(
      { slug: prod.slug },
      { $set: prod },
      { upsert: true, new: true }
    );
    seededProducts.push(existing);
  }

  // 5. Seed Coupons
  console.log('Seeding Discount Coupons...');
  const couponData = [
    {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      minimumOrderValue: 999,
      maximumDiscount: 1500,
      startDate: new Date('2024-01-01'),
      expiryDate: new Date('2030-12-31'),
      usageLimit: 10000,
      usedCount: 142,
      perUserLimit: 1,
      isActive: true,
    },
    {
      code: 'NEXUS500',
      type: 'FIXED_AMOUNT',
      value: 500,
      minimumOrderValue: 2499,
      startDate: new Date('2024-01-01'),
      expiryDate: new Date('2030-12-31'),
      usageLimit: 5000,
      usedCount: 78,
      perUserLimit: 2,
      isActive: true,
    },
    {
      code: 'FESTIVE20',
      type: 'PERCENTAGE',
      value: 20,
      minimumOrderValue: 4999,
      maximumDiscount: 3000,
      startDate: new Date('2024-01-01'),
      expiryDate: new Date('2030-12-31'),
      usageLimit: 2000,
      usedCount: 56,
      perUserLimit: 1,
      isActive: true,
    },
  ];

  for (const c of couponData) {
    await Coupon.findOneAndUpdate(
      { code: c.code },
      { $set: c },
      { upsert: true, new: true }
    );
  }

  // 6. Seed FAQs
  console.log('Seeding FAQs & Knowledge Base...');
  const faqData = [
    {
      question: 'What is the estimated delivery timeframe?',
      answer: 'Standard metro shipping takes 2-4 business days. Regional and rural destinations usually arrive within 4-7 business days. Express next-day delivery is available in select metropolitan cities.',
      category: 'Shipping & Delivery',
      slug: 'estimated-delivery-timeframe',
      order: 1,
      isPublished: true,
    },
    {
      question: 'What is your returns and refund policy?',
      answer: 'We provide a hassle-free 14-day return window from the date of delivery. Items must be in original condition with intact packaging. Refunds are processed back to your original payment method within 5-7 business days of inspection.',
      category: 'Returns & Refunds',
      slug: 'returns-and-refund-policy',
      order: 2,
      isPublished: true,
    },
    {
      question: 'Which payment methods are accepted on Nexus Commerce?',
      answer: 'We accept all major Credit/Debit Cards (Visa, Mastercard, RuPay, Amex), UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD) for eligible pin codes.',
      category: 'Payments',
      slug: 'accepted-payment-methods',
      order: 3,
      isPublished: true,
    },
    {
      question: 'How does the AI Shopping Assistant work?',
      answer: 'Our conversational AI assistant understands natural shopping requests, helps you compare products, checks real-time inventory, and recommends options matched to your budget and specifications.',
      category: 'Ordering',
      slug: 'how-ai-shopping-assistant-works',
      order: 4,
      isPublished: true,
    },
  ];

  for (const f of faqData) {
    await FAQ.findOneAndUpdate(
      { slug: f.slug },
      { $set: f },
      { upsert: true, new: true }
    );
  }

  // 7. Seed Sample Orders for Demo Customer
  console.log('Seeding Sample Customer Orders...');
  const demoCustomer = usersMap['user@example.com'];
  const p1 = seededProducts[0]; // Sony headphones
  const p2 = seededProducts[2]; // Nike shoes

  const existingOrders = await Order.countDocuments({ user: demoCustomer._id });
  if (existingOrders === 0) {
    const order1 = new Order({
      orderNumber: `ORD-${Date.now().toString().slice(-8)}-001`,
      user: demoCustomer._id,
      items: [
        {
          product: p1._id,
          name: p1.name,
          sku: p1.SKU,
          variantSku: p1.variants[0]?.sku || p1.SKU,
          price: p1.price,
          quantity: 1,
          lineTotal: p1.price,
          image: p1.images[0]?.url,
        },
      ],
      shippingAddress: demoCustomer.addresses[0],
      subtotal: p1.price,
      discount: 0,
      tax: Math.round(p1.price * 0.18),
      shippingFee: 0,
      totalAmount: p1.price + Math.round(p1.price * 0.18),
      currency: 'INR',
      paymentStatus: 'PAID',
      paymentMethod: 'RAZORPAY',
      orderStatus: 'DELIVERED',
      status: 'DELIVERED',
      inventoryDeducted: true,
      statusHistory: [
        { status: 'CONFIRMED', timestamp: new Date(Date.now() - 7 * 86400000), comment: 'Order placed successfully' },
        { status: 'SHIPPED', timestamp: new Date(Date.now() - 5 * 86400000), comment: 'Dispatched via BlueDart Express' },
        { status: 'DELIVERED', timestamp: new Date(Date.now() - 2 * 86400000), comment: 'Delivered to customer' },
      ],
      tracking: {
        carrier: 'BlueDart Express',
        trackingNumber: 'BLUEDART-8934710',
        trackingUrl: 'https://bluedart.com',
      },
    });
    await order1.save();

    const order2 = new Order({
      orderNumber: `ORD-${Date.now().toString().slice(-8)}-002`,
      user: demoCustomer._id,
      items: [
        {
          product: p2._id,
          name: p2.name,
          sku: p2.SKU,
          variantSku: p2.variants[0]?.sku || p2.SKU,
          price: p2.price,
          quantity: 1,
          lineTotal: p2.price,
          image: p2.images[0]?.url,
        },
      ],
      shippingAddress: demoCustomer.addresses[0],
      subtotal: p2.price,
      discount: 500,
      tax: Math.round((p2.price - 500) * 0.18),
      shippingFee: 99,
      totalAmount: p2.price - 500 + Math.round((p2.price - 500) * 0.18) + 99,
      currency: 'INR',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
      orderStatus: 'PROCESSING',
      status: 'PROCESSING',
      inventoryDeducted: true,
      statusHistory: [
        { status: 'CONFIRMED', timestamp: new Date(Date.now() - 1 * 86400000), comment: 'Order confirmed' },
        { status: 'PROCESSING', timestamp: new Date(), comment: 'Packing in warehouse' },
      ],
    });
    await order2.save();
  }

  // 8. Seed Sample Reviews
  console.log('Seeding Sample Reviews...');
  const reviewCount = await Review.countDocuments();
  if (reviewCount === 0 && p1) {
    await Review.create({
      product: p1._id,
      user: demoCustomer._id,
      userName: demoCustomer.name,
      rating: 5,
      title: 'Best Noise Cancelling Headphones I have ever owned',
      comment: 'The sound stage is incredible, microphone call quality is crystal clear even on windy streets, and battery lasts literally days. Worth every rupee.',
      isVerifiedPurchase: true,
      isApproved: true,
      helpfulVotes: 14,
    });
  }

  console.log('\n========================================================');
  console.log('Demo Data Seeding Completed Successfully! 🎉');
  console.log('========================================================');
  console.log('Categories:  6 categories');
  console.log('Brands:      6 premium brands');
  console.log('Products:    8 flagship products with images, variants & specs');
  console.log('Coupons:     WELCOME10, NEXUS500, FESTIVE20');
  console.log('FAQs:        4 published help center articles');
  console.log('Demo Users:');
  console.log('  1. ADMIN:    admin@nexuscommerce.com  / AdminPassword123!');
  console.log('  2. CUSTOMER: user@example.com         / UserPassword123!');
  console.log('Sample Orders: 2 seeded orders with status & tracking');
  console.log('========================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error during database seeding:', err);
  process.exit(1);
});
