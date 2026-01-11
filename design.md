# Driver Panic Button - Mobile App Design

## Design Philosophy

This app follows **Apple Human Interface Guidelines (HIG)** to feel like a first-party iOS app. The design prioritizes:
- **One-handed usage** in portrait orientation (9:16)
- **Immediate accessibility** - panic button must be instantly available
- **Safety-first** - clear visual feedback and confirmation states
- **Driver-focused** - minimal distraction, large touch targets

## Screen List

1. **Login Screen** - Basic authentication
2. **Home Screen** - Main panic button interface
3. **Emergency Contacts Screen** - Manage contact list
4. **Add/Edit Contact Screen** - Contact details form
5. **Bluetooth Setup Screen** - Pair Bluetooth button
6. **Settings Screen** - App configuration
7. **Profile Screen** - User account management

## Screen Details

### 1. Login Screen
**Primary Content:**
- App logo and name at top
- Email input field
- Password input field
- Login button (primary action)
- "Don't have an account? Sign up" link

**Functionality:**
- Email/password authentication
- Form validation
- Error messaging
- Auto-login if session exists

**Layout:**
- Centered vertical layout
- Large touch targets (min 44pt)
- Keyboard-aware scrolling

### 2. Home Screen (Main Tab)
**Primary Content:**
- Large circular panic button (center, 200pt diameter)
- Status indicator (Bluetooth connected/disconnected)
- GPS status indicator
- Emergency contacts count badge
- Quick access to settings

**Functionality:**
- Tap panic button to trigger alert
- Visual feedback: button scales down, color changes to red
- Haptic feedback on press
- Shows confirmation modal after trigger
- Background location tracking
- Bluetooth button listener (always active)

**Layout:**
- Centered panic button dominates the screen
- Status indicators at top (safe area)
- Bottom tab bar navigation

**Visual Design:**
- Panic button: Large, red gradient circle with white "SOS" text
- Idle state: Red with subtle pulse animation
- Active state: Darker red, scaled down
- Disabled state (no contacts): Gray with lock icon

### 3. Emergency Contacts Screen (Tab)
**Primary Content:**
- List of emergency contacts (name, phone, alert method)
- Add contact button (floating action button)
- Empty state: "No contacts added" with illustration
- Each contact card shows:
  - Name
  - Phone number
  - Alert method badge (SMS/WhatsApp)
  - Edit/Delete actions (swipe)

**Functionality:**
- Add new contacts
- Edit existing contacts
- Delete contacts (swipe left)
- Reorder contacts (long press drag)
- Minimum 1 contact required to enable panic button

**Layout:**
- FlatList with card-style items
- Floating "+" button at bottom-right
- Pull-to-refresh

### 4. Add/Edit Contact Screen
**Primary Content:**
- Contact name input
- Phone number input (with country code picker)
- Alert method selector (SMS/WhatsApp toggle)
- Save button
- Cancel button

**Functionality:**
- Form validation (name required, valid phone)
- Phone number formatting
- Alert method selection
- Save to local storage (AsyncStorage)

**Layout:**
- Form fields with labels
- Bottom action buttons (Cancel/Save)
- Keyboard-aware layout

### 5. Bluetooth Setup Screen
**Primary Content:**
- Bluetooth status indicator
- Scan for devices button
- List of available Bluetooth devices
- Connected device indicator
- Instructions text

**Functionality:**
- Scan for nearby Bluetooth devices
- Pair with selected device
- Save paired device ID
- Listen for button press events
- Test connection button

**Layout:**
- Top section: connection status
- Middle section: device list
- Bottom section: instructions

### 6. Settings Screen (Tab)
**Primary Content:**
- Bluetooth setup option
- Alert message customization
- Location permissions status
- Background permissions status
- Notification settings
- About section (version, help)

**Functionality:**
- Navigate to Bluetooth setup
- Edit default alert message
- Request permissions if not granted
- Toggle notifications
- Logout option

**Layout:**
- Grouped list style (iOS settings pattern)
- Section headers
- Disclosure indicators for navigation

### 7. Profile Screen
**Primary Content:**
- User name
- Email
- Edit profile button
- Logout button

**Functionality:**
- Display user info
- Edit basic profile
- Logout with confirmation

**Layout:**
- Top section: user info card
- Bottom section: action buttons

## Key User Flows

### Flow 1: First-Time Setup
1. User opens app → Login screen
2. User signs up/logs in → Home screen
3. App shows "Add emergency contacts" prompt
4. User taps prompt → Emergency Contacts screen
5. User taps "+" → Add Contact screen
6. User fills form and saves → Returns to Emergency Contacts
7. User adds at least 1 contact → Panic button enabled
8. User navigates to Settings → Bluetooth Setup
9. User pairs Bluetooth button → Setup complete

### Flow 2: Trigger Panic Alert (Manual)
1. User taps panic button on Home screen
2. Button scales down, turns darker red, haptic feedback
3. Confirmation modal appears: "Alert sent to X contacts"
4. App gets current GPS coordinates
5. App sends SMS/WhatsApp to all contacts with message: "EMERGENCY! I need help. My location: [coordinates link]"
6. Modal auto-dismisses after 3 seconds
7. User returns to normal state

### Flow 3: Trigger Panic Alert (Bluetooth)
1. User presses physical Bluetooth button
2. App receives button press event (even in background)
3. Same flow as manual trigger (steps 2-7 above)
4. Additional notification shown to user confirming alert sent

### Flow 4: Manage Contacts
1. User navigates to Emergency Contacts tab
2. User swipes left on contact → Delete/Edit options
3. User taps Edit → Edit Contact screen
4. User updates info and saves → Returns to list
5. User can reorder by long-press drag

## Color Choices

**Brand Colors:**
- Primary Red: `#DC2626` (panic/emergency)
- Dark Red: `#991B1B` (active state)
- Success Green: `#16A34A` (connected status)
- Warning Yellow: `#EAB308` (attention states)
- Gray: `#6B7280` (disabled/inactive)

**Theme Colors:**
- Background (light): `#FFFFFF`
- Background (dark): `#151718`
- Surface (light): `#F9FAFB`
- Surface (dark): `#1E2022`
- Text (light): `#111827`
- Text (dark): `#F9FAFB`
- Border (light): `#E5E7EB`
- Border (dark): `#374151`

## Typography

- **Headings:** SF Pro Display, Bold, 28-34pt
- **Body:** SF Pro Text, Regular, 16-17pt
- **Captions:** SF Pro Text, Regular, 13-14pt
- **Button Labels:** SF Pro Text, Semibold, 17pt

## Interaction Patterns

- **Panic Button:** Scale to 0.95 on press, haptic heavy impact
- **List Items:** Opacity 0.7 on press, haptic light impact
- **Buttons:** Scale to 0.97 on press, haptic medium impact
- **Swipe Actions:** Standard iOS swipe-to-delete pattern

## Technical Considerations

- **Background Location:** Request "Always" permission for background GPS
- **Bluetooth:** Use `react-native-ble-plx` for BLE communication
- **SMS:** Use `react-native-sms` or Linking API
- **WhatsApp:** Use Linking API with WhatsApp URL scheme
- **Background Tasks:** Use `expo-task-manager` for background Bluetooth listening
- **Local Storage:** AsyncStorage for contacts and settings
- **Authentication:** Use built-in server auth (OAuth)
