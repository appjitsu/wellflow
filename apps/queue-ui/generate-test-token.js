#!/usr/bin/env node

/**
 * Generate a test JWT token for accessing the Queue UI Dashboard
 * This is for development/testing purposes only
 */

const jwt = require('jsonwebtoken');

// Use environment variable or default for development
const JWT_SECRET = process.env.JWT_SECRET || 'wellflow-dev-secret-change-in-production';

// Create a test user payload with the required roles
const payload = {
  id: 'test-user-123',
  sub: 'test-user-123',
  email: 'admin@wellflow.dev',
  roles: ['ADMIN', 'OPERATOR'],
  organizationId: 'test-org-123',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
};

// Generate the token
const token = jwt.sign(payload, JWT_SECRET);

console.log('🔑 Test JWT Token Generated:');
console.log('');
console.log(token);
console.log('');
console.log('📋 Usage:');
console.log(`🌐 Dashboard URL: http://localhost:3003/?token=${token}`);
console.log(`🔗 Or with Authorization header: Bearer ${token}`);
console.log('');
console.log('👤 Token contains:');
console.log(`   User ID: ${payload.id}`);
console.log(`   Email: ${payload.email}`);
console.log(`   Roles: ${payload.roles.join(', ')}`);
console.log(`   Organization: ${payload.organizationId}`);
console.log(`   Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
