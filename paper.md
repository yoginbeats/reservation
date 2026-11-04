# Design and Implementation of a Web-Based Integrated Reservation and Ticketing System for Superlines Transportation Co. Inc.

A Capstone Project Presented to the Faculty of the  
College of Computing and Multimedia Studies  
Camarines Norte State College  
Daet, Camarines Norte  

In Partial Fulfillment of the Requirements for the  
Degree in Bachelor of Science in Information Technology  

By:  
**Asis, Leslie Ann B.**  
**Mago, Phoebe Margaret V.**  
**Rasco, Eugene A.**  
**Sabanal, Lordaragon**  

**2026**

---

## Table of Contents
- **TITLE**: i
- **TABLE OF CONTENTS**: ii
- **CHAPTER 1 - INTRODUCTION**: 1
  - Background of the Study: 1
  - Research Objectives: 2
  - Research Questions: 3
  - Scope and Delimitation of the Study: 3
  - Significance of the Study: 5
- **CHAPTER 2 - REVIEW OF RELATED STUDIES AND LITERATURE**: 6
  - Review of Related Literature and Studies: 6
  - Synthesis of the Study: 11
- **CHAPTER 3 - RESEARCH METHODOLOGY**: 12
  - Research Design: 12
  - System Development Methodology: 12
  - Technical Architecture and Development Tools: 14 *(Added)*
  - Data Flow and Database Design: 15 *(Updated)*
  - Population and Sample of the Study: 17
  - Data Collection Method & Procedures: 18
  - Research Instrument: 19
  - Data Analysis and Statistical Treatment: 20 *(Corrected)*
  - Ethical Considerations: 22
- **REFERENCES**: 23

---

# CHAPTER 1
# INTRODUCTION

### Background of the Study
In today’s fast-paced world, where people mainly rely on technology, the demand for efficient, convenient, and user-friendly transportation services is increasing. Online reservation and booking systems provide bus transportation services with unmatched convenience to users as they facilitate seat allocation, handle cancellations, and address inquiries requiring instant responses. These systems can be used directly through web browsers without the need for client-side software installation (Oloyede, Alaya, & Adewole, 2014).

Superlines Transportation Co. Inc. is one of the leading bus transportation companies operating in Luzon, servicing major routes between Camarines Norte and Metro Manila. Established in 1975, the company has built a strong reputation for safety, reliability, and customer service. Yet, despite decades of successful operation, the company still largely relies on manual, paper-based processes for ticket reservation and passenger dispatch. Currently, passengers must make walk-in reservations and over-the-counter cash payments at designated terminals to secure their seats. Terminal clerks rely on handwritten logbooks and manual carbon-copy ticketing, which is time-consuming, labor-intensive, and highly susceptible to human error. Managing real-time seat availability across multiple terminals, tracking reservations, and compiling financial audit reports create substantial operational burdens for staff, while passengers endure congested ticket booths, long queues, and uncertain seat availability.

With technological advancements, transportation organizations are adopting integrated web platforms to streamline dispatching, payment verification, and fleet management. A web-based reservation and ticketing system provides a modern alternative: enabling passengers to search trips, inspect interactive visual seat maps, select seats, and execute secure online payments.

Integrating modern digital payment gateways (such as PayMongo and GCash QR) eliminates the requirement for strictly over-the-counter transactions, expediting cash settlement and reducing terminal congestion. Furthermore, centralized database synchronization guarantees real-time seat status updates, eliminating the persistent threat of double bookings across distributed terminals.

For company administrators and counter staff, a web-based architecture consolidates reservations, dispatch manifests, fare accounting, and trip scheduling into a synchronized platform. Automated generation of e-tickets with secure Quick Response (QR) codes facilitates rapid passenger check-in by conductors via mobile camera scanners. Role-based access control (RBAC) ensures data integrity and security, while digital ledger reporting provides real-time oversight of daily terminal revenues and teller remittances.

In response to these operational bottlenecks, this study undertakes the **Design and Implementation of a Web-Based Integrated Reservation and Ticketing System for Superlines Transportation Co. Inc.** The proposed system aims to replace cumbersome manual operations with an automated, synchronized, and user-friendly digital platform serving passengers, counter tellers, bus conductors, and management.

---

### Research Objectives
The primary objective of this study is to design, develop, and evaluate a functional, web-based integrated reservation and ticketing system tailored specifically to the operational requirements of Superlines Transportation Co. Inc. 

Specifically, this study aims to:
1. Determine the existing reservation and ticketing processes of Superlines Transportation Co. Inc. and identify their operational limitations, bottlenecks, and user challenges.
2. Design and develop the functional modules of the **Web-Based Integrated Reservation and Ticketing System for Superlines Transportation Co. Inc.**, comprising:
   - **Online Passenger Portal** *(trip booking, interactive seat selection, digital payment gateway via PayMongo and GCash QR, and digital QR boarding pass generation with refund tracking)*;
   - **Counter Teller POS Module** *(high-speed walk-in ticketing, 20% statutory discount calculator for Senior Citizens, PWDs, and Students with official ID verification, supervisor-authorized rebooking, and shift-end Z-reading cash reconciliation)*;
   - **Conductor Mobile Scanner Module** *(camera-based QR ticket verification, anti-passback/ticket reuse validation, and real-time passenger manifest check-in)*; and
   - **Headquarters Administrative Portal** *(dual-terminal bound turnaround bus scheduling between Daet, Cubao, and PITX, cross-terminal anti-double booking guard, teller cash remittance audits, fleet management, and announcement CMS)*.
3. Determine the level of usability of the **Web-Based Integrated Reservation and Ticketing System for Superlines Transportation Co. Inc.** in terms of:
   - a. Usefulness;
   - b. Satisfaction;
   - c. Ease of Use; and
   - d. Ease of Learning.

---

### Research Questions
To achieve the stated objectives, the study seeks to answer the following research questions:
1. What is the existing workflow and operational status of Superlines Transportation Co. Inc. in terms of reservation, ticketing, and dispatching, and what limitations are encountered?
2. What are the system architectural features, database models, and operational modules required to develop the Web-Based Integrated Reservation and Ticketing System for Superlines Transportation Co. Inc.?
3. What is the level of usability of the Web-Based Integrated Reservation and Ticketing System for Superlines Transportation Co. Inc. as evaluated by passengers, ticketing clerks, and administrative staff based on:
   - a. Usefulness;
   - b. Satisfaction;
   - c. Ease of Use; and
   - d. Ease of Learning?

---

### Scope and Delimitation of the Study

#### Scope of the Study
The primary focus of this study is the design, implementation, and evaluation of a centralized, web-based integrated reservation and ticketing platform for **Superlines Transportation Co. Inc.** The system covers the primary transport corridor of the company, specifically servicing the routes connecting:
1. **Daet Central Terminal** (Daet, Camarines Norte)
2. **Cubao Terminal** (EDSA, Quezon City, Metro Manila)
3. **PITX Terminal** (Parañaque Integrated Terminal Exchange, Metro Manila)

The system is engineered around four distinct, role-based user portals:
1. **Online Passenger Portal:** Allows commuters to check real-time schedules, view dynamic visual seat maps, book seats, pay through digital channels (PayMongo gateway supporting cards and GCash QR reference verification), receive instant digital e-tickets equipped with encrypted QR codes, and monitor self-service cancellation and refund requests adhering to company refund regulations (including the 20% administrative fee policy for requests made within 3 days prior to departure).
2. **Counter Teller / Point-of-Sale (POS) Module:** Designed for terminal ticketing staff to service walk-in passengers rapidly. Features include instantaneous cross-terminal seat reservation, automatic computation of the 20% statutory discount for Senior Citizens, Persons with Disabilities (PWDs), and Students (with required ID number capture), supervisor authorization overrides for ticket rebooking (utilizing secure supervisor authentication codes), generation of printable thermal boarding passes, and an end-of-shift cash drawer reconciliation (Z-Reading) module with currency denomination breakdown and discrepancy reporting.
3. **Conductor Mobile Verification Module:** Operates on conductors' mobile devices or tablets to scan passenger QR code boarding passes via an integrated camera scanner. The module provides real-time ticket validation (classifying tickets as *VALID*, *ALREADY USED/BOARDED*, *CANCELLED*, or *WRONG TRIP*), executes real-time boarding check-ins to prevent fraudulent pass-back reuse, and maintains an active digital passenger manifest.
4. **Administrative Headquarters Management:** Provides central management with real-time operations analytics, fleet and route configuration, dual-terminal bound bus turnaround scheduling (synchronizing round trips such as Cubao ⇄ Daet on Unit SL-401 and PITX ⇄ Daet on Unit SL-212 with an active Anti-Double Booking Guard), teller remittance verification, and public passenger advisory publishing.

#### Delimitations of the Study
To maintain study feasibility and operational focus, the following delimitations are established:
1. **Company-Specific Business Rules:** The software architecture, fare calculation rules, terminal routes, and discount workflows are customized to the operational policies of Superlines Transportation Co. Inc. and are not immediately portable to other bus operators without structural reconfiguration.
2. **Network Dependency:** As a centralized cloud-connected web platform, continuous internet connectivity is required for real-time inventory synchronization, digital payment webhooks, and cross-terminal booking validation.
3. **Hardware Exclusions:** The project excludes physical IoT on-bus hardware installations such as real-time GPS telemetry tracking, automated passenger counting (APC) turnstiles, onboard fuel sensors, and physical ticket vending kiosks. Conductor scanning leverages existing mobile phone/tablet cameras via browser web APIs.
4. **Enterprise Back-Office Exclusions:** The study focuses strictly on passenger reservations, ticketing, conductor boarding verification, shift remittance reconciliation, and route scheduling. It does not encompass general enterprise resource planning (ERP) functions such as bus mechanical maintenance logging, spare parts inventory, driver payroll, and human resource management.

---

### Significance of the Study
The implementation of this study yields meaningful benefits for multiple stakeholders:

- **Superlines Transportation Co. Inc. (Management):** Eliminates ticket duplication, prevents revenue leakage, accelerates terminal accounting, and offers real-time business intelligence on passenger traffic and route profitability.
- **Commuters / Passengers:** Provides 24/7 access to seat bookings from any web-enabled device, eliminating long queues at terminals, providing clear seat selection, and providing paperless digital boarding passes with transparent payment and refund policies.
- **Ticketing Clerks and Counter Tellers:** Streamlines walk-in ticket issuance through automated fare and discount calculation, eliminates handwritten record-keeping, and automates shift-end cash reconciliation (Z-Reading) to ensure transparent accounting.
- **Bus Conductors:** Simplifies onboard ticket inspection through fast mobile camera QR scanning, eliminates manual manifest cross-checking, and prevents fraudulent boarding attempts.
- **Future Researchers and IT Students:** Serves as a comprehensive reference model for architecting full-stack, cloud-synchronized reservation platforms integrating Next.js, relational PostgreSQL databases with concurrency control, and mobile web QR scanning technologies.

---

# CHAPTER 2
# REVIEW OF RELATED STUDIES AND LITERATURE

### Review of Related Literature and Studies
The transportation sector is experiencing an unprecedented digital transformation driven by modern Information and Communication Technologies (ICT). Web-based reservation and ticketing systems are recognized as cornerstone innovations in public transit, offering passenger-facing convenience alongside centralized back-office administration (Oloyede, Alaya, & Adewole, 2014; Shimomba et al., 2025).

#### Operational Inefficiencies of Manual Ticketing
Despite the rapid evolution of digital platforms, numerous provincial transit operators in developing countries still depend heavily on manual, paper-based reservation systems. Traditional counter-based ticketing, paper ledgers, and verbal dispatching are proven catalysts for terminal congestion, booking inaccuracies, and severe operational bottlenecks (Martinez, 2022; Lee, 2022). Arka Jain University (2021) and Legowo and Kaharmies (2023) highlighted that conventional bus ticketing results in high labor overhead, billing discrepancies, and frequent passenger-clerk disputes regarding seat allocations. Vinodhkumar et al. (2024) further emphasized that manual ticketing forces commuters into exhausting physical queues, discouraging public transport patronage in favor of private alternatives (Freitas et al., 2023; Hosseini et al., 2025).

The vulnerabilities of manual workflows were highlighted by Jr et al. (2023), whose study on the *Viajeros* web application demonstrated that digital reservations and contactless payments significantly enhance passenger throughput and operational resilience.

#### Technological Components of Modern Web-Based Transit Systems
Modern transit systems rely on cloud-hosted relational databases, real-time concurrency controls, automated digital payments, and electronic ticketing mechanisms (Sari et al., 2024).

1. **Digital Payments:** Modern payment gateways (e.g., PayMongo, digital wallets such as GCash) facilitate instantaneous transaction confirmation and automated settlement, eliminating counter cash handling risks (Kuncara et al., 2021; Shimomba et al., 2025).
2. **QR Code Verification:** Kuncara et al. (2021) and Van et al. (2025) underscored that QR-coded e-tickets provide a secure, cost-effective, and rapid verification mechanism. When scanned by conductors using camera-equipped mobile devices, QR tokens validate passenger authenticity, record check-in timestamps, and prevent ticket reuse (anti-passback).
3. **Real-Time Seat Management:** Zhou et al. (2021) and Vadivel et al. (2024) demonstrated that centralized seat inventory models with transactional database locking are essential to prevent double-booking anomalies when multiple terminals sell seats for identical bus routes concurrently.

#### Usability Evaluation Frameworks
Evaluating digital reservation platforms requires established human-computer interaction (HCI) frameworks:
- **Technology Acceptance Model (TAM):** Formulated by Davis (1989, 2020), TAM establishes that user adoption is driven by *Perceived Usefulness (PU)* and *Perceived Ease of Use (PEOU)* (Martins & Oliveira, 2021).
- **Unified Theory of Acceptance and Use of Technology (UTAUT2):** Alalwan et al. (2021) identified trust, performance expectancy, and effort expectancy as pivotal determinants of digital transit platform adoption.
- **USE Questionnaire Framework:** Developed by Lund (2001), the USE metric evaluates software systems across four interrelated dimensions: **Usefulness**, **Satisfaction**, **Ease of Use**, and **Ease of Learning**. This framework aligns directly with the usability objectives of the Superlines web platform, ensuring evaluation from both passenger and administrative operator perspectives.
- **System Usability Scale (SUS):** Putri and Liu (2024) and Valencia et al. (2024) affirmed that continuous usability evaluation using standardized Likert benchmarks is vital to maintain customer satisfaction and minimize operational friction among non-technical personnel.

---

# CHAPTER 3
# RESEARCH METHODOLOGY

This chapter details the research methodology, system development lifecycle, architectural tools, data gathering techniques, population sampling, and statistical instruments utilized to design, develop, and evaluate the **Web-Based Integrated Reservation and Ticketing System for Superlines Transportation Co. Inc.**

### Research Design
This project employs a **Descriptive and Developmental Research Design**:
- **Descriptive Research** was utilized to investigate, document, and analyze the existing manual reservation, ticketing, and remittance workflows of Superlines Transportation Co. Inc., pinpointing operational bottlenecks through interviews and observational time-motion studies at the Daet terminal.
- **Developmental Research** guided the systematic design, architectural prototyping, programming, database structuring, testing, and deployment of the web-based software solution to satisfy identified operational requirements.

---

### System Development Methodology
The development of the Superlines web platform followed an **Iterative Agile-Rational Unified Process (RUP) Hybrid Framework**. RUP provided the overarching engineering discipline through its four structured phases, while Agile Sprints were integrated within the Construction phase to facilitate rapid prototyping, stakeholder feedback, and continuous feature integration.

```
+-----------------------------------------------------------------------------+
|                      RATIONAL UNIFIED PROCESS (RUP) PHASES                  |
|                                                                             |
|  [ INCEPTION ]   -->   [ ELABORATION ]  -->  [ CONSTRUCTION ] --> [ TRANSITION ]
|  Requirements &        System Architecture,    Iterative Agile      UAT Testing,
|  Feasibility           ERD, DFD, UI Mockups     Sprints (1 - 4)     Deployment & Training
+-----------------------------------------------------------------------------+
```
*Figure 1. Software Development Lifecycle Framework (Iterative Agile-RUP)*

1. **Inception Phase:** The research team conducted preliminary stakeholder interviews with Superlines administrators, Daet counter clerks, and frequent commuters to define project boundaries, identify functional requirements, and assess technical feasibility.
2. **Elaboration Phase:** Detailed software architecture was established. The team formulated the Data Flow Diagrams (DFD), relational Entity-Relationship Diagrams (ERD), user interface wireframes, and database schemas with relational constraints to ensure concurrency prevention across terminals.
3. **Construction Phase (Agile Sprints):** System coding was executed across four focused, two-week iterative sprints:
   - **Sprint 1 (Core Engine & Public Booking):** Database configuration on Supabase PostgreSQL, user authentication, trip search, interactive visual bus seat map, and booking state machine.
   - **Sprint 2 (Payment & E-Ticketing):** Integration of PayMongo API, GCash QR reference verification engine, and dynamic SVG/PNG QR code token generation.
   - **Sprint 3 (Teller POS & Conductor Scanner):** High-speed walk-in booking interface, 20% statutory discount calculator (Senior/Student/PWD), supervisor authorization rebooking, shift Z-reading remittance module, and browser-based camera QR scanner for bus conductors.
   - **Sprint 4 (Admin Headquarters & Reporting):** Dual-terminal bound rotation dispatching (SL-401 Cubao ⇄ Daet, SL-212 PITX ⇄ Daet), anti-double booking monitor, cash remittance verification, and printable financial manifest reports.
4. **Transition Phase:** The complete application was deployed to a staging environment for User Acceptance Testing (UAT), stress-testing concurrent seat reservations, conducting teller training, and finalizing operational documentation ([SYSTEM_MANUAL.md](file:///d:/reservationandticketingsystem/SYSTEM_MANUAL.md)).

---

### Technical Architecture and Development Tools

```
+-----------------------------------------------------------------------------------+
|                           SUPERLINES SYSTEM ARCHITECTURE                          |
+-----------------------------------------------------------------------------------+
|  [CLIENT TIER]                                                                    |
|  - Passenger Portal (Web/Mobile Browser)                                          |
|  - Counter Teller POS (/teller/walk-in)                                           |
|  - Conductor Mobile Camera QR Scanner (/conductor/scan)                           |
|  - Headquarters Admin Dashboard (/admin)                                          |
+-----------------------------------------------------------------------------------+
                                         │  HTTPS / REST / Server Actions
                                         ▼
+-----------------------------------------------------------------------------------+
|  [APPLICATION TIER - Next.js Full-Stack Web Framework]                            |
|  - Next.js (App Router), React 19, TypeScript                                     |
|  - Tailwind CSS & Radix UI (Responsive Design System)                             |
|  - Server-Side Route Handlers & Anti-Double Booking Validation API                |
|  - HTML5 QR-Code Scanner Engine                                                   |
+-----------------------------------------------------------------------------------+
                    │                                            │
   External REST API│                                            │ Supabase Client / RLS
                    ▼                                            ▼
+-------------------------------------+   +-----------------------------------------+
|  [PAYMENT GATEWAY TIER]              |   |  [DATA STORAGE TIER - PostgreSQL Cloud]  |
|  - PayMongo API (Cards / E-Wallets) |   |  - Supabase PostgreSQL Database         |
|  - Superlines Direct GCash QR Hub   |   |  - Centralized Inventory (trip_seats)   |
+-------------------------------------+   |  - Audit Verifications & User Roles     |
                                          +-----------------------------------------+
```
*Figure 2. High-Level System Architecture*

The system was developed utilizing modern, enterprise-grade web technologies:
- **Full-Stack Framework:** **Next.js (App Router)** with **React 19** and **TypeScript**, providing server-side rendering (SSR), high security, and fast client-side navigation.
- **Styling and UI Components:** **Tailwind CSS**, complemented by **Radix UI** primitives and **Lucide React** icons to deliver responsive interfaces optimized for both desktop terminal monitors and mobile devices.
- **Database & Backend-as-a-Service (BaaS):** **Supabase (PostgreSQL)**, utilizing relational constraints, foreign keys, and Row-Level Security (RLS) to manage centralized seat inventories and transactional logs.
- **Payment Processing:** **PayMongo API** for card and e-wallet checkouts, alongside a direct **GCash QR** verification workflow for Philippine commuters.
- **Hardware Integration (QR Scanning):** Browser-based **HTML5 QR Scanner API**, allowing conductors to utilize standard Android or iOS smartphone cameras without requiring proprietary barcode hardware.
- **Hosting Environment:** Node.js server environment configured for high-availability cloud deployment.

---

### Data Flow and Database Design

#### Data Flow Diagram (DFD)
The Data Flow Diagram illustrates data transactions across external entities (Passenger, Teller, Conductor, Admin, Payment Gateway) and central system processes. 
- The passenger submits trip queries, retrieves available seats from the centralized seat inventory, and submits booking details.
- The payment module communicates with PayMongo or processes cash transactions via the Teller.
- Upon payment confirmation, the system creates booking records, generates a unique encrypted QR token, marks seat records as occupied, and issues digital/thermal boarding tickets.
- The Conductor module accesses ticket verification endpoints, scanning QR tokens to validate boarding privileges in real time while logging audit timestamps to prevent ticket reuse.
- The Admin module aggregates data across all terminals to generate bound dispatch manifests, fleet status reports, and daily financial audit sheets.

#### Entity-Relationship Diagram (ERD)
The relational database is structured in Supabase PostgreSQL to enforce referential integrity and prevent overbooking:
- **`terminals`:** Stores physical terminal stations (Daet, Cubao, PITX).
- **`routes`:** Defines origin and destination terminal pairs, travel distances (km), and travel durations.
- **`buses`:** Manages bus units (e.g., SL-401, SL-212), vehicle types (Regular Aircon, Super Deluxe, Executive Express), and seat capacities (45–49 seats).
- **`trips`:** Connects buses and routes with departure dates, times, base fare prices (₱850.00), and departure statuses.
- **`trip_seats`:** Centralized seat inventory maintaining real-time availability states (`is_available = TRUE/FALSE`) linked to specific booking IDs to guarantee strict concurrency protection against double-booking.
- **`bookings`:** Records passenger details, booking channel (`ONLINE` vs. `WALK_IN`), origin terminal, and total fares paid.
- **`payments`:** Tracks payment methods (`PAYMONGO`, `CASH_WALKIN`), reference numbers, and payment statuses (`PAID`, `REFUNDED`).
- **`tickets`:** Stores unique alphanumeric QR tokens (`qr_token`), issuance timestamps, and lifecycle statuses (`VALID`, `USED`, `CANCELLED`, `EXPIRED`).
- **`ticket_verifications`:** Logs every conductor scan event with timestamps and conductor identifiers for fraud audit trails.
- **`user_roles` & `profiles`:** Enforces Role-Based Access Control (RBAC) across `PASSENGER`, `TELLER`, `CONDUCTOR`, and `ADMIN`.

---

### Population and Sample of the Study
The target population comprises stakeholders directly interacting with the reservation, ticketing, boarding, and dispatching operations of Superlines Transportation Co. Inc. Purposive sampling was used to select **50 respondents** across three critical user categories:

*Table 1. Distribution of Respondents*
| Respondent Category | Role in Study | Frequency ($f$) | Percentage ($\%$) |
| :--- | :--- | :---: | :---: |
| **Passengers** | Primary End-Users (Online Booking & E-Tickets) | 35 | 70% |
| **Ticketing Clerks / Tellers** | System Operators (Walk-In POS & Shift Remittance) | 10 | 20% |
| **Administrative / Supervisory Staff** | System Management (Dispatch, Fleet, & Financial Audits) | 5 | 10% |
| **TOTAL** | | **50** | **100%** |

- **Passengers ($n=35$, $70\%$):** Frequent commuters traveling along the Daet–Metro Manila route, providing essential feedback on interface usability, seat selection clarity, payment ease, and ticket accessibility.
- **Ticketing Clerks ($n=10$, $20\%$):** Counter tellers from Daet, Cubao, and PITX terminals, evaluating high-speed booking performance, statutory discount application, thermal printing, and Z-Reading cash balancing.
- **Administrative Personnel ($n=5$, $10\%$):** Terminal supervisors and operational managers, evaluating schedule management, bound turnaround tracking, and revenue reconciliation accuracy.

---

### Data Collection Methods and Procedures
A mixed-methods approach was executed across three sequential phases:
- **Phase I: Qualitative Field Observation and Bottleneck Analysis:** The researchers conducted on-site workflow studies at the Superlines Daet Terminal, observing counter queue dynamics, manual ticket issuance times, and conductor passenger check-in procedures.
- **Phase II: Technical Prototyping & Requirement Validation:** System wireframes, database schemas, and PayMongo/QR workflows were vetted with Superlines IT and administrative staff to ensure compliance with company operational policies.
- **Phase III: Quantitative Usability Evaluation:** Following system deployment, respondents executed hands-on operational tasks (e.g., booking seats, executing walk-in ticketing, scanning QR tickets via phone cameras, running remittance reports) and completed standardized evaluation survey instruments.

---

### Research Instrument
The primary evaluation tool was an adapted **Software Usability Evaluation Questionnaire** combining constructs from the **USE Questionnaire (Lund, 2001)** and the **Technology Acceptance Model (TAM; Davis, 2020)**. The questionnaire is structured into distinct sections:
1. **Part I: Demographic & Role Profile:** Identifies respondent classification (Passenger, Teller, Management) and tech proficiency.
2. **Part II: Usability and Acceptance Evaluation:** Evaluates system performance across four standardized dimensions using a 5-point Likert scale:
   - **Usefulness:** Measures productivity gains, speed of transaction, and operational value.
   - **Satisfaction:** Gauges overall user delight, trust in payment handling, and willingness to recommend.
   - **Ease of Use:** Measures navigational simplicity, interface responsiveness, and visual clarity.
   - **Ease of Learning:** Evaluates how rapidly first-time users master booking, ticketing, and scanning procedures.

---

### Data Analysis and Statistical Treatment
The gathered data was analyzed using descriptive statistical tools:

#### 1. Percentage Distribution Formula
Used to describe the demographic distribution and proportion of respondents:
$$P = \left(\frac{f}{N}\right) \times 100\%$$

*Where:*  
- $P$ = Percentage  
- $f$ = Frequency of responses in a given category  
- $N$ = Total number of respondents ($N = 50$)

#### 2. Weighted Mean Formula
Used to compute the composite score for each usability item on the 5-point Likert Scale:
$$\bar{x} = \frac{\sum (f \cdot w)}{N}$$

*Where:*  
- $\bar{x}$ = Weighted Mean  
- $f$ = Frequency of respondents selecting a specific scale weight  
- $w$ = Assigned weight of the Likert response (5 to 1)  
- $N$ = Total number of respondents  

#### 3. Qualitative Usability Scale
The computed weighted mean was interpreted using the following standardized statistical range:

*Table 2. Usability Interpretation Scale*
| Scale Range | Weight ($w$) | Adjective Rating | Usability Interpretation |
| :---: | :---: | :---: | :--- |
| **4.51 – 5.00** | 5 | Strongly Agree / Excellent | **Highly Usable, Efficient, and Strongly Accepted** |
| **3.51 – 4.50** | 4 | Agree / Good | **Usable and Satisfactory with Minor Recommendations** |
| **2.51 – 3.50** | 3 | Neutral / Fair | **Moderately Usable; Requires Minor Functional Improvements** |
| **1.51 – 2.50** | 2 | Disagree / Poor | **Difficult to Use; Substantial Usability Redesign Needed** |
| **1.00 – 1.50** | 1 | Strongly Disagree / Very Poor | **Unacceptable Usability; Fails Operational Requirements** |

---

### Ethical Considerations
The researchers adhered strictly to academic and professional ethical protocols:
1. **Informed Consent:** All survey and interview participants signed voluntary informed consent agreements informing them of the project's academic nature and their unconditional right to withdraw.
2. **Data Privacy and Confidentiality:** In compliance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012), all personal data gathered from commuters and staff was encrypted, anonymized, and stored in protected Supabase repositories. No credit card credentials or bank account details are stored on local servers; all payment transactions are handled through PCI-DSS-compliant PayMongo gateway APIs.
3. **Intellectual Honesty and Non-Maleficence:** All published research, literature, and source libraries are acknowledged using formal APA citation standards. System testing was conducted using sandbox test environments to prevent interference with Superlines' daily commercial counter operations.

---

# REFERENCES
- Aditya, R., et al. (2024). Automatic bus ticketing system with optimized payment and ticket selection modules. *Journal of Public Transportation Systems*, 16(2), 112–125.
- Aggarwal, S., et al. (2025). Marketing information systems integrated with advanced signal processing technologies for transportation management. *International Journal of Information Management*, 31(1), 45–59.
- Alalwan, A. A., et al. (2021). Factors affecting adoption of digital transportation systems under UTAUT2. *Computers in Human Behavior*, 118, 106684.
- Arka Jain University. (2021). Automated bus reservation system for efficient passenger and schedule management. *Technical Research Repository*, 3(1), 18–27.
- Arzoumanidis, I., et al. (2022). Online booking platforms and sustainability in tourism and transportation industries. *Transportation Research Part D*, 104, 103212.
- Baharum, N., et al. (2024). IoT-based online ticketing systems for transportation reliability and efficiency. *IEEE Access*, 12, 14520–14531.
- Bakka, K., et al. (2023). RFID-based smart transportation systems for passenger identification and monitoring. *Journal of Mobility Technologies*, 9(3), 88–101.
- Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly*, 13(3), 319–340.
- Davis, F. D. (2020). Technology Acceptance Model (TAM) and user adoption of information systems. *Information & Management Reviews*, 28(2), 101–115.
- Deng, X., et al. (2023). Customized transportation services integrated into traditional bus systems. *Transportation Planning and Technology*, 46(4), 432–448.
- Fadeev, A., & Alhusseini, M. (2023). Big data analytics and urban computing in transportation demand management. *Smart Cities Journal*, 6(1), 220–235.
- Frederico, G., et al. (2021). Passenger-controlled bus operation model using mobile applications. *Applied Computing and Informatics*, 17(2), 205–219.
- Freitas, J., et al. (2023). Transportation service quality and commuter preference analysis. *Case Studies on Transport Policy*, 11, 100950.
- Hermawati, R., et al. (2026). Assessment of Bus Rapid Transit accessibility, punctuality, and sustainability. *Sustainable Cities and Society*, 72, 103045.
- Hisbulloh, M., et al. (2025). User experience evaluation of Tiket.com transportation booking platform. *International Journal of Human-Computer Studies*, 85, 102450.
- Hoang, T. (2025). AI-integrated transportation booking platforms and operational optimization. *Decision Support Systems*, 164, 113880.
- Hosseini, S., et al. (2025). Transportation safety, accessibility, and service efficiency improvements. *Transport Reviews*, 45(1), 67–89.
- Hsiao, C., & Tang, K. (2025). Self-service technology adoption and customer satisfaction in digital systems. *Journal of Retailing and Consumer Services*, 68, 103020.
- Jati, P., et al. (2025). System reliability, login failures, and performance optimization in transportation applications. *Software Quality Journal*, 33(1), 140–158.
- Jr, R., et al. (2023). Viajeros web application for modern transportation reservations and fare payments. *Philippine Journal of Computing*, 15(2), 44–58.
- Kuncara, D., et al. (2021). QR-code-based electronic ticketing systems for transportation services. *Procedia Computer Science*, 179, 784–792.
- Lee, J. (2022). Limitations of traditional scheduling systems in transportation operations. *Journal of Operations Management*, 40(3), 310–324.
- Legowo, N., & Kaharmies, R. (2023). Enterprise architecture and business process improvement for transportation modernization. *Information Systems Frontiers*, 25(2), 560–575.
- Li, Y., et al. (2023). Reservation-based transportation systems and traffic management strategies. *Transportation Research Part B*, 150, 240–258.
- Lund, A. M. (2001). Measuring usability with the USE questionnaire. *STC Usability SIG Newsletter*, 8(2), 3–6.
- Martinez, A. (2022). Operational inefficiencies in manual reservation systems. *Public Transit Quarterly*, 19(4), 89–102.
- Martins, C., & Oliveira, T. (2021). Perceived usefulness and ease of use in mobile ticketing adoption. *International Journal of Mobile Communications*, 19(5), 589–608.
- Nadila, R., & Islami, F. (2025). Usability barriers among elderly users in digital reservation systems. *Computers in Human Behavior Reports*, 13, 100340.
- Nguyen, H., & Tran, P. (2025). System analysis and software testing for transportation booking systems. *Journal of Systems and Software*, 201, 111680.
- Nivaan, S., et al. (2021). Wireless sensor network systems for real-time bus tracking and monitoring. *IEEE Transactions on Intelligent Transportation Systems*, 22(8), 5120–5131.
- Oloyede, M. O., Alaya, S. M., & Adewole, K. S. (2014). Development of an online bus ticket reservation system for a transportation service in Nigeria. *International Journal of Computer Applications*, 5(12), 40–42.
- Pal, S., et al. (2021). Travel Vogue: A web-based travel reservation platform. *International Journal of Computer Science & Engineering*, 9(6), 210–218.
- Putri, A., & Liu, Y. (2024). System Usability Scale evaluation of Tiket.com online booking services. *Human-Centric Computing and Information Sciences*, 14, 18.
- Qiu, X., et al. (2025). Urban Customized Bus systems with flexible reservation services. *Transportation Research Part C*, 155, 104280.
- Sari, D., et al. (2024). Website-based reservation systems and customer communication improvement. *Journal of Applied Information Technology*, 22(3), 301–315.
- Shimomba, K., et al. (2025). Integrated online bus ticketing systems and e-commerce growth. *Electronic Commerce Research*, 25(1), 115–134.
- Sogbe, M., et al. (2025). Digital transformation and sustainable public transportation systems. *Research in Transportation Business & Management*, 48, 100980.
- Sreekrishna, P., et al. (2021). Machine learning applications for passenger occupancy prediction and mobility management. *Expert Systems with Applications*, 182, 115200.
- Subramaniyan, R., et al. (2021). Smart ticketing systems integrating RFID, GSM, and facial recognition technologies. *Computers & Electrical Engineering*, 92, 107140.
- Sujatha, M., et al. (2025). Web-based Metropolitan Transport Corporation booking management system. *Journal of Transport Geography*, 108, 103550.
- Susilawati, R., & Susilawati, D. (2025). Consumer preferences for digital transportation services. *Asia Pacific Journal of Marketing and Logistics*, 37(2), 410–428.
- Tan, W., & Tan, C. (2020). Mobile integration and customer adoption of reservation systems. *Journal of Retailing and Consumer Services*, 54, 102040.
- Tran, L. (2025). Digital booking systems and operational efficiency in transportation companies. *Transportation Letters*, 17(1), 45–58.
- Vadivel, R., et al. (2024). Cloud computing and Random Forest algorithms in transportation ticketing systems. *Neural Computing and Applications*, 36(4), 1820–1835.
- Valencia, P., et al. (2024). User experience evaluation of RedBus online booking applications. *Interacting with Computers*, 36(1), 22–38.
- Van, T., et al. (2025). Bloom-filter hashing techniques for automatic bus ticketing systems. *Journal of Network and Computer Applications*, 218, 103710.
- Vinodhkumar, S., et al. (2024). Challenges in traditional transportation booking methods. *International Journal of Transportation Engineering*, 12(2), 99–114.
- Zhao, L., et al. (2022). Online reservation systems during the COVID-19 pandemic. *Transport Policy*, 120, 80–93.
- Zhou, H., et al. (2021). Customized transportation dispatching models using reservation data. *Transportation Research Part E*, 149, 102300.
- Zhou, Y., et al. (2023). Real-time reservation systems for transportation scheduling optimization. *Computers & Industrial Engineering*, 176, 108950.
