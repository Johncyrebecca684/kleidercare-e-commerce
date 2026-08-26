import express from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
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

// GET all categories
// GET /api/categories
router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// POST create a new category (Admin only)
// POST /api/categories
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const existing = await Category.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } 
    });

    if (existing) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCategory = new Category({
      name: trimmedName,
      slug,
      description: description || '',
      icon: icon || ''
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error while creating category' });
  }
});

// DELETE a category (Admin only)
// DELETE /api/categories/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { name: id }, { slug: id }] };
    } else {
      query = { $or: [{ name: id }, { slug: id }] };
    }

    const category = await Category.findOne(query);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if products are using this category
    const count = await Product.countDocuments({ category: category.name });
    
    await Category.findByIdAndDelete(category._id);
    res.json({ 
      success: true, 
      message: `Category "${category.name}" removed successfully`, 
      affectedProducts: count 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error while deleting category' });
  }
});

export default router;
