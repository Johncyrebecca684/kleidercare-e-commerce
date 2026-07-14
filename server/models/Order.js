import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for guest checkouts
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Card', 'Credit Card', 'UPI', 'Cash', 'Netbanking', 'Other']
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  razorpayOrderId: {
    type: String,
    required: false
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  orderId: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing'
  }
}, {
  timestamps: true
});

// Pre-save hook to generate a unique tracking order ID (e.g., ORD123456)
orderSchema.pre('save', async function(next) {
  if (this.orderId) return next();

  let unique = false;
  let attempts = 0;
  while (!unique && attempts < 10) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const candidateId = `ORD${randomDigits}`;
    const existing = await mongoose.models.Order.findOne({ orderId: candidateId });
    if (!existing) {
      this.orderId = candidateId;
      unique = true;
    }
    attempts++;
  }

  if (!this.orderId) {
    this.orderId = `ORD${Date.now()}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
