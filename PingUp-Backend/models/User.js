const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true, trim: true, lowercase: true,
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['owner', 'moderator', 'member'],
    default: 'member',
  },
  email: { type: String, default: '' },
  displayName: { type: String, default: '' },
  phone: { type: String, default: '' },
  online: { type: Boolean, default: false },
  socketId: { type: String, default: null },
  isFirst: { type: Boolean, default: false }, // true = first ever user (owner)
  loginCount: { type: Number, default: 0 },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Strip sensitive fields
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    username: this.username,
    displayName: this.displayName || this.username,
    role: this.role,
    email: this.email,
    phone: this.phone,
    online: this.online,
    isFirst: this.isFirst,
  };
};

module.exports = mongoose.model('User', userSchema);
