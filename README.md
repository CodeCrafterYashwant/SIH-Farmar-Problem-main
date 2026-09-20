# 🌾 e-Krishi Mandi: Smart Procurement & Live Token Management Platform
### SIH Problem Statement ID: SIH26032 | Smart India Hackathon

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/UI-React%2018-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Server-Express.js-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Mongoose-darkgreen?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Real--Time-Socket.io-orange?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32%20IoT-red?style=for-the-badge&logo=espressif)](https://www.espressif.com/)

> **A high-efficiency, transparent digital procurement ecosystem engineered to eradicate long mandi queues, eliminate distress sales, automate weighbridge quality control via IoT, and guarantee instant Direct Benefit Transfer (DBT) credit tracking for farmers across India.**

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [High-Level Architecture](#-high-level-architecture)
3. [Key Modules & Features](#-key-modules--features)
   - [1. Farmer Service Portal](#1-farmer-service-portal)
   - [2. Mandi Staff Operations Desk](#2-mandi-staff-operations-desk)
   - [3. Government Admin Command Center](#3-government-admin-command-center)
   - [4. ESP32 IoT Weighbridge & QC Hardware](#4-esp32-iot-weighbridge--qc-hardware)
   - [5. AI Multilingual Kisan Assistant & Accessibility](#5-ai-multilingual-kisan-assistant--accessibility)
   - [6. Route Protection & RBAC Security Guard](#6-route-protection--rbac-security-guard)
4. [Technology Stack](#-technology-stack)
5. [Database Architecture & Data Models](#-database-architecture--data-models)
6. [Complete REST API Reference](#-complete-rest-api-reference)
7. [Installation & Deployment Guide](#-installation--deployment-guide)
8. [Automated Verification & Test Suites](#-automated-verification--test-suites)
9. [Project Creator & Attribution](#-project-creator--attribution)

---

## 🎯 Executive Summary & Problem Statement

### The Problem
During peak harvesting seasons, agricultural mandis and government procurement centers face severe logistical paralysis:
- **Exorbitant Waiting Times**: Farmers wait in tractor lines for 24 to 72 hours outside mandi gates without live updates.
- **Opacity in Weighing & Grading**: Discretionary manual deductions for moisture and foreign matter cause farmer dissatisfaction and monetary loss.
- **Traffic Congestion & Spoilage**: Unregulated arrivals cause traffic gridlocks and subject exposed produce to spoilage and weather damage.
- **Delayed Payment Information**: Farmers often wait days to know whether their produce was approved, certified, and when payment was transferred.

### The Solution: e-Krishi Mandi (SIH26032)
A unified digital platform backed by **IoT automation**, **capacity-managed slot reservations**, **real-time WebSocket queues**, and **direct DBT/PFMS banking ledgers**.
- Farmers book guaranteed arrival time slots from their phones.
- Mandi gates check in farmers via digital token slips (`TKN-YYYYMMDD-XXXX`).
- Smart weighbridges capture certified weights and grain moisture automatically via ESP32 telemetry.
- Direct benefit vouchers are calculated transparently against official Minimum Support Prices (MSP) and tracked in real-time.

---

## 🏗️ High-Level Architecture

```
                                  +---------------------------------------+
                                  |     Farmer / Staff / Admin Clients    |
                                  |   Next.js 14 App Router + Tailwind    |
                                  +-------------------+-------------------+
                                                      |
                                       HTTPS (REST)   |   WSS (Socket.io)
                                                      v
                                  +---------------------------------------+
                                  |       Node.js + Express REST API      |
                                  |     JWT Auth + RBAC + Controllers     |
                                  +---------+-------------------+---------+
                                            |                   |
                     +----------------------+                   +-----------------------+
                     |                                                                  |
                     v                                                                  v
+--------------------+-------------------+                               +--------------+----------------+
|          MongoDB / Mongoose            |                               |       ESP32 IoT Hardware       |
|  - Farmers       - Bookings            |                               |  - HX711 Digital Load Cells    |
|  - Staff         - Procurement         |                               |  - Moisture QC Probes          |
|  - Mandi Centres - Payments            |                               |  - Wi-Fi Telemetry Ingestion   |
|  - Time Slots    - Reviews             |                               +-------------------------------+
+----------------------------------------+
```

---

## 🌟 Key Modules & Features

### 1. Farmer Service Portal
- **One-Click Mobile Registration & Login**: Simplified farmer onboarding with Aadhaar, mobile verification, and bank account / IFSC validation for Direct Benefit Transfers (DBT).
- **Mandi Discovery & MSP Information Directory**: Live search of procurement centers with current operational capacity, distance, accepted crops (Wheat, Paddy, Mustard, Gram, Soyabean), and official government MSP rates per quintal.
- **Capacity-Managed Slot Booking**: Real-time slot allocation in 2-hour windows with atomic overbooking protection preventing mandi overload.
- **Digital Token Slip Issuance**: Instant generation of unique tokens (`TKN-YYYYMMDD-XXXX`) with printable slips, QR verification, and automated confirmation emails.
- **My Bookings Dashboard**: Real-time status pipeline tracking appointment progress: `Booked` ➔ `CheckedIn` ➔ `Serving` ➔ `Procured` ➔ `Cancelled`.
- **Live Mandi Queue Monitor**: Farmers track live queue numbers from anywhere without having to queue up physically.
- **DBT Payment Passbook**: Full transparency on net weighed grain, moisture deductions, applicable MSP rate, bank reference (UTR) numbers, and disbursement dates.
- **Mandi Reviews & Quality Ratings**: Transparent farmer feedback mechanism allowing 1-5 star ratings and comments on mandi speed, scale accuracy, and staff conduct.

### 2. Mandi Staff Operations Desk
- **Gate Check-In Terminal**: Quick search and validation of arriving farmers via token number, name, or phone; validates appointment date and assigns sequential queue tokens.
- **Digital Weighbridge Operator Desk**: Call-next farmer management with synchronized WebSocket broadcasting across mandi display boards.
- **Quality Inspection & Procurement Logger**:
  - Grain moisture percentage inspection (automatic moisture penalties/bonuses).
  - Official quality grading (Grade A / FAQ / Under-Grade).
  - Automated net payout calculation based on certified net weight and MSP rates.
- **Payment Voucher Generation**: Automatic issuance of pending DBT disbursement vouchers upon weighing completion.
- **Bank UTR & Transaction Ledger**: Staff logging of banking transaction IDs (UTR) with automated email alerts dispatched to farmers.

### 3. Government Admin Command Center
- **State-Level Executive Dashboard**: Real-time KPI monitors displaying total registered farmers, active mandi centers, total grain procured (in Quintals/MT), and funds disbursed.
- **Mandi Centre Provisioning**: Add new mandi centers, configure geographical coordinates, assign unique mandi codes, and update dynamic crop MSP rates.
- **Weighbridge Staff Provisioning**: Secure creation and assignment of operator credentials bound to specific mandi locations.
- **Automated Slot Batch Generator**: Generate appointment slots across single or multiple days (operating between 09:00 AM – 06:00 PM) with custom capacity limits per hour.
- **Audit Reports & CSV Export**: Comprehensive data filtering by date range and mandi center with one-click export to CSV for auditing and state record-keeping.

### 4. ESP32 IoT Weighbridge & QC Hardware
- **Integrated Hardware Firmware**: C++ firmware for ESP32 micro-controllers available directly in the Staff IoT interface.
- **Sensors Supported**:
  - **HX711 24-bit ADC Amplifier** paired with heavy-duty load cell sensors for certified digital weighing.
  - **Analog/Capacitive Grain Moisture Sensors** for tamper-proof moisture measurement.
- **Real-Time Telemetry Bridge**: Direct HTTPS/JSON ingestion (`/api/iot/weighbridge`) streaming live weights into the mandi queue system to avoid manual tampering.

### 5. AI Multilingual Kisan Assistant & Accessibility
- **Interactive Voice/Chat Kisan Assistant**: Integrated AI chatbot assisting farmers in booking slots, finding mandi locations, learning MSP rates, and checking required documentation.
- **Bilingual Support (English & Hindi)**: Complete localized UI with seamless instant language switching.
- **Official Government Accessibility Features**:
  - Font scaling controls (`A-`, `A`, `A+`) compliant with accessibility standards.
  - High-contrast visual hierarchy for outdoor visibility on basic smartphones.

### 6. Route Protection & RBAC Security Guard
- **Client-Side AuthGuard (`AuthGuard.js`)**: Comprehensive interceptor that prevents unauthorized users from opening protected routes (`/my-bookings`, `/payments`, `/centres/[id]/book`, `/staff/*`, `/admin/*`).
- **Instant Redirection**: Unauthenticated visits to protected pages are redirected immediately to the home page (`http://localhost:3000/`) without flashing error messages or exposing sensitive UI.
- **Role Enforcement**: Strict segregation ensuring farmers cannot access staff/admin tools, and staff cannot access state-level administrator settings.
- **Session Auto-Purge**: Automatically cleans corrupted or expired JWT tokens upon receiving 401 responses and safely redirects to home.

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | **Next.js 14 (App Router)** | High-performance React application with server-side rendering and client optimization |
| **Styling & Design** | **Tailwind CSS + Lucide React** | Government-grade portal theme, fully responsive, mobile-first |
| **Backend Framework** | **Node.js + Express.js** | Modular RESTful API handling auth, slots, queue, procurement, and reports |
| **Database** | **MongoDB + Mongoose** | NoSQL database with strict schema validation, compound indexes, and atomic updates |
| **Real-Time Communication**| **Socket.io** | Low-latency WebSockets for live mandi queue boards and weighbridge callouts |
| **Security & Auth** | **JWT (JSON Web Tokens) + bcryptjs**| Stateless authentication with role-based access control and password hashing |
| **Notifications** | **Nodemailer** | Event-triggered automated email receipts for bookings and disbursements |
| **Hardware / IoT** | **ESP32 + C++ (Arduino)** | Load cell and grain moisture sensor telemetry integration |

---

## 🗄️ Database Architecture & Data Models

1. **Farmer (`Farmer.js`)**: Name, unique mobile, unique email, hashed password, state, district, village, bank details (`accountNumber`, `ifsc`, `accountHolder`).
2. **Staff (`Staff.js`)**: Full name, unique username, hashed password, assigned `centreId`, role (`staff` | `admin`).
3. **ProcurementCentre (`ProcurementCentre.js`)**: Mandi name, unique code, address, district, state, handled crop types, and MSP rate mapping (`ratePerKg`).
4. **Slot (`Slot.js`)**: Mandi reference (`centreId`), date, start/end time windows, maximum vehicle capacity (`maxCapacity`), and booked vehicles count (`bookedCount`).
5. **Booking (`Booking.js`)**: Unique digital token (`tokenNumber`), references to farmer, slot, and mandi center, appointment status (`Booked`, `CheckedIn`, `Serving`, `Procured`, `Cancelled`), queue position, and timestamps.
6. **Procurement (`Procurement.js`)**: Weighed grain records linked to booking, certified net weight (`quantityKg`), moisture content (`moisturePercent`), quality grade (`Grade A`, `FAQ`, `Under-Grade`), base MSP rate, and calculated total payout amount.
7. **Payment (`Payment.js`)**: DBT passbook transaction, procurement reference, payable amount, payment status (`Pending` | `Paid`), bank reference / UTR number, and disbursement timestamp.
8. **Review (`Review.js`)**: Farmer feedback linked to booking and mandi center with 1-5 star ratings, review comments, and verified submission dates.

---

## 📡 Complete REST API Reference

### 🔐 Authentication & Profile (`/api/auth`)
- `POST /api/auth/register` — Farmer account creation
- `POST /api/auth/login` — Farmer login (returns JWT token & profile)
- `POST /api/auth/staff-login` — Staff & Admin authentication with role verification
- `GET  /api/auth/me` — Retrieve profile of currently authenticated user

### 🏛️ Mandi Centres (`/api/centres`)
- `GET  /api/centres` — List all active procurement mandi centers
- `GET  /api/centres/:id` — Retrieve specific mandi center details and MSP tiers
- `POST /api/centres` — Create a new mandi center *(Admin only)*
- `PUT  /api/centres/:id` — Update mandi details and crop MSP rates *(Admin only)*

### 📅 Capacity Slots (`/api/slots`)
- `GET  /api/slots?centreId={id}&date={YYYY-MM-DD}` — Fetch available capacity slots
- `POST /api/slots` — Generate weekly/daily operating slots *(Admin only)*

### 🎫 Bookings & Tokens (`/api/bookings`)
- `POST   /api/bookings` — Book a procurement slot and issue token *(Farmer only)*
- `GET    /api/bookings/my` — Fetch authenticated farmer's bookings *(Farmer only)*
- `DELETE /api/bookings/:id` — Cancel appointment and free up slot capacity *(Farmer only)*

### ⏱️ Real-Time Queue (`/api/queue`)
- `POST /api/queue/checkin` — Check in arriving farmer at gate & assign queue position *(Staff only)*
- `POST /api/queue/call-next` — Call next queued farmer to weighbridge scale *(Staff only)*
- `GET  /api/queue/:centreId/live` — Real-time queue snapshot (public display board)

### ⚖️ Procurement & Weighbridge (`/api/procurement`)
- `POST /api/procurement` — Record certified scale weight, moisture %, grade & value *(Staff only)*
- `GET  /api/procurement/:id` — Fetch certified procurement receipt

### 💳 Payments & DBT Ledger (`/api/payments`)
- `GET   /api/payments/my` — Fetch DBT passbook records for farmer *(Farmer only)*
- `PATCH /api/payments/mark-paid` — Record bank transaction UTR number *(Staff / Admin)*

### ⭐ Mandi Reviews (`/api/reviews`)
- `POST /api/reviews` — Submit mandi rating and review for completed booking *(Farmer only)*
- `GET  /api/reviews/my` — Retrieve all reviews submitted by logged-in farmer *(Farmer only)*
- `GET  /api/reviews/centre/:centreId` — Public review summary and average rating for mandi

### 📡 IoT Scale Telemetry (`/api/iot`)
- `POST /api/iot/weighbridge` — Automated scale weight & moisture ingestion from ESP32

### 📊 Admin Analytics & Reports (`/api/admin`)
- `GET /api/admin/dashboard` — Statewide procurement metrics, active farmers, and disbursements
- `GET /api/admin/reports/procurement?from={date}&to={date}` — Audit ledger with date filters
- `GET /api/admin/staff` — List mandi staff operators *(Admin only)*
- `POST /api/admin/staff` — Create new mandi staff member *(Admin only)*

---

## 🚀 Installation & Deployment Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (default `mongodb://localhost:27017`) or MongoDB Atlas URI
- **npm** or **yarn**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sih_procurement
JWT_SECRET=sih26032_smart_procurement_secret_key_2026
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
CLIENT_URL=http://localhost:3000
```

Start the backend server:
```bash
# Development mode with nodemon
npm run dev

# Production start
npm start
```
*Backend runs on `http://localhost:5000` with WebSocket server initialized on the same port.*

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the Next.js development server:
```bash
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🧪 Automated Verification & Test Suites

The backend comes equipped with comprehensive integration and schema tests:

```bash
cd backend

# 1. Verify all 8 Mongoose schemas, indexes, and password hashing
npm run test:models

# 2. Verify Authentication, Admin Provisioning, and Capacity Slot Booking Rules
npm run test:phases234

# 3. Verify Gate Check-in, Live Queue, IoT Weighbridge, and Payment Ledgers
npm run test:phases567
```

To build and validate the frontend production bundle:
```bash
cd frontend
npm run build
```

---

## 👨‍💻 Project Creator & Attribution

```
===================================================================================
                    SIH26032: SMART PROCUREMENT PLATFORM
===================================================================================

  This entire project — including system architecture, backend REST APIs,
  database design, Next.js frontend UI, real-time WebSocket queuing,
  ESP32 IoT weighbridge telemetry, automated tests, and security AuthGuards —
  was conceived, designed, and developed entirely by:

                           YASHWANT NAMDEV
                    Full-Stack & IoT Systems Engineer
               GitHub: https://github.com/CodeCrafterYashwant

===================================================================================
```
