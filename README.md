# School Admission System (বিদ্যালয় ভর্তি পোর্টাল)

An online school admission system built for **Onnorokom Projukti Limited** recruitment assignment (Assistant Software Engineer). The system handles high-concurrency first-come-first-served (FCFS) seat holds with temporary expiration, admission confirmation, and real-time updates.

---

## 🛠️ Tech Stack

- **Backend:** C# (.NET 8 Web API), PostgreSQL 16, Entity Framework Core with Npgsql
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **DevOps:** Docker & Docker Compose
- **Testing:** xUnit (.NET 8), Vitest & React Testing Library (React)

---

## 🚀 Quick Start with Docker

The entire stack (PostgreSQL, Backend, Frontend) runs with a single command without needing anything else installed on the host machine.

### 1. Run Application

```bash
docker compose up --build
```

### 2. Access the Application

- **Frontend Portal (Landing Page):** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger:** [http://localhost:8080/swagger](http://localhost:8080/swagger)

---

## 🧭 Application Flows

### 1. First Page (Landing Page)
- **"ভর্তির জন্য আবেদন করুন (Apply for Admission)"**: Opens the Student Portal with 17-digit birth registration input, live seat cards, real-time hold countdown modal, and application history.
- **"প্রশাসক লগইন (Admin Login)"**: Opens the Admin authentication portal.

### 2. Admin Portal & Seeded Credentials
- **Username:** `admin`
- **Password:** `admin123`
- A **"1-Click Login"** button is pre-built on the UI for quick evaluation.
- Features:
  - **Class Table:** View and add academic classes (e.g. Class 6, 7, 8, etc.).
  - **Shift Table:** View and add shifts (e.g. Morning Shift, Day Shift).
  - **Create Session:** Select Class + Shift + Total Seats to publish admission sessions.
  - **Live Sessions Table:** Real-time seat tracking (Total, Held, Confirmed, Available).

---

## 🧪 Running Automated Tests

### Backend Automated Tests (including Concurrency Test)
Run the 12 automated backend integration & concurrency tests:
```bash
cd backend
dotnet test
```

The test suite includes:
- **`ConcurrencyTests.cs`**: Sends 30 simultaneous requests for a 5-seat class in parallel via `Task.WhenAll` to prove that exactly 5 succeed (201 Created), 25 fail (409 Conflict), and seats are never over-held.
- **`AdmissionApiTests.cs`**: End-to-end lifecycle verification (class creation, hold reservation, seat metrics calculation, payment confirmation, hold cancellation).
- **`ValidationAndRuleTests.cs`**: 17-digit birth registration number validation, prevention of multiple active holds per student in the same class, cross-student confirmation prevention, and confirmation idempotency.

### Frontend Automated Tests
Run Vitest component tests:
```bash
cd frontend
npm test
```

---

## ⚙️ Environment Variables

### Backend
- `ConnectionStrings__DefaultConnection`: PostgreSQL connection string (defaults to containerized db).
- `HOLD_DURATION_SECONDS`: Temporary hold duration in seconds (defaults to `600` / 10 minutes).
- `ASPNETCORE_URLS`: Port binding (defaults to `http://+:8080`).

### Frontend
- `VITE_API_URL`: Backend URL for API requests (defaults to `http://localhost:8080`).

---

## 📁 Repository Structure

```
├── backend/
│   ├── SchoolAdmission.Api/      # .NET 8 Web API
│   ├── SchoolAdmission.Tests/    # xUnit automated tests
│   ├── SchoolAdmission.sln       # .NET Solution
│   └── Dockerfile                # Multi-stage ASP.NET build
├── frontend/
│   ├── src/                      # React 18 TypeScript source
│   ├── Dockerfile                # Nginx multi-stage build
│   └── nginx.conf                # SPA routing configuration
├── docker-compose.yml            # Container orchestration
├── README.md                     # Setup and running instructions
└── ASSUMPTIONS.md                # System assumptions & concurrency rationale
```
