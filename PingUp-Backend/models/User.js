const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @fileoverview User Model
 * Defines the schema for users, including role-based access control (RBAC),
 * authentication fields, and online status tracking.
 */

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true, trim: true, lowercase: true,
  },
  password: { type: String, required: true },
  
  // ─── Role-Based Access Control (RBAC) ─────────────────────────
  role: {
    type: String,
    enum: ['owner', 'moderator', 'member'],
    default: 'member',
  },
  
  // ─── Profile Information ────────────────────────────────────────
  email: { type: String, default: '' },
  displayName: { type: String, default: '' },
  phone: { type: String, default: '' },
  
  // ─── Presence & Session Tracking ──────────────────────────────
  online: { type: Boolean, default: false },
  socketId: { type: String, default: null },
  isFirst: { type: Boolean, default: false }, // Flag for the first registered user (usually assigned 'owner' role)
  loginCount: { type: Number, default: 0 },
}, { timestamps: true });

/**
 * Mongoose Pre-Save Hook: Password Hashing
 * Automatically hashes the password using bcrypt before saving to the database.
 * This ensures plain-text passwords are never stored. It only hashes if the
 * password field was modified (to prevent re-hashing an already hashed password).
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/**
 * Compares a plain-text password attempt with the stored hashed password.
 * @param {string} plain - The plain-text password attempt
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

/**
 * Returns a sanitized version of the user object safe for public/client transmission.
 * Strips out sensitive fields like the password hash.
 * @returns {Object} Safe user object
 */
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
