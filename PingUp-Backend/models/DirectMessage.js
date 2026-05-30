const mongoose = require('mongoose');

/**
 * @fileoverview Direct Message Model
 * Defines the schema for private 1-on-1 messages between users.
 */

// ─── Architecture Note: Conversation ID ───────────────────────────
// To quickly query all messages between two users without complex $or queries,
// we generate a consistent `conversationId` by sorting their two ObjectIds 
// alphabetically and joining them with an underscore:
// e.g., `conversationId = [userId1, userId2].sort().join('_')`
// This ensures UserA -> UserB and UserB -> UserA both hash to the exact same ID.
// ──────────────────────────────────────────────────────────────────

const directMessageSchema = new mongoose.Schema({
  // ─── Routing ────────────────────────────────────────────────────
  conversationId: { type: String, required: true, index: true },
  participants:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // ─── Author ─────────────────────────────────────────────────────
  senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderUsername: { type: String, required: true },
  senderRole:     { type: String, required: true },
  
  // ─── Content & State ────────────────────────────────────────────
  text:           { type: String, required: true },
  deleted:        { type: Boolean, default: false },
  read:           { type: Boolean, default: false }, // Read receipt tracking
  
  // ─── Idempotency ────────────────────────────────────────────────
  // Prevents duplicate DMs if the frontend retries sending due to a network timeout
  clientId:       { type: String, sparse: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
