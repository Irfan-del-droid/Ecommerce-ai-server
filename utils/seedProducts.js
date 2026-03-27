/**
 * Product Seed Script
 * Run with: node server/utils/seedProducts.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../model/Product.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerceai';

const products = [
  // Clothing
  {
    name: 'Valhalla Black Tee',
    shortDescription: 'Premium cotton tee with Norse rune embroidery',
    description: 'A premium quality black t-shirt featuring authentic Norse rune embroidery. Made from 100% organic cotton for ultimate comfort.',
    price: 1299,
    originalPrice: 1999,
    category: 'Clothing',
    emoji: '👕',
    badge: 'Bestseller',
    glow: '#d4af37',
    stock: 100,
    isFeatured: true,
    tags: ['tshirt', 'black', 'norse', 'runes'],
  },
  {
    name: 'Ragnarok Hoodie',
    shortDescription: 'Heavyweight hoodie with Mjolnir print',
    description: 'Stay warm in style with this heavyweight hoodie featuring an iconic Mjolnir hammer print. Perfect for warriors.',
    price: 2499,
    originalPrice: 3499,
    category: 'Clothing',
    emoji: '🧥',
    badge: 'Hot',
    glow: '#c0c0c0',
    stock: 75,
    isFeatured: true,
    tags: ['hoodie', 'mjolnir', 'winter'],
  },
  {
    name: 'Odin Oversized Tee',
    shortDescription: 'Relaxed fit with Odin eye artwork',
    description: 'Oversized fit tee with artistic Odin single-eye design. Made for comfort and style.',
    price: 1499,
    originalPrice: 2199,
    category: 'Clothing',
    emoji: '👁️',
    badge: 'New',
    glow: '#4a90d9',
    stock: 120,
    isFeatured: false,
    tags: ['tshirt', 'oversized', 'odin'],
  },
  {
    name: 'Wolf Pack Jacket',
    shortDescription: 'Lightweight bomber with wolf emblem',
    description: 'A sleek lightweight bomber jacket featuring the wolf pack emblem. Perfect for transition seasons.',
    price: 3999,
    originalPrice: 5499,
    category: 'Clothing',
    emoji: '🐺',
    badge: 'Limited',
    glow: '#2c3e50',
    stock: 30,
    isFeatured: true,
    tags: ['jacket', 'bomber', 'wolf'],
  },
  {
    name: 'Fenrir Joggers',
    shortDescription: 'Tech fabric joggers with wolf detailing',
    description: 'Premium tech fabric joggers with subtle Fenrir wolf detailing. Comfortable for everyday wear or workout.',
    price: 1899,
    originalPrice: 2799,
    category: 'Clothing',
    emoji: '👖',
    badge: 'Hot',
    glow: '#34495e',
    stock: 85,
    isFeatured: false,
    tags: ['joggers', 'fenrir', 'athleisure'],
  },

  // Footwear
  {
    name: 'Bifrost Sneakers',
    shortDescription: 'Rainbow bridge inspired colorway',
    description: 'Stunning sneakers with Bifrost rainbow bridge inspired colorway. Limited edition release.',
    price: 4999,
    originalPrice: 6999,
    category: 'Footwear',
    emoji: '👟',
    badge: 'Limited',
    glow: '#e74c3c',
    stock: 25,
    isFeatured: true,
    tags: ['sneakers', 'bifrost', 'rainbow'],
  },
  {
    name: 'Viking Combat Boots',
    shortDescription: 'Rugged leather boots for modern warriors',
    description: 'Authentic rugged leather boots designed for the modern warrior. Durable and stylish.',
    price: 5999,
    originalPrice: 7999,
    category: 'Footwear',
    emoji: '🥾',
    badge: 'Premium',
    glow: '#8b4513',
    stock: 40,
    isFeatured: true,
    tags: ['boots', 'leather', 'combat'],
  },
  {
    name: 'Asgard Loafers',
    shortDescription: 'Premium leather slip-ons',
    description: 'Elegant premium leather loafers fit for Asgardian royalty. Perfect for formal occasions.',
    price: 3499,
    originalPrice: 4999,
    category: 'Footwear',
    emoji: '👞',
    badge: 'New',
    glow: '#d4af37',
    stock: 60,
    isFeatured: false,
    tags: ['loafers', 'leather', 'formal'],
  },

  // Accessories
  {
    name: 'Mjolnir Pendant',
    shortDescription: 'Sterling silver Thor hammer necklace',
    description: 'Authentic sterling silver Mjolnir pendant with intricate detailing. Comes with premium chain.',
    price: 2999,
    originalPrice: 4499,
    category: 'Accessories',
    emoji: '🔨',
    badge: 'Bestseller',
    glow: '#c0c0c0',
    stock: 150,
    isFeatured: true,
    tags: ['necklace', 'mjolnir', 'silver', 'thor'],
  },
  {
    name: 'Runic Leather Belt',
    shortDescription: 'Handcrafted with Elder Futhark runes',
    description: 'Handcrafted genuine leather belt with engraved Elder Futhark runes. Each piece is unique.',
    price: 1799,
    originalPrice: 2499,
    category: 'Accessories',
    emoji: '🪢',
    badge: 'Hot',
    glow: '#8b4513',
    stock: 90,
    isFeatured: false,
    tags: ['belt', 'leather', 'runes'],
  },
  {
    name: 'Valknut Ring',
    shortDescription: 'Stainless steel warriors ring',
    description: 'Powerful Valknut symbol ring crafted from premium stainless steel. Symbol of the fallen warriors.',
    price: 999,
    originalPrice: 1499,
    category: 'Accessories',
    emoji: '💍',
    badge: 'New',
    glow: '#a8a8a8',
    stock: 200,
    isFeatured: false,
    tags: ['ring', 'valknut', 'steel'],
  },
  {
    name: 'Shield Backpack',
    shortDescription: 'Tactical backpack with Viking shield design',
    description: 'Durable tactical backpack featuring iconic Viking shield design. Multiple compartments for organization.',
    price: 3299,
    originalPrice: 4299,
    category: 'Accessories',
    emoji: '🎒',
    badge: 'Sale',
    glow: '#2c3e50',
    stock: 45,
    isFeatured: true,
    tags: ['backpack', 'tactical', 'shield'],
  },
  {
    name: 'Raven Sunglasses',
    shortDescription: 'Polarized lenses with Huginn & Muninn motif',
    description: 'Premium polarized sunglasses with subtle Huginn & Muninn raven motif on the temples.',
    price: 2199,
    originalPrice: 2999,
    category: 'Accessories',
    emoji: '🕶️',
    badge: 'Hot',
    glow: '#1a1a2e',
    stock: 70,
    isFeatured: false,
    tags: ['sunglasses', 'raven', 'polarized'],
  },

  // Grooming
  {
    name: 'Beard Oil - Yggdrasil',
    shortDescription: 'Premium beard oil with cedarwood',
    description: 'Premium beard oil infused with cedarwood and pine, inspired by the World Tree Yggdrasil.',
    price: 799,
    originalPrice: 1199,
    category: 'Grooming',
    emoji: '🧔',
    badge: 'Bestseller',
    glow: '#228b22',
    stock: 180,
    isFeatured: true,
    tags: ['beard', 'oil', 'grooming'],
  },
  {
    name: 'Viking Beard Comb',
    shortDescription: 'Wooden comb with carved runes',
    description: 'Handcrafted wooden beard comb with authentic Viking rune carvings. Perfect for daily grooming.',
    price: 499,
    originalPrice: 799,
    category: 'Grooming',
    emoji: '🪮',
    badge: 'New',
    glow: '#8b4513',
    stock: 250,
    isFeatured: false,
    tags: ['comb', 'beard', 'wooden'],
  },
  {
    name: 'Berserker Cologne',
    shortDescription: 'Bold fragrance for modern warriors',
    description: 'A bold and commanding cologne for the modern warrior. Notes of leather, smoke, and Nordic pine.',
    price: 1999,
    originalPrice: 2999,
    category: 'Grooming',
    emoji: '🧪',
    badge: 'Hot',
    glow: '#4a0080',
    stock: 95,
    isFeatured: true,
    tags: ['cologne', 'fragrance', 'berserker'],
  },
  {
    name: 'Hair Pomade - Einherjar',
    shortDescription: 'Strong hold with matte finish',
    description: 'Professional-grade hair pomade with strong hold and matte finish. Style like a chosen warrior.',
    price: 699,
    originalPrice: 999,
    category: 'Grooming',
    emoji: '💇',
    badge: 'Sale',
    glow: '#2c3e50',
    stock: 140,
    isFeatured: false,
    tags: ['pomade', 'hair', 'styling'],
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const insertedProducts = await Product.insertMany(products);
    console.log(`Successfully seeded ${insertedProducts.length} products`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();

export default products;
