Implementation Strategy: The Phases
Phase 1: Backend Infrastructure & Auth Core

    Setup: Initialize Node.js/Express server with SQLite (sqlite3 or better-sqlite3).

    Database Schema: Create tables for Users, Contacts, Messages, and PanicEvents.

    Auth Endpoints: Implement /login, /register, and JWT middleware.

    Session Strategy: Implement short-lived JWTs (e.g., 1 hour) with a longer-lived refresh token. The app checks token validity "once in a while" (on foregrounding or via interceptors). If invalid, it logs the user out, saving server load from constant active-state polling.

Phase 2: App Data Refactoring (Local to Server)

    CRUD Endpoints: Create secured REST APIs for Contacts and Settings.

    App Integration: Refactor the React Native app to replace AsyncStorage calls with API fetch/axios calls for adding, editing, and deleting contacts and messages.

    Local Caching (Optional but recommended): Keep a read-only copy of contacts in AsyncStorage as a fallback in case of poor network connectivity during an emergency.

Phase 3: The Panic & Tracking Flow

    Trigger Endpoint: Create POST /api/panic/trigger accepting initial GPS coordinates.

    Tracking Endpoint: Create POST /api/panic/update for the 1-minute interval updates.

    App Refactor: Update the panic button handler to hit the server instead of (or in addition to) triggering the local SMS Linking API.

    Background Task: Configure the background location task to batch or send HTTP POSTs every ~60 seconds while an active panic session is alive.

Phase 4: Admin Dashboard

    Static Serving: Configure Express to serve a static HTML/JS/CSS folder.

    Admin UI: Build a simple, lightweight dashboard using vanilla JS or a minimal framework (like Alpine.js or Vue/React via CDN).

    Features: Admin login, view user lists, manage accounts (CRUD), and a live map/list of active panic events based on the SQL database.

Updated PRD Sections

Merge these updates into your existing PRD to reflect the new architecture.
1. Product Overview (Updated)

Product Vision: To provide drivers with a fast, reliable way to broadcast their exact location and an emergency message to trusted contacts. The system utilizes a React Native mobile application paired with a centralized Node.js backend to manage users, store emergency data securely, and track live location updates during an active panic event. A web-based admin dashboard allows for system monitoring and user management.
3. Core Features & Specifications (Updated)

3.1. User Authentication & Profile (Refactored)

    Server-Side Auth: JWT-based authentication via a Node.js server.

    Session Management: The app utilizes JWT access and refresh tokens. To minimize server load, active status is validated passively via token expiration and a lightweight health-check upon app foregrounding. Unauthenticated or expired sessions automatically log the user out to the login screen.

    Roles: Differentiates between standard User and Admin roles.

3.2. Emergency Contacts Management (Refactored)

    Cloud Storage: Emergency contacts and custom alert messages are now stored relationally on the SQLite backend, ensuring data recovery across devices.

    App Syncing: The app fetches the current roster from the server on load. (Recommendation: retain a local cache for offline redundancy).

3.4. Location Services & Background Tracking (Updated)

    Continuous Live Tracking: Upon triggering the panic flow, the app initiates a background location service that captures and transmits GPS coordinates to the server via an HTTP POST request at approximately 1-minute intervals.

    OS Compliance: Utilizes native background location APIs (via Expo) to keep the tracking alive even when the app is minimized or the screen is locked.

3.7. Admin Dashboard (New)

    Static Web Interface: A lightweight, statically served HTML interface accessible via desktop browser.

    Capabilities: * Secured via Admin JWT login.

        CRUD operations for managing User accounts.

        Real-time (or near real-time polling) view of active panic events and their latest known coordinates.

5. Technical Stack & Implementation Details (Updated)

    Mobile App: React Native / Expo.

    Hardware Integration: react-native-ble-plx for Bluetooth triggers.

    Backend Server: Node.js, Express.js.

    Database: SQLite (local file-based relational DB for simplicity and low overhead).

    Authentication: JSON Web Tokens (JWT) for secure, stateless API communication.

    Web Dashboard: Static HTML/CSS/JS served directly from the Express backend.