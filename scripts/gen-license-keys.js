#!/usr/bin/env node
// One-time helper to generate the Ed25519 keypair used to sign license JWTs.
//
//   node scripts/gen-license-keys.js
//
// Copy the LICENSE_PRIVATE_KEY line into admin-saas/.env (server-side only).
// Copy the LICENSE_PUBLIC_KEY  line into main-local/.env (and ship it inside
// the binary for the production build).
//
// Treat the private key like a database password: do not commit, do not paste
// into chat, do not include in client builds.

const { generateKeyPairSync } = require('node:crypto')

const { publicKey, privateKey } = generateKeyPairSync('ed25519')

const privDer = privateKey.export({ type: 'pkcs8', format: 'der' })
const pubDer = publicKey.export({ type: 'spki', format: 'der' })

console.log('# === COPY INTO admin-saas/.env (KEEP SECRET) ===')
console.log(`LICENSE_PRIVATE_KEY=${privDer.toString('base64')}`)
console.log()
console.log('# === COPY INTO main-local/.env (safe to ship in binary) ===')
console.log(`LICENSE_PUBLIC_KEY=${pubDer.toString('base64')}`)
