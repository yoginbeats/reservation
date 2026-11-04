# 🎯 SUPERLINES CAPSTONE DEFENSE: POWERPOINT (PPT) SLIDE-BY-SLIDE GUIDE

Gamitin ang gabay na ito bilang nilalaman ng inyong PowerPoint o Canva presentation para sa inyong Capstone Defense sa CNSC CCMS.

---

## 🖥️ SLIDE 1: TITLE SLIDE
- **Title:** Design and Implementation of a Web-Based Integrated Reservation and Ticketing System for Superlines Transportation Co. Inc.
- **Proponents:**
  - Asis, Leslie Ann B.
  - Mago, Phoebe Margaret V.
  - Rasco, Eugene A.
  - Sabanal, Lordaragon
- **Degree:** Bachelor of Science in Information Technology
- **Institution:** College of Computing and Multimedia Studies, Camarines Norte State College (2026)
- **Adviser:** [Pangalan ng inyong Thesis Adviser]

> **💬 Speaker Note:**  
> "Good day to our respected panel of evaluators and adviser. Today, we present our capstone study on the Design and Implementation of a Web-Based Integrated Reservation and Ticketing System for Superlines Transportation Co. Inc."

---

## 🖥️ SLIDE 2: BACKGROUND OF THE STUDY (THE PROBLEM)
- **Company Profile:** Superlines Transportation Co. Inc. has been operating since 1975, servicing the Daet ⇄ Metro Manila transit corridor.
- **Operational Challenges Identified:**
  - **Manual Ticketing:** Heavy reliance on handwritten paper logbooks and physical carbon-copy tickets.
  - **Lack of Real-Time Sync:** No centralized coordination between Daet, Cubao, and PITX terminals.
  - **Double-Booking Risks:** Prone to seat duplication and passenger-clerk disputes.
  - **Remittance Overhead:** Slow, manual cash counting and delayed shift reconciliation for tellers.

> **💬 Speaker Note:**  
> "While Superlines has decades of reliable service, its manual reservation process causes long queues, risks of double-booking, and slow accounting reconciliation."

---

## 🖥️ SLIDE 3: RESEARCH OBJECTIVES
- **General Objective:** Design, develop, and evaluate a synchronized web-based reservation and ticketing platform tailored to Superlines' operations.
- **Specific Objectives:**
  1. Identify existing operational bottlenecks in manual ticketing and dispatching.
  2. Develop four (4) core integrated modules:
     - Online Passenger Portal
     - Counter Teller POS Module
     - Conductor Mobile QR Verification Module
     - Headquarters Administrative Portal
  3. Evaluate the system's usability based on the **USE Framework** (*Usefulness, Satisfaction, Ease of Use, Ease of Learning*).

---

## 🖥️ SLIDE 4: SCOPE AND DELIMITATIONS
- **Terminals Covered:**
  - Daet Central Terminal (Camarines Norte)
  - Cubao Terminal (EDSA, Quezon City)
  - PITX Terminal (Parañaque Integrated Terminal Exchange)
- **Target Actors (4 Roles):**
  - Online Passengers (Public Commuters)
  - Counter Tellers (Station Clerks)
  - Bus Conductors (Onboard Crew)
  - Administrative Management (Headquarters)
- **Delimitations:**
  - Focuses strictly on reservation, ticketing, remittance, and dispatching.
  - Excludes onboard vehicle GPS tracking, turnstile hardware, and bus mechanical maintenance ERP.

---

## 🖥️ SLIDE 5: SYSTEM ARCHITECTURE & TECHNICAL STACK
- **Full-Stack Framework:** Next.js (App Router), React 19, TypeScript
- **Frontend & UI:** Tailwind CSS, Radix UI Primitives, Lucide Icons (fully mobile-responsive)
- **Backend & Database:** Supabase Cloud PostgreSQL with Row-Level Security (RLS) & transactional seat locking
- **Payment Processing:** PayMongo API Gateway (Cards & E-Wallets) + Direct Superlines GCash QR Hub
- **Boarding Verification:** HTML5 Browser-Based Camera QR Scanner (runs on standard smartphones/tablets)

---

## 🖥️ SLIDE 6: CORE MODULES: PASSENGER & TELLER
- **1. Online Passenger Portal:**
  - Real-time trip schedule search with interactive visual seating map.
  - Instant online payment via PayMongo and GCash QR.
  - Digital QR boarding pass with automated 20% cancellation refund policy tracking.
- **2. Counter Teller POS Module:**
  - Rapid walk-in ticketing with thermal slip generation.
  - **20% Statutory Discount Calculator:** Auto-discount for Senior Citizens, PWDs, and Students with official ID recording.
  - **Supervisor Override:** Secured rebooking requiring verified supervisor authorization codes (`SUP-xxx`).
  - **Shift Z-Reading Remittance:** Denomination breakdown and cash drawer variance reporting.

---

## 🖥️ SLIDE 7: CORE MODULES: CONDUCTOR & ADMIN
- **3. Conductor Mobile QR Scanner:**
  - Camera-based live ticket scanner with instant boarding status:
    - 🟢 **VALID** | 🟡 **ALREADY USED / BOARDED** (Anti-Passback Protection)
    - 🔵 **WRONG TRIP / BUS** | 🔴 **CANCELLED / REFUNDED**
  - Live digital passenger manifest with one-tap boarding check-in.
- **4. Headquarters Admin Portal:**
  - **Bound Turnaround Scheduling:** Dynamically links round-trip schedules (e.g., **SL-401 Cubao ⇄ Daet** and **SL-212 PITX ⇄ Daet**).
  - **Anti-Double Booking Guard:** Prevents concurrent seat booking across distributed terminals.
  - Executive financial reports and teller remittance audit verification.

---

## 🖥️ SLIDE 8: RESEARCH METHODOLOGY
- **Development Framework:** Iterative Agile-RUP Hybrid
  - **Inception:** Problem identification and Daet terminal workflow observation.
  - **Elaboration:** DFD, Relational ERD design, and UI/UX wireframing.
  - **Construction (4 Agile Sprints):**
    - *Sprint 1:* Core Booking & Visual Seat Map
    - *Sprint 2:* PayMongo / GCash QR & E-Ticket Generation
    - *Sprint 3:* Teller POS, 20% Discount, & Conductor Mobile Scanner
    - *Sprint 4:* Bound Bus Turnaround & Admin Auditing
  - **Transition:** User Acceptance Testing (UAT) and system deployment.

---

## 🖥️ SLIDE 9: RESPONDENTS & EVALUATION
- **Population & Sample ($N = 50$ Respondents):**
  - **Passengers ($n = 35$, $70\%$):** Evaluated online booking flow, seat map, and e-ticket accessibility.
  - **Ticketing Clerks ($n = 10$, $20\%$):** Evaluated POS speed, discount handling, and Z-reading.
  - **Administrative Staff ($n = 5$, $10\%$):** Evaluated bound scheduling and remittance audit accuracy.
- **Statistical Treatment:**
  - **Percentage Distribution:** $P = \left(\frac{f}{N}\right) \times 100\%$
  - **Weighted Mean:** $\bar{x} = \frac{\sum (f \cdot w)}{N}$ on a 5-Point Likert Scale (4.51–5.00: Highly Usable / Excellent).

---

## 🖥️ SLIDE 10: SIGNIFICANCE & VALUE DELIVERED
- **For Passengers:** Convenience of 24/7 online seat selection and cashless boarding.
- **For Tellers:** Faster walk-in processing, automated discount calculation, and balanced cash drawers.
- **For Conductors:** Rapid paperless check-in and elimination of ticket reuse fraud.
- **For Management:** Centralized visibility over bound bus rotations, zero double bookings, and transparent revenue tracking.

---

## 🖥️ SLIDE 11: CONCLUSION & FUTURE RECOMMENDATIONS
- **Conclusion:** The Web-Based Integrated Reservation and Ticketing System successfully modernizes manual operations and delivers an enterprise-ready transit solution for Superlines.
- **Future Recommendations:**
  - Integration of live GPS telemetry for onboard bus arrival tracking.
  - Automated SMS gateway notifications for departure advisories.
  - Offline-first PWA caching for remote terminal areas with weak connectivity.

---

## 🖥️ SLIDE 12: Q&A / CLOSING
- **Thank You!**
- "We are now ready to accept questions and feedback from our respected panel of evaluators."
