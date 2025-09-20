import mongoose from 'mongoose';

const InvgenRecordsSchema = new mongoose.Schema({
  unitNo: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  emailId: {
    type: String,
    required: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address'],
  },
  contactNo: {
    type: String,
    required: true,
  },
  unitType: {
    type: String,
    required: true,
  },
  areaSqYrd: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

const InvgenRecords = mongoose.model('InvgenRecords', InvgenRecordsSchema);

export default InvgenRecords;
