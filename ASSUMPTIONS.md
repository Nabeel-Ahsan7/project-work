# ASSUMPTIONS.md

This document outlines key technical assumptions made during the design and implementation of the School Admission System where the specification allowed design discretion.

---

## 1. Concurrency Across Multiple Backend Processes (Bonus Requirement §2.6)

### How Rule 1 is strictly guaranteed across any number of backend processes:
**Requirement:** Under no circumstances should `held + confirmed > totalSeats` for any class, even when multiple backend processes run simultaneously on separate ports/containers pointing to the same PostgreSQL database.

**Implementation Strategy:**
- Instead of relying on in-memory locks (such as C# `lock` or `SemaphoreSlim`, which only work within a single process), we utilize **PostgreSQL Row-Level Locking (`SELECT ... FOR UPDATE`) within an explicit database transaction (`ReadCommitted` isolation level)**:
  ```csharp
  using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);
  
  // Exclusively lock the class row for the duration of seat evaluation and hold creation
  var lockedClass = await _db.Classes
      .FromSqlRaw("SELECT * FROM classes WHERE \"Id\" = {0} FOR UPDATE", classId)
      .FirstOrDefaultAsync();

  // Atomically calculate active holds and confirmed seats in DB
  var confirmedCount = await _db.Holds.CountAsync(h => h.ClassId == classId && h.Status == "CONFIRMED");
  var heldCount = await _db.Holds.CountAsync(h => h.ClassId == classId && h.Status == "HELD" && h.ExpiresAt > now);

  if (confirmedCount + heldCount >= lockedClass.TotalSeats) {
      return 409 Conflict; // No seats available
  }

  // Insert new hold and commit transaction
  _db.Holds.Add(newHold);
  await _db.SaveChangesAsync();
  await transaction.CommitAsync();
  ```
- Any concurrent request hitting **any backend instance** targeting the same class will be forced to wait at the database engine level until the holding transaction commits. This makes overbooking physically impossible across 1, 2, or 100 backend replicas.

---

## 2. Dynamic Hold Expiration & Self-Releasing Seats

- **Specification:** Seats must return automatically upon expiration without requiring any external API call.
- **Assumption & Implementation:**
  - **Query-Time Calculation:** For all queries (`GET /classes`, `GET /classes/{id}`, `POST /classes/{id}/holds`), a hold is considered active only if `Status == 'HELD' AND ExpiresAt > DateTime.UtcNow`. The moment current UTC time passes `ExpiresAt`, the seat is instantly recognized as available, achieving zero-latency seat release.
  - **Background Worker (`ExpiredHoldsCleanerService`):** An asynchronous `BackgroundService` runs periodically to formally persist the transition of expired holds to status `EXPIRED` in the database without any user trigger.

---

## 3. Student Identification & Validation

- The student's 17-digit birth registration number is passed via the `X-Student-Id` HTTP header.
- We validate that `X-Student-Id` consists of **exactly 17 numeric digits** (`^\d{17}$`). Any request missing the header or containing an invalid format receives a structured `400 Bad Request` response, adhering to Rule 7 (4xx error, never 500).

---

## 4. Entity Identification Format

- Class IDs are formatted with a `c_` prefix followed by a unique hexadecimal string (e.g., `c_a1b2c3d4`), matching the document's example format (`c_123`).
- Hold IDs are formatted with an `h_` prefix followed by a unique hexadecimal string (e.g., `h_789abcde`), matching the document's example format (`h_789`).

---

## 5. Idempotent Confirmation & Payment Simulation

- `POST /holds/{holdId}/confirm` assumes payment succeeds instantly (no third-party payment gateway integration required).
- If a student or network retry submits confirmation multiple times for an already `CONFIRMED` hold, the endpoint returns `200 OK` with status `CONFIRMED` without incrementing `confirmedSeats` more than once (Rule 5).
