const mongoose = require('mongoose');

/**
 * @fileoverview Room Model
 * Defines the schema for chat rooms (channels) within the application.
 * Supports categorization, channel ordering, and access control modifiers
 * (private, read-only, locked).
 */

const RoomSchema = new mongoose.Schema({
  // ─── Basic Details ──────────────────────────────────────────────
  name:           { type: String, required: true, unique: true, trim: true },
  description:    { type: String, default: '' },
  emoji:          { type: String, default: '💬' },
  category:       { type: String, default: 'general' },
  order:          { type: Number, default: 0 },
  createdBy:      { type: String, default: 'system' },

  // ─── Access Control Modifiers ───────────────────────────────────
  isPrivate:      { type: Boolean, default: false },   // hidden from members, visible only to allowedUsers and owner/mods
  isReadOnly:     { type: Boolean, default: false },   // members cannot send messages, but can read
  isLocked:       { type: Boolean, default: false },   // no one can send messages (not even mods)

  // ─── Relationships ──────────────────────────────────────────────
  // Array of ObjectIds pointing to Users who are explicitly granted access to this private room
  allowedUsers:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Array of ObjectIds pointing to Messages that have been pinned in this room
  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
