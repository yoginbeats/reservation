# 🚌 Superlines Centralized Reservation & Ticketing System
## Complete System Capabilities & Role Functionality Manual

This document provides a comprehensive operational breakdown of the entire Superlines Transportation Co. Inc. reservation, dispatch, and ticketing software, including all role permissions, workflow capabilities, and security policies.

---

## 🏢 Official System Terminals & Fleet
The system is strictly configured for the three primary Superlines terminals and their bound rotation routes:
1. **Cubao Terminal** (EDSA, Quezon City, Metro Manila)
2. **Daet Terminal** (Daet Central Terminal, Camarines Norte)
3. **PITX Terminal** (Parañaque Integrated Terminal Exchange, Bay 4)

### Bound Bus Turnaround Rotations:
- **Unit SL-401** (Superlines Aircon, 45-49 seats): **Cubao ⇄ Daet**
- **Unit SL-212** (Executive Express, 45 seats): **PITX ⇄ Daet**

---

## 🔑 System Accounts & Login Credentials

| Role | Name / Station | Email | Password | Direct Portal |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Main Admin** | Superlines Head Admin | `admin@superlines.com` | `admin123` | `/admin` |
| 💼 **Teller 1** | Maria Santos (Cubao) | `teller.cubao@superlines.com` | `teller123` | `/teller/walk-in` |
| 💼 **Teller 2** | Elena Magno (Daet) | `teller.daet@superlines.com` | `teller123` | `/teller/walk-in` |
| 💼 **Teller 3** | Roberto Gomez (PITX) | `teller.pitx@superlines.com` | `teller123` | `/teller/walk-in` |
| 🎫 **Conductor 1** | Eduardo Ramos (SL-401) | `conductor1@superlines.com` | `conductor123` | `/conductor` |
| 🎫 **Conductor 2** | Nestor Dela Cruz (SL-212) | `conductor2@superlines.com` | `conductor123` | `/conductor` |

> **Quick Access**: The login page (`/login`) includes an interactive **"⚡ One-Click Quick Login"** directory. Clicking **"Enter ➔"** on any account immediately signs in and opens the corresponding role dashboard.

---

## 👑 Role 1: Main Admin (Headquarters Management)

**Target URL:** `/admin`  
**Permission Level:** Full administrative authority across all terminals and audit data.

### Functionalities:
1. **Executive Operations Dashboard (`/admin`)**
   - Real-time aggregated ticket sales revenue across counter and online channels.
   - Total passenger volume and seat occupancy metrics.
   - Active bus fleet on the road with current turnaround legs.
2. **Dual-Terminal Bound Reservations & Anti-Double Booking Monitor (`/admin/reservations`)**
   - **Bound Rotation Cards**: Dynamically binds round-trip schedules of the same physical bus (e.g. SL-401 Cubao ➔ Daet and Daet ➔ Cubao).
   - **Dual Manifest Comparison**: Visualizes both departure legs side-by-side to ensure the bus is never double-allocated.
   - **Live Terminal Filters**: Instant filtering by `All Terminals`, `Cubao`, `Daet`, `PITX`, and `🔗 Dual-Terminal Bound Only`.
   - **Passenger Roster & Status Management**: Search passenger names, filter by booking status (`CONFIRMED`, `PENDING_VERIFICATION`, `CANCELLED`), and export manifests.
   - **Shield Indicator**: Displays live `🛡️ Anti-Double Booking Guard: Active across all terminals`.
3. **Restricted Financial & Z-Reading Remittance Reports (`/admin/reports`)**
   - *Protected Route: Only accessible to Main Admin.*
   - **Terminal Revenue Breakdown**: Comparative analysis of cash vs online revenue for Cubao, Daet, and PITX.
   - **Teller Remittance Verification**: Audits cash drawer turnover submitted by tellers during their shift closures.
   - **Printable Master Audit Sheets**: Generates printable accounting summaries with timestamped supervisor sign-offs.
4. **Master Fleet Management (`/admin/buses`)**
   - Register, inspect, and update bus units, seat capacities (45–49 seats), vehicle types (`REGULAR AIRCON`, `SUPER DELUXE`, `EXECUTIVE EXPRESS`), and maintenance flags.
5. **Route Configuration (`/admin/routes`)**
   - Configure terminal origins, destinations, estimated travel times, distance (km), and base fare pricing (₱850 standard).
6. **Terminal Stations Directory (`/admin/terminals`)**
   - Manage physical terminal details, counter booths, and contact locations for Daet, PITX, and Cubao.
7. **Passenger Announcements CMS (`/admin/announcements`)**
   - Publish advisory banners (e.g. holiday advisories, weather updates) that display immediately on the passenger homepage and booking flow.

---

## 💼 Role 2: Counter Tellers (Cubao, Daet, PITX Counters)

**Target URLs:** `/teller/walk-in` (Walk-in Booking) and `/teller` (Shift Operations)  
**Permission Level:** Counter ticketing, walk-in reservations, rebooking, and shift cash remittances.

### Functionalities:
1. **High-Speed Walk-In Ticketing (`/teller/walk-in`)**
   - **Upcoming Trip Selector**: Displays departures departing from the teller's assigned terminal station.
   - **Real-Time Cross-Terminal Seat Map**: Communicates with `/api/trips/seats` to lock occupied seats across online and other terminal counters.
   - **Statutory Discount Calculator**:
     - Supports **Senior Citizen**, **Student**, and **PWD** classifications.
     - Automatic 20% statutory fare reduction per discounted passenger.
     - Captures passenger full name and official government ID number for BIR compliance.
   - **Cash Tendered & Change Engine**: Computes exact change and validates sufficient cash before confirming ticket.
   - **Printable Thermal Boarding Ticket**:
     - Generates official Superlines boarding slip with passenger details, seat numbers, fare breakdown, and QR code token.
2. **Supervisor Authorization Rebooking Workflow**
   - Tellers cannot modify trip dates or seats without supervisor consent.
   - **Security Modal**: Requires entering a verified **Head Supervisor Authorization Code** (`SUP-2026-OK`, `SUP-DAET-99`, `SUP-CUBAO-88`, `SUP-PITX-77`).
   - Automatically updates ticket records and frees previous seats while maintaining audit logs.
3. **End-of-Shift Cash Remittance / Z-Reading (`/teller`)**
   - Designed for the end of the 8-hour teller shift.
   - **Denomination Breakdown Modal**: Teller enters bill and coin counts (₱1,000, ₱500, ₱200, ₱100, ₱50, ₱20, coins).
   - **Reconciliation Engine**: Calculates cash in drawer vs system ticket sales total (displays Over/Short variance).
   - **Official Z-Reading Remittance Slip**: Prints a formal slip with breakdown of tickets sold, total cash remitted, and signature lines for Teller, Head Cashier, and Station Supervisor.
4. **Counter Passenger Manifest (`/teller/manifest`)**
   - Generates trip manifests for counter personnel to hand to bus dispatchers prior to departure.

---

## 🎫 Role 3: Bus Conductors (Onboard Crew)

**Target URLs:** `/conductor`, `/conductor/scan` (QR Scanner), `/conductor/manifest`  
**Permission Level:** Passenger boarding verification, ticket scanning, manifest check-in.

### Functionalities:
1. **Mobile Camera QR Scanner (`/conductor/scan`)**
   - High-performance live camera scanner designed for mobile phones and tablets.
   - Automatically scans passenger QR tokens from printed tickets or mobile screens.
   - **Manual Input Fallback**: Allows typing ticket tokens (e.g. `TKT-20261030-JD401`) if passenger screen is cracked or low-light.
2. **Fraud Prevention & Boarding Validator**
   - Instantly evaluates ticket state:
     - 🟢 **VALID**: Green badge, displays passenger name, seat number, and trip route.
     - 🟡 **ALREADY USED / BOARDED**: Yellow warning with exact boarding timestamp to prevent pass-back reuse.
     - 🔴 **CANCELLED / REFUNDED**: Red alert preventing boarded access.
     - 🔵 **WRONG TRIP**: Informs conductor if passenger is attempting to board the wrong bus unit or schedule.
3. **One-Tap Boarding Check-In**
   - Clicking **"Confirm Boarding"** updates ticket status to `USED` across the database and manifest in real time.
4. **Live Onboard Passenger Manifest (`/conductor/manifest`)**
   - Interactive roster of all passengers on the bus.
   - Categorized by `Boarded` vs `Unboarded`.
   - Displays seat numbers, passenger phone numbers, and payment verification.
5. **Bus Trip Roster & Fleet Assignment (`/conductor`)**
   - Displays scheduled turnaround trips assigned to the conductor's unit (`SL-401` or `SL-212`).
   - Emergency bus unit reassignment tool for dispatch substitutions.

---

## 🌐 Role 4: Online Passengers (Self-Service Customer Portal)

**Target URLs:** `/` (Home), `/book` (Booking), `/my-tickets` (Customer Portal)  
**Permission Level:** Public booking, payment submission, digital ticket viewing, refund/rebook requests.

### Functionalities:
1. **Interactive Route & Departure Search (`/book`)**
   - Filter departures between Cubao, Daet, and PITX.
   - Live seat counter showing available vs reserved slots.
2. **Visual Seat Selection**
   - Interactive bus seating layout (Driver seat, Door, Reclining rows).
   - Real-time seat occupancy locking.
3. **Payment Methods**
   - **Direct GCash QR Payment**: Passenger scans the official Superlines GCash QR code, inputs reference number, and generates a verified e-ticket.
   - **PayMongo Gateway Integration**: Supports card and checkout session options.
4. **Digital Mobile Boarding Pass (`/my-tickets`)**
   - View, download, or screenshot digital QR tickets.
   - Full booking details: departure time, terminal, seat number, and transaction receipt.
5. **Self-Service Online Refund Policy Engine (`/my-tickets`)**
   - **3-Day Cancellation Policy**:
     - If refund is requested **within 3 days prior to travel**, the system automatically deducts a **20% administrative fee** from the refundable amount.
     - If requested more than 3 days prior, 100% is refundable.
   - **GCash Settlement Timeline**: Informs passenger of the official 3-day to 1-week processing window.
   - **Live Refund Tracker**:
     - `STAGE 1: PENDING_AUDIT` (Superlines Accounting ticket usage audit)
     - `STAGE 2: PROCESSING_GCASH` (GCash payout queue)
     - `STAGE 3: COMPLETED` (Dispatched with reference number)
6. **Online Ticket Rebooking (`/my-tickets`)**
   - Rebook trip to an upcoming date without creating duplicate bookings.

---

## 🛡️ Core System-Wide Architectures & Guards

1. **Cross-Terminal Anti-Double-Booking Protection Engine (`/api/trips/seats`)**
   - Aggregates reserved seats in real time across Supabase `trip_seats`, `bookings`, `reservations`, and local cache.
   - Resolves by bus physical unit (`SL-401`, `SL-212`) and departure time window.
   - Conflict shield blocks duplicate attempts with an explicit `409 Conflict` error identifying the competing counter or passenger.
2. **Unified Cookie Session Authentication**
   - Cookie `superlines_auth_session` provides zero-latency server/client authentication.
   - Automatically synchronizes with Supabase Auth when online.
3. **Automated Password Reset & Account Recovery (`/forgot-password` & `/reset-password`)**
   - **Email Dispatch Engine (`/api/auth/forgot-password`)**: Sends secure, cryptographically-signed recovery links directly to the passenger's registered inbox with 1-hour expiration.
   - **Unified Callback Handshake (`/auth/callback?next=/reset-password`)**: Exchanges recovery tokens into secure authenticated sessions, bypassing profile completion blockers for seamless password updating.
   - **Password Update Gateway (`/api/auth/reset-password`)**: Cryptographically validates and applies the passenger's new password with live criteria checks (minimum 6 characters, matching confirmation).
4. **Resilient Local Store Fallback (`lib/local-booking-store.ts`)**
   - Guarantees 100% operational uptime at counter booths even during internet or Supabase maintenance windows.
