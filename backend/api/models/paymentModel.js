import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  invGenRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvgenRecords',
    required: true,
  },
  paymentType: {
    type: String,
    enum: ['Security', 'Facility'],
    required: true,
  },
  paymentAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const InvGenPayment = mongoose.model('InvGenPayment', paymentSchema);
export default InvGenPayment;
