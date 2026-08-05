import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    default: 4.5
  },
  reviews: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  badge: {
    type: String,
    default: null
  },
  sku: {
    type: String,
    default: ''
  },
  stock: {
    type: Number,
    default: 50
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  stockStatus: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;
