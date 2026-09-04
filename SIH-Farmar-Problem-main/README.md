# Smart Procurement Management Platform for Farmers (SIH26032)

> A modern, end-to-end digital platform designed to eliminate waiting times, establish transparent grain procurement, manage live queues, and provide instant direct benefit transfer (DBT) records for farmers at government procurement centres.

---

## 🌟 Key Features

### 🌾 1. Farmer Portal (Phase 8)
- **Fast Registration & Login**: Multi-identifier signup with banking (DBT) details and encrypted password protection.
- **Mandi Discovery**: Real-time list of government procurement centres, crop types handled, and official MSP rates.
- **Guaranteed Slot Booking**: Capacity-managed 2-hour window appointments with atomic overbooking protection.
- **Unique Digital Token**: Instant token generation (`TKN-YYYYMMDD-XXXX`) with email confirmation.
- **My Bookings Dashboard**: Real-time status tracking (`Booked` → `CheckedIn` → `Serving` → `Procured` → `Cancelled`).
- **Live Queue Tracking**: Track scale queue numbers live from any smartphone.
- **DBT Payment Ledgers**: Complete transparency on quantity, quality grade, rates, and bank UTR numbers.

### 🏢 2. Staff Operations Desk (Phase 9)
- **Gate Check-in Desk**: Lookup arriving farmers by token or name and assign sequential queue positions.
- **Weighbridge Controller & Scale Window**: Call next farmers into active scales with automatic WebSocket broadcasting.
- **Procurement Recording**: Inspect crop moisture %, assign quality grade (A/B/C), weigh net batch, and calculate total value.
- **Voucher Issuance**: Automatically generate Pending DBT vouchers upon weighing.
- **Disbursement Registry**: Record bank UTR transmission numbers and trigger payment completion receipts.

### 🏛️ 3. Government Admin Central (Phase 10)
- **Real-time Statewide Dashboard**: Monitor total centres, farmer registrations, arrival tokens, and treasury disbursements.
- **Mandi Centre Provisioning**: Create centres, assign codes, and configure crop MSP rate tiers.
- **Officer Provisioning**: Register staff operators linked to specific mandi scales.
- **Batch Slot Generator**: Provision weekly appointment capacity across 09:00 - 18:00 daily operating windows.
- **Audit Reports & CSV Export**: Comprehensive audit logs with date-range filters and one-click CSV export.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express.js (REST API) |
| **Database** | MongoDB + Mongoose (7 core models with indexes) |
| **Real-time** | Socket.io (`/queue` namespace with `centre_<centreId>` rooms) |
| **Notifications** | Nodemailer (event-triggered email notifications) |
| **Authentication** | JWT + bcryptjs (Role-based access control: `farmer`, `staff`, `admin`) |
| **Frontend** | Next.js 14 (App Router) + React + Tailwind CSS + Lucide Icons |

---

## 📋 Data Models (Phase 1)

1. **Farmer**: Name, mobile (unique), email (unique), password (hashed), village, district, state, bankAccount (`accountNumber`, `ifsc`, `accountHolder`).
2. **Staff**: Name, username (unique), password (hashed), centreId, role (`staff` | `admin`).
3. **ProcurementCentre**: Name, code (unique), district, state, cropTypesHandled, ratePerKg map.
4. **Slot**: CentreId, date, startTime, endTime, maxCapacity, bookedCount.
5. **Booking**: FarmerId, slotId, centreId, tokenNumber (unique), status (`Booked` | `CheckedIn` | `Serving` | `Procured` | `Cancelled`), queuePosition.
6. **Procurement**: BookingId, farmerId, cropType, quantityKg, moisturePercent, qualityGrade, ratePerKg, totalAmount.
7. **Payment**: ProcurementId, farmerId, amount, status (`Pending` | `Paid`), bankReferenceNumber, paidAt.

---

## 🚀 Quickstart & Setup Guide

### 1. Backend Setup

```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sih_procurement
JWT_SECRET=sih26032_smart_procurement_secret_key_2026
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:3000
```

Run tests:
```bash
# Verify all 7 Mongoose schemas & bcrypt hashing
npm run test:models

# Verify Auth, Admin, and Slot booking rules (Phases 2, 3, 4)
npm run test:phases234

# Verify Live Queue, Procurement, and Email Notifications (Phases 5, 6, 7)
npm run test:phases567
```

Start backend:
```bash
npm start
# Server runs on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Configure `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start development server:
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 📡 API Reference Overview

- `GET /api/health` — System status and database health
- `POST /api/auth/register` — Farmer account creation
- `POST /api/auth/login` — Farmer login
- `POST /api/auth/staff-login` — Staff / Admin login
- `GET /api/auth/me` — Authenticated profile retrieval
- `GET /api/centres` — List active procurement mandis
- `POST /api/centres` — Create new mandi (Admin only)
- `GET /api/slots?centreId&date` — Available slots (`bookedCount < maxCapacity`)
- `POST /api/slots` — Generate slots across date range (Admin only)
- `POST /api/bookings` — Book an appointment slot (Farmer only)
- `GET /api/bookings/my` — Farmer's appointments (Farmer only)
- `DELETE /api/bookings/:id` — Cancel appointment (Farmer only)
- `POST /api/queue/checkin` — Check in farmer and assign queue number (Staff only)
- `POST /api/queue/call-next` — Call next checked-in farmer to scale (Staff only)
- `GET /api/queue/:centreId/live` — Real-time queue snapshot
- `POST /api/procurement` — Record grain weighing and quality (Staff only)
- `PATCH /api/payments/mark-paid` — Record bank UTR number (Staff/Admin)
- `GET /api/payments/my` — Farmer payment ledgers (Farmer only)
- `GET /api/admin/dashboard` — Platform KPI statistics (Admin only)
- `GET /api/admin/reports` — Audit logs and date-range reports (Admin only)
