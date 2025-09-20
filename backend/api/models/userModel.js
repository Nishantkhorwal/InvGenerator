import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'User'], 
    default: 'User' 
  },
  project: { 
    type: String, 
    enum: ['Normanton', 'Blank'], 
    required: function() {
      // project is required only for Users
      return this.role === 'User';
    }
  }
}, { timestamps: true });


const InvGenUser = mongoose.model('InvGenUser', userSchema);
export default InvGenUser;
