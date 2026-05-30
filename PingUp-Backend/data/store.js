const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * @fileoverview Store & Permissions
 * Provides role constants and hierarchy logic for the Role-Based Access Control (RBAC) system.
 */

// ─── Role Definitions ─────────────────────────────────────────────
const ROLES = {
  OWNER: 'owner',
  MODERATOR: 'moderator',
  MEMBER: 'member',
};

// ─── Role Hierarchy / Weights ─────────────────────────────────────
// Instead of checking string equality (e.g. role === 'owner' || role === 'moderator'),
// we assign numeric weights to roles. This allows us to check if a user is
// "at least" a certain role (e.g., userWeight >= moderatorWeight).
const ROLE_WEIGHTS = {
  [ROLES.OWNER]: 3,
  [ROLES.MODERATOR]: 2,
  [ROLES.MEMBER]: 1,
};

/**
 * Checks if a user has sufficient permissions based on their role weight.
 * @param {string} userRole - The role of the user (e.g. 'member')
 * @param {string} requiredRole - The minimum role required (e.g. 'moderator')
 * @returns {boolean} True if userRole weight >= requiredRole weight
 */
const hasPermission = (userRole, requiredRole) => {
  const userWeight = ROLE_WEIGHTS[userRole] || 0;
  const requiredWeight = ROLE_WEIGHTS[requiredRole] || 0;

  return userWeight >= requiredWeight;
}

const PERMISSIONS = {
  admin: ['send_message', 'create_room', 'delete_room', 'kick_user', 'promote_user', 'delete_message'],
  moderator: ['send_message', 'create_room', 'kick_user', 'delete_message'],
  member: ['send_message'],
};

// Seed users (passwords: "admin123", "mod123", "user123")
const users = [
  {
    id: uuidv4(),
    username: 'superadmin',
    password: bcrypt.hashSync('admin123', 10),
    role: ROLES.ADMIN,
    online: false,
    socketId: null,
  },
  {
    id: uuidv4(),
    username: 'moduser',
    password: bcrypt.hashSync('mod123', 10),
    role: ROLES.MODERATOR,
    online: false,
    socketId: null,
  },
  {
    id: uuidv4(),
    username: 'alice',
    password: bcrypt.hashSync('user123', 10),
    role: ROLES.MEMBER,
    online: false,
    socketId: null,
  },
  {
    id: uuidv4(),
    username: 'bob',
    password: bcrypt.hashSync('user123', 10),
    role: ROLES.MEMBER,
    online: false,
    socketId: null,
  },
];

// Seed rooms
const rooms = [
  { id: uuidv4(), name: 'general', description: 'General discussion', createdBy: 'superadmin', locked: false },
  { id: uuidv4(), name: 'engineering', description: 'Engineering team room', createdBy: 'superadmin', locked: false },
  { id: uuidv4(), name: 'ops', description: 'Operations and DevOps', createdBy: 'superadmin', locked: false },
];

// messages: { [roomName]: [{ id, userId, username, role, text, timestamp, deleted }] }
const messages = {
  general: [],
  engineering: [],
  ops: [],
};
module.exports = {
  ROLES,
  ROLE_WEIGHTS,
  hasPermission
};
