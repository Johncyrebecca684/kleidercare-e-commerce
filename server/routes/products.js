import express from 'express';
import mongoose from 'mongoose';
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
// POST create a new product (Admin only)
// POST /api/products
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, price, originalPrice, image, images, description, badge, specifications, sku, stock, lowStockThreshold } = req.body;

    if (!name || !category || price === undefined || originalPrice === undefined || (!image && (!images || images.length === 0))) {
      return res.status(400).json({ message: 'Missing required product fields' });
    }

    const id = `PROD-${Date.now()}`;
    const productStock = stock !== undefined ? Number(stock) : 50;
    const threshold = lowStockThreshold !== undefined ? Number(lowStockThreshold) : 10;
    
    let stockStatus = 'In Stock';
    if (productStock <= 0) stockStatus = 'Out of Stock';
    else if (productStock <= threshold) stockStatus = 'Low Stock';

    const validImages = Array.isArray(images) ? images.filter(Boolean) : (image ? [image] : []);
    const primaryImage = validImages[0] || image || '';

    const newProduct = new Product({
      id,
      name,
      category,
      price: Number(price),
      originalPrice: Number(originalPrice),
      image: primaryImage,
      images: validImages.length > 0 ? validImages : [primaryImage],
      description: description || '',
      badge: badge || null,
      sku: sku || `SKU-${id}`,
      stock: productStock,
      lowStockThreshold: threshold,
      stockStatus,
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
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, price, originalPrice, image, images, description, badge, specifications, sku, stock, lowStockThreshold } = req.body;
    
    const reqIdStr = String(req.params.id);
    let query;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query = { $or: [{ _id: req.params.id }, { id: req.params.id }, { id: reqIdStr }] };
    } else {
      query = { $or: [{ id: req.params.id }, { id: reqIdStr }] };
    }

    const product = await Product.findOne(query);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name) product.name = name;
    if (category) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    
    if (images !== undefined) {
      const validImages = Array.isArray(images) ? images.filter(Boolean) : [];
      product.images = validImages;
      if (validImages.length > 0) {
        product.image = validImages[0];
      }
    } else if (image) {
      product.image = image;
      if (!product.images || product.images.length === 0) {
        product.images = [image];
      }
    }

    if (description !== undefined) product.description = description;
    if (badge !== undefined) product.badge = badge;
    if (sku !== undefined) product.sku = sku;
    if (specifications) product.specifications = specifications;
    
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);
    if (stock !== undefined) {
      product.stock = Math.max(0, Number(stock));
      const threshold = product.lowStockThreshold || 10;
      if (product.stock <= 0) product.stockStatus = 'Out of Stock';
      else if (product.stock <= threshold) product.stockStatus = 'Low Stock';
      else product.stockStatus = 'In Stock';
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
});

// PATCH quick stock update (Admin only)
router.patch('/:id/stock', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { stock } = req.body;
    const reqIdStr = String(req.params.id);
    let query;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query = { $or: [{ _id: req.params.id }, { id: req.params.id }, { id: reqIdStr }] };
    } else {
      query = { $or: [{ id: req.params.id }, { id: reqIdStr }] };
    }

    const product = await Product.findOne(query);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.stock = Math.max(0, Number(stock));
    const threshold = product.lowStockThreshold || 10;
    if (product.stock <= 0) product.stockStatus = 'Out of Stock';
    else if (product.stock <= threshold) product.stockStatus = 'Low Stock';
    else product.stockStatus = 'In Stock';

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error patching product stock:', error);
    res.status(500).json({ message: 'Server error while updating stock' });
  }
});

// POST bulk action on products (Admin only)
router.post('/bulk-action', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ids, action, payload } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No product IDs provided' });
    }

    const objectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    const idQuery = { $or: [{ _id: { $in: objectIds } }, { id: { $in: ids } }] };

    if (action === 'delete') {
      await Product.deleteMany(idQuery);
      return res.json({ success: true, message: `Deleted ${ids.length} products` });
    }

    if (action === 'updateStock') {
      const stockVal = Math.max(0, Number(payload.stock));
      const products = await Product.find(idQuery);
      for (let prod of products) {
        prod.stock = stockVal;
        const threshold = prod.lowStockThreshold || 10;
        if (prod.stock <= 0) prod.stockStatus = 'Out of Stock';
        else if (prod.stock <= threshold) prod.stockStatus = 'Low Stock';
        else prod.stockStatus = 'In Stock';
        await prod.save();
      }
      return res.json({ success: true, message: `Updated stock for ${ids.length} products` });
    }

    if (action === 'updateCategory') {
      await Product.updateMany(idQuery, { $set: { category: payload.category } });
      return res.json({ success: true, message: `Updated category for ${ids.length} products` });
    }

    return res.status(400).json({ message: 'Invalid action specified' });
  } catch (error) {
    console.error('Error performing bulk product action:', error);
    res.status(500).json({ message: 'Server error during bulk action' });
  }
});

// DELETE a product (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let query;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query = { $or: [{ _id: req.params.id }, { id: req.params.id }] };
    } else {
      query = { id: req.params.id };
    }

    const product = await Product.findOneAndDelete(query);
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
