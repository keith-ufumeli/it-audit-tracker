#!/usr/bin/env node

/**
 * Generate a secure NextAuth secret
 * Usage: node scripts/generate-secret.js
 */

const crypto = require('crypto');

function generateSecret() {
  const secret = crypto.randomBytes(32).toString('hex');
  console.log('🔐 Generated NextAuth Secret:');
  console.log('');
  console.log(`NEXTAUTH_SECRET=${secret}`);
  console.log('');
  console.log('📝 Add this to your .env.local file:');
  console.log('');
  console.log('# NextAuth Configuration');
  console.log(`NEXTAUTH_SECRET=${secret}`);
  console.log('NEXTAUTH_URL=http://localhost:3000');
  console.log('');
  console.log('⚠️  Keep this secret secure and never commit it to version control!');
}

// Run the generator
generateSecret();
