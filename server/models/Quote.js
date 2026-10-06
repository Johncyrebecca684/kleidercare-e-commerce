import mongoose from 'mongoose';

const QuoteItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  description: { type: String, default: '' },
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 18 },
  totalPrice: { type: Number, required: true }
}, { _id: false });

const QuoteSchema = new mongoose.Schema({
  quoteId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  customerPhone: {
    type: String,
    trim: true,
    default: ''
  },
  customerEmail: {
    type: String,
    trim: true,
    default: ''
  },
  executive: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  quoteDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  validUntil: {
    type: Date
  },
  quoteType: {
    type: String,
    enum: ['All Quotes', 'Sample Products', 'Standard Quote', 'Service Quote'],
    default: 'All Quotes'
  },
  settingType: {
    type: String,
    enum: ['GST Quote', 'KC', 'Non-GST Quote', 'Standard'],
    default: 'GST Quote'
  },
  closureProbability: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  status: {
    type: String,
    enum: ['Pending', 'Closed', 'Approved', 'Rejected', 'Draft'],
    default: 'Pending',
    index: true
  },
  convertedTo: {
    type: String,
    enum: ['Pending', 'Proforma Invoice', 'Invoice', 'Sales Order', 'None'],
    default: 'Pending',
    index: true
  },
  items: [QuoteItemSchema],
  subTotal: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
    index: true
  },
  notes: {
    type: String,
    default: ''
  },
  termsAndConditions: {
    type: String,
    default: '1. Quotation valid for 15 days.\n2. Payment terms: 100% advance or as agreed.\n3. Goods once sold will not be taken back without prior authorization.'
  },
  branch: {
    type: String,
    default: 'Main Branch - Mumbai'
  },
  createdBy: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true
});

QuoteSchema.index({ quoteId: 'text', customerName: 'text', executive: 'text' });

const Quote = mongoose.models.Quote || mongoose.model('Quote', QuoteSchema);

export default Quote;
