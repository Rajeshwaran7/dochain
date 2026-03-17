# 🏥 Dochain — Hyperlocal Doctor Discovery & Appointment Booking Platform

A production-ready SaaS MVP built as an NX Monorepo with Next.js 14, NestJS, PostgreSQL, and Razorpay.

---

## 📐 Architecture

```
┌──────────────────┐    ┌──────────────────┐
│  Patient PWA     │    │  Doctor PWA      │
│  (Next.js :3001) │    │  (Next.js :3002) │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └──────────┬────────────┘
                    ▼
          ┌─────────────────┐
          │  Nginx Gateway  │  :80 / :443
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │  NestJS API     │  :4000
          └──┬──────────┬───┘
             │          │
     ┌───────▼──┐  ┌────▼──────┐
     │PostgreSQL│  │ Razorpay  │
     │  :5432   │  │ Payments  │
     └──────────┘  └───────────┘
```

## 🗂️ Monorepo Structure

```
dochain/
├── apps/
│   ├── api/                    # NestJS REST API
│   │   └── src/
│   │       ├── auth/           # JWT + Google OAuth
│   │       ├── doctors/        # Doctor search & profiles
│   │       ├── patients/       # Patient management
│   │       ├── appointments/   # Booking + cron reminders
│   │       ├── availability/   # Slot management
│   │       ├── reviews/        # Ratings & reviews
│   │       ├── subscriptions/  # Razorpay integration
│   │       └── admin/          # Admin dashboard API
│   │
│   ├── web-patient/            # Patient Next.js PWA (:3001)
│   │   └── src/app/
│   │       ├── page.tsx        # Landing page
│   │       ├── auth/           # Login / Register
│   │       ├── doctors/        # Search + Doctor profile
│   │       ├── appointments/   # Booking history
│   │       └── dashboard/      # Patient dashboard
│   │
│   └── web-doctor/             # Doctor Next.js PWA (:3002)
│       └── src/app/
│           ├── dashboard/      # Analytics + schedule
│           ├── appointments/   # Manage appointments
│           ├── availability/   # Set working hours
│           ├── subscription/   # Razorpay plans
│           └── profile/        # Clinic setup
│
├── libs/
│   ├── database/src/entities/  # All TypeORM entities
│   ├── ui/                     # Shared React components
│   ├── auth/                   # Shared auth helpers
│   ├── validation/             # Shared Zod schemas
│   └── utils/                  # Shared utilities
│
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web-patient
│   ├── Dockerfile.web-doctor
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/dochain.conf
│   └── postgres/init.sql
│
├── docker-compose.yml
├── .env                        # Environment template
└── nx.json
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- npm 10+

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env .env.local
# Edit .env.local with your credentials
```

### 3. Start the database
```bash
docker-compose up postgres -d
```

### 4. Run all services
```bash
# API
nx serve api

# Patient app
nx serve web-patient

# Doctor dashboard
nx serve web-doctor
```

Or using npm scripts:
```bash
npm run start:api
npm run start:patient
npm run start:doctor
```

**URLs:**
| Service | URL |
|---|---|
| Patient App | http://localhost:3001 |
| Doctor Dashboard | http://localhost:3002 |
| API | http://localhost:4000/api/v1 |
| Swagger Docs | http://localhost:4000/api/docs |

---

## 🐳 Docker Deployment

```bash
# Build & run all services
docker-compose up --build -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `DB_HOST` / `DB_PORT` | PostgreSQL connection |
| `JWT_SECRET` | JWT signing secret (use strong random string) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `GOOGLE_CLIENT_ID` | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app client secret |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret |
| `SMTP_*` | Email SMTP configuration |

---

## 🗄️ Database Entities

| Entity | Description |
|---|---|
| `User` | Core user (all roles) |
| `Doctor` | Doctor profile, specialization, ratings |
| `Patient` | Patient profile, medical history |
| `Clinic` | Clinic location, contact, photos |
| `Appointment` | Booking record with status lifecycle |
| `Availability` | Weekly slot schedule per doctor |
| `AvailabilityException` | Holidays / custom hours |
| `Review` | Patient ratings (1-5★) with doctor reply |
| `Subscription` | Razorpay subscription tracking |

---

## 🌐 REST API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register (patient / doctor) |
| POST | `/auth/login` | Email + password login |
| POST | `/auth/refresh` | Refresh access token |
| GET  | `/auth/google` | Google OAuth redirect |
| GET  | `/auth/me` | Get current user |

### Doctors
| Method | Endpoint | Description |
|---|---|---|
| GET  | `/doctors` | Search with filters |
| GET  | `/doctors/:id` | Doctor profile |
| POST | `/doctors/profile` | Create profile (doctor) |
| PUT  | `/doctors/profile` | Update profile |
| POST | `/doctors/clinic` | Create/update clinic |

### Appointments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/appointments` | Book appointment |
| GET  | `/appointments/patient` | Patient appointments |
| GET  | `/appointments/doctor` | Doctor appointments |
| GET  | `/appointments/slots/:doctorId` | Available slots |
| PUT  | `/appointments/:id/status` | Update status |

### Availability
| Method | Endpoint | Description |
|---|---|---|
| GET  | `/availability/:doctorId` | Get availability |
| POST | `/availability` | Set weekly slots |
| POST | `/availability/exception` | Add holiday/custom day |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| GET  | `/reviews/:doctorId` | Get doctor reviews |
| POST | `/reviews` | Submit review |
| POST | `/reviews/:id/reply` | Doctor reply |

### Subscriptions
| Method | Endpoint | Description |
|---|---|---|
| GET  | `/subscriptions/plans` | List all plans |
| GET  | `/subscriptions/me` | My subscription |
| POST | `/subscriptions/create` | Create subscription |
| POST | `/subscriptions/webhook` | Razorpay webhook |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET  | `/admin/dashboard` | Platform analytics |
| GET  | `/admin/doctors` | List all doctors |
| PUT  | `/admin/doctors/:id/approve` | Approve doctor |
| PUT  | `/admin/doctors/:id/reject` | Reject doctor |
| GET  | `/admin/patients` | List patients |

---

## 💳 Razorpay Setup

1. Create a Razorpay account at [razorpay.com](https://razorpay.com)
2. Create subscription plans in the Razorpay dashboard:
   - Basic: ₹499/month
   - Pro: ₹999/month
   - Featured: ₹1999/month
3. Copy plan IDs and set in `.env`:
   ```
   RAZORPAY_PLAN_BASIC=plan_xxxx
   RAZORPAY_PLAN_PRO=plan_xxxx
   RAZORPAY_PLAN_FEATURED=plan_xxxx
   ```
4. Configure webhook URL in Razorpay dashboard:
   `https://api.dochain.in/api/v1/subscriptions/webhook`

---

## 📦 Subscription Plans

| Plan | Price | Features |
|---|---|---|
| Free | ₹0 | 10 appointments/month, basic listing |
| Basic | ₹499/mo | 50 appointments, patient management |
| Pro | ₹999/mo | Unlimited + analytics + SMS reminders |
| Featured | ₹1999/mo | Top listing + dedicated manager |

---

## 🔔 Cron Jobs

| Job | Schedule | Description |
|---|---|---|
| Appointment Reminders | Daily 8 AM | Email/SMS for tomorrow's appointments |

---

## 🧪 Development Tips

```bash
# Run only API in watch mode
nx serve api

# Check TypeScript
nx run-many --target=typecheck --all

# Lint everything
npm run lint:all

# Build all for production
npm run build:all
```

---

## 🚀 VPS Deployment Checklist

- [ ] Install Docker & Docker Compose on VPS
- [ ] Configure DNS: `dochain.in`, `doctor.dochain.in`, `api.dochain.in`
- [ ] Obtain SSL certificates (Let's Encrypt recommended)
- [ ] Place certs in `docker/nginx/ssl/`
- [ ] Set all production env vars in `.env`
- [ ] Run `docker-compose up --build -d`
- [ ] Verify health: `curl https://api.dochain.in/api/v1/health`

---

## 📄 License

MIT — built for the Dochain platform.

---

## 📁 Note on Dynamic Route Folder

After extracting, rename the folder:
```
apps/web-patient/src/app/doctors/__id__/
→ apps/web-patient/src/app/doctors/[id]/
```
This is the Next.js dynamic route for the doctor profile page. The brackets were renamed to `__id__` to ensure compatibility with all ZIP extractors (Windows Explorer, macOS Archive Utility, etc.).
