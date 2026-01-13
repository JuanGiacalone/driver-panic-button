PIN Authentication Implementation Walkthrough
Overview
Successfully replaced the Manus OAuth authentication system with a device-based PIN authentication system. Users now authenticate using a 6-digit PIN assigned by administrators, with each device linked to a specific user account.

Implementation Summary
Database Changes
Updated 
schema.ts
 to replace OAuth fields with PIN authentication:

Removed:

openId - OAuth identifier
email - User email
loginMethod - OAuth provider
Added:

deviceId - Unique device identifier (replaces openId)
pinHash - Bcrypt-hashed 6-digit PIN
Created 
seed.ts
 to populate default development users:

Device ID: dev-device-user, PIN: 123456 (regular user)
Device ID: dev-device-admin, PIN: 654321 (admin user)
Server-Side Implementation
PIN Authentication Module
Created 
server/_core/pin-auth.ts
 with core functions:

hashPin()
 - Bcrypt hashing with salt rounds of 10
verifyPin()
 - PIN verification against stored hash
authenticateUser()
 - Device + PIN authentication
createUser()
 - Admin function to create users
updateUserPin()
 - Admin function to update PINs
API Endpoints
Updated 
server/_core/oauth.ts
 (renamed from OAuth routes):

New Endpoints:

POST /api/auth/login - Login with deviceId and PIN
Request: { deviceId: string, pin: string }
Response: { success: true, sessionToken: string, user: {...} }
Kept Endpoints:

POST /api/auth/logout - Clear session
GET /api/auth/me - Get current user (updated to return deviceId)
Removed:

/api/oauth/callback - OAuth web callback
/api/oauth/mobile - OAuth mobile exchange
Client-Side Implementation
Device Identification
Created 
lib/_core/device.ts
:

Uses expo-application for native device IDs
Android: androidId
iOS: iosIdForVendor
Web: Generated ID stored in localStorage
PIN Authentication API
Created 
lib/_core/api-pin.ts
:

loginWithPin(pin)
 - Automatically includes device ID
Integrates with existing session management
PIN Input Component
Created 
components/pin-input.tsx
:

6 individual input boxes
Auto-focus and navigation
Haptic feedback on native platforms
Error state visualization
Secure entry (masked digits)
Login Screen
Updated 
app/login.tsx
:

Clean PIN-only interface
No username field required
Error handling with visual feedback
Development credentials displayed for testing
Authentication Flow
Updated 
hooks/use-auth.ts
 and 
lib/_core/auth.ts
:

User type now includes deviceId and role
Removed OAuth-specific fields
Session management unchanged (still uses secure storage)
Cleanup
Deleted Files:

app/oauth/callback.tsx
 - OAuth callback handler
constants/oauth.ts
 - OAuth configuration
Updated Files:

server/db.ts
 - Replaced getUserByOpenId with 
getUserByDeviceId
lib/_core/api.ts
 - Removed OAuth functions, updated user types
Usage Instructions
Development Setup
Seed the database:

cd /home/jp/w0rkspace/driver-panic-button
tsx drizzle/seed.ts
Test credentials:

Regular user: Device ID dev-device-user, PIN 123456
Admin user: Device ID dev-device-admin, PIN 654321
Testing the Login Flow
Launch the app
You'll see the PIN entry screen with 6 input boxes
Enter PIN 123456 (for dev-device-user)
App authenticates and redirects to main screen
Admin Functions
Admins can create users and manage PINs through the server API:

// Create a new user
await createUser("device-id-123", "123456", "John Doe", "user");
// Update a user's PIN
await updateUserPin("device-id-123", "654321");
Security Considerations
PIN Hashing: All PINs are hashed with bcrypt (10 salt rounds) before storage
Device Binding: Each device is linked to one user account
Session Tokens: 1-year expiration, stored securely
Development PINs: Should be changed in production environments
Migration Notes
All existing OAuth users will be logged out
Admins need to link devices to user accounts
OAuth environment variables (EXPO_PUBLIC_OAUTH_PORTAL_URL, etc.) are no longer needed
Database migration required to update schema
Files Modified
Server
drizzle/schema.ts
drizzle/seed.ts
 (new)
server/db.ts
server/_core/pin-auth.ts
 (new)
server/_core/oauth.ts
server/_core/index.ts
Client
lib/_core/auth.ts
lib/_core/device.ts
 (new)
lib/_core/api-pin.ts
 (new)
lib/_core/api.ts
components/pin-input.tsx
 (new)
app/login.tsx
hooks/use-auth.ts
Deleted
app/oauth/callback.tsx
constants/oauth.ts