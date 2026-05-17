# AtomQuest Hackathon 1.0 — Goal Setting & Tracking Portal

> A full-stack web portal for managing employee goal setting, approvals, quarterly check-ins, and performance tracking across an organisation.

---

## 🔗 Live Demo

**URL:** `https://YOUR-DEPLOYED-APP-URL.web.app`

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@demo.com | Demo@1234 |
| Manager (L1) | manager@demo.com | Demo@1234 |
| Admin / HR | admin@demo.com | Demo@1234 |

---

## 📌 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [User Roles](#user-roles)

---

## ✅ Features

### Phase 1 — Goal Creation & Approval
- Employee goal sheet form with Thrust Area, UoM type, Target, Weightage, and Description
- Real-time weightage counter with strict validation:
  - Total must equal exactly **100%**
  - Minimum **10%** per individual goal
  - Maximum **8 goals** per employee per cycle
- Save as Draft or Submit for Approval
- Manager review dashboard — Approve or Return with mandatory comment
- Goal sheet locking on approval (no edits without Admin unlock)
- Admin can unlock any goal sheet (action logged in audit trail)

### Phase 2 — Achievement Tracking
- Quarterly achievement entry per goal (Actual Value + Status)
- Status options: Not Started / On Track / Completed
- System-computed progress scores for all 4 UoM types:
  - **Numeric Min** (higher is better) — `Actual ÷ Target × 100`
  - **Numeric Max** (lower is better) — `Target ÷ Actual × 100`
  - **Timeline** — 100% if completed on or before deadline, else 0%
  - **Zero** — 100% if actual = 0, else 0%
- Visual circular progress indicator per goal

### Admin & Governance
- Goal cycle management — activate / deactivate phases
- Achievement report export as **CSV** and **Excel (.xlsx)**
- Audit trail for all post-lock changes
- Role-based access control on all routes

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Motion (Framer Motion) |
| Backend / API | Express.js (`server.ts`) |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Hosting | Firebase Hosting |
| Export | PapaParse (CSV) + SheetJS (Excel) |

---

## 📁 Project Structure

```
atomquest/
├── src/
│   ├── pages/
│   │   ├── Login.tsx               # Login page with demo role switcher
│   │   ├── Dashboard.tsx           # Role-aware home dashboard
│   │   ├── GoalSheetForm.tsx       # Employee goal creation & editing
│   │   ├── ApprovalDashboard.tsx   # Manager review & approval
│   │   ├── AchievementTracking.tsx # Quarterly achievement entry
│   │   └── AdminPanel.tsx          # Cycle management, exports, unlock
│   ├── components/
│   │   ├── Layout.tsx              # Sidebar navigation + header
│   │   ├── ProtectedRoute.tsx      # Role-based route guard
│   │   └── ui/                     # shadcn/ui primitives
│   ├── lib/
│   │   ├── firebase.ts             # Firebase app initialisation
│   │   ├── AuthContext.tsx         # Auth state + mock login
│   │   ├── scoring.ts              # UoM score computation (all 4 types)
│   │   ├── constants.ts            # Thrust areas, UoM types, demo creds
│   │   └── utils.ts                # Shared utilities
│   ├── types.ts                    # TypeScript interfaces for all entities
│   ├── App.tsx                     # Router + route definitions
│   └── main.tsx                    # React entry point
├── server.ts                       # Express server + validation API
├── firebase-blueprint.json         # Firestore schema documentation
├── firestore.rules                 # Firestore security rules
├── .env.example                    # Environment variable template
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (free Spark plan is sufficient)
- Firebase CLI — `npm install -g firebase-tools`

### Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/atomquest-portal.git
cd atomquest-portal
npm install
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase project values:

```bash
cp .env.example .env.local
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🔥 Firebase Setup

### 1. Create a Firebase project

Go to [console.firebase.google.com](https://console.firebase.google.com), create a new project, and register a Web App to get your config values.

### 2. Enable Authentication

In the Firebase console → Authentication → Sign-in method → enable **Email/Password**.

### 3. Enable Firestore

Firebase console → Firestore Database → Create database → Start in **test mode** (you can apply security rules later).

### 4. Deploy Firestore security rules

```bash
firebase login
firebase init firestore   # select your project
firebase deploy --only firestore:rules
```

### 5. Seed demo data

The app includes a mock login that looks up demo users from Firestore by role. You need to seed these users once before the demo works.

Run the seed script in your Firebase console (Firestore → start a collection called `users`) or use the Firebase Admin SDK. Create three documents with these fields:

**Employee user:**
```json
{
  "name": "Ananya Sharma",
  "email": "employee@demo.com",
  "role": "employee",
  "department": "Sales",
  "managerId": "<manager_document_id>"
}
```

**Manager user:**
```json
{
  "name": "Rahul Mehta",
  "email": "manager@demo.com",
  "role": "manager",
  "department": "Sales",
  "managerId": null
}
```

**Admin user:**
```json
{
  "name": "Priya Nair",
  "email": "admin@demo.com",
  "role": "admin",
  "department": "HR",
  "managerId": null
}
```

Also create a `cycles` collection with one active cycle document:

```json
{
  "name": "FY26 Goal Cycle",
  "phase": "goal_setting",
  "windowOpenDate": "2026-05-01T00:00:00.000Z",
  "windowCloseDate": "2026-06-30T00:00:00.000Z",
  "isActive": true
}
```

---

## 💻 Running Locally

The app uses an Express server (`server.ts`) that serves both the validation API and the Vite frontend in development.

```bash
# Start the full app (Vite + Express together)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** If you run `vite dev` directly, the `/api/goals/validate` endpoint won't be available. Always use `npm run dev` which starts the Express server.

---

## 🌐 Deployment

### Deploy to Firebase Hosting

```bash
# Build the production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at `https://YOUR-PROJECT-ID.web.app`.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│           Browser  (React 18 + TypeScript)       │
│  Employee  |  Manager (L1)  |  Admin / HR        │
│  Role-based protected routes · shadcn/ui         │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────┐         ┌────────▼───────┐
│ Validation   │         │ Scoring Engine │
│ Express API  │         │ scoring.ts     │
│ /api/goals   │         │ (client-side)  │
│ /validate    │         │ All 4 UoM types│
└───────┬──────┘         └────────────────┘
        │ Firestore SDK
┌───────▼──────────────────────────────────────────┐
│              Firebase Firestore                   │
│  users · cycles · goalSheets                     │
│  goalSheets/{id}/goals                           │
│  goalSheets/{id}/goals/{id}/achievements         │
│  auditLogs                                       │
└──────────────────────────────────────────────────┘
        │
┌───────▼──────────────────────────────────────────┐
│              Firebase Platform                    │
│  Auth (Email/Password)  ·  Hosting (CDN/HTTPS)  │
│  Firestore Security Rules                        │
└──────────────────────────────────────────────────┘
```

### Firestore Data Model

```
users/{userId}
cycles/{cycleId}
goalSheets/{goalSheetId}
  └── goals/{goalId}
        └── achievements/{achievementId}
goalSheets/{goalSheetId}/comments/{commentId}
auditLogs/{logId}
```

---

## 👥 User Roles

### Employee
- Create and edit goals (before submission)
- Submit goal sheet for manager approval
- View locked goals after approval
- Log quarterly actual achievement and status
- View real-time progress scores

### Manager (L1)
- Dashboard of all direct reports and their goal sheet status
- Review submitted goal sheets, edit targets/weightages inline
- Approve (locks the sheet) or Return with mandatory comment
- View team achievement vs planned targets per quarter
- Add quarterly check-in comments per team member

### Admin / HR
- Activate and configure goal cycles and phase windows
- View all employees' goal sheets across departments
- Unlock a goal sheet for correction (logged in audit trail)
- Export achievement report as CSV or Excel
- View audit trail of all post-lock changes

---

## 📋 Validation Rules

| Rule | Value |
|------|-------|
| Total weightage across all goals | Must equal exactly **100%** |
| Minimum weightage per goal | **10%** |
| Maximum goals per employee per cycle | **8** |
| Goal sheet editable after approval | Only via Admin unlock |

---

## 📦 Key Dependencies

```json
{
  "react": "^18",
  "typescript": "^5",
  "vite": "^5",
  "firebase": "^10",
  "express": "^4",
  "tailwindcss": "^3",
  "motion": "^11",
  "papaparse": "^5",
  "xlsx": "^0.18",
  "sonner": "^1",
  "react-router-dom": "^6"
}
```

---

## 📄 License

Built for AtomQuest Hackathon 1.0. Internal use only.
