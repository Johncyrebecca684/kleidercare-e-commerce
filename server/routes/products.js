import express from 'express';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// Helper middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error in admin authorization' });
  }
};

// GET all products
// GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// POST create a new product (Admin only)
// POST /api/products
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, price, originalPrice, image, description, badge, specifications } = req.body;

    if (!name || !category || price === undefined || originalPrice === undefined || !image) {
      return res.status(400).json({ message: 'Missing required product fields' });
    }

    // Generate unique ID for frontend
    const id = `PROD-${Date.now()}`;

    const newProduct = new Product({
      id,
      name,
      category,
      price: Number(price),
      originalPrice: Number(originalPrice),
      image,
      description: description || '',
      badge: badge || null,
      specifications: specifications || {}
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

// PUT update an existing product (Admin only)
// PUT /api/products/:id (here id refers to the custom id field, e.g., '1' or 'PROD-xxx')
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, price, originalPrice, image, description, badge, specifications } = req.body;
    
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name) product.name = name;
    if (category) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (image) product.image = image;
    if (description !== undefined) product.description = description;
    if (badge !== undefined) product.badge = badge;
    if (specifications) product.specifications = specifications;

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
});

// DELETE a product (Admin only)
// DELETE /api/products/:id (here id refers to the custom id field, e.g., '1' or 'PROD-xxx')
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

export default router;
