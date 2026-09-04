# Event Management System (EMS) - Database Specification

## 1. Overview
This document specifies the database design, Entity-Relationship (ER) model, SQL DDL table creation scripts, MongoDB Mongoose schemas, index optimizations, integrity constraints, and initial seed data for the **Event Management System (EMS)** based on [idea.md](file:///c:/Users/acer/Desktop/workshop/idea.md) and [architecture.md](file:///c:/Users/acer/Desktop/workshop/architecture.md).

---

## 2. Entity-Relationship (ER) Diagram

```
+-------------------+             +-------------------+             +-------------------+
|      USERS        |             |      EVENTS       |             |   REGISTRATIONS   |
+-------------------+             +-------------------+             +-------------------+
| id (PK)           | 1         * | id (PK)           | 1         * | id (PK)           |
| email (UQ)        +-------------< organizer_id (FK) | +-----------< event_id (FK)     |
| password_hash     |             | title             |             | user_id (FK)-----+| (From USERS)
| full_name         |             | description       |             | qr_code_hash (UQ) |
| role (ENUM)       |             | date_time         |             | status (ENUM)     |
| created_at        |             | capacity          |             | registered_at     |
+---------+---------+             | status (ENUM)     |             +-------------------+
          |                       +-------------------+
          |                                                                   ^
          +-------------------------------------------------------------------+
```

---

## 3. SQL Relational Schema (PostgreSQL DDL)

```sql
-- Create Enum Types
CREATE TYPE user_role AS ENUM ('HEAD_USER', 'VIEWER');
CREATE TYPE event_status AS ENUM ('DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE ticket_status AS ENUM ('CONFIRMED', 'CHECKED_IN', 'CANCELLED');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'VIEWER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    banner_url VARCHAR(500),
    location VARCHAR(255) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    registered_count INT NOT NULL DEFAULT 0 CHECK (registered_count <= capacity),
    status event_status NOT NULL DEFAULT 'UPCOMING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Registrations (Tickets) Table
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qr_code_hash VARCHAR(255) UNIQUE NOT NULL,
    status ticket_status NOT NULL DEFAULT 'CONFIRMED',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_event_registration UNIQUE (user_id, event_id)
);
```

---

## 4. NoSQL Schema Option (MongoDB / Mongoose)

```javascript
// UserSchema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['HEAD_USER', 'VIEWER'], default: 'VIEWER' }
}, { timestamps: true });

// EventSchema
const EventSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  bannerUrl: { type: String },
  location: { type: String, required: true },
  dateTime: { type: Date, required: true, index: true },
  capacity: { type: Number, required: true, min: 1 },
  registeredCount: { type: Number, default: 0 },
  status: { type: String, enum: ['DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'], default: 'UPCOMING' }
}, { timestamps: true });

// RegistrationSchema
const RegistrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  qrCodeHash: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['CONFIRMED', 'CHECKED_IN', 'CANCELLED'], default: 'CONFIRMED' }
}, { timestamps: true });

// Compound Unique Index: One registration per user per event
RegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
```

---

## 5. Indexing Strategy & Performance Optimization

| Table / Collection | Column / Field | Index Type | Business Rationale |
| :--- | :--- | :--- | :--- |
| `users` | `email` | B-Tree / Unique | Fast lookup during login authentication. |
| `events` | `date_time` | B-Tree | Optimizes sorting and filtering for upcoming events. |
| `events` | `organizer_id` | B-Tree | Fast lookup for Head User dashboard event queries. |
| `registrations` | `qr_code_hash` | B-Tree / Unique | Near-instant verification during on-site QR scanner check-in. |
| `registrations` | `(user_id, event_id)` | Compound Unique | Prevents duplicate event registrations. |

---

## 6. Seed Data (Initial Population SQL)

```sql
-- Insert Head User
INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'head.organizer@ems.com', '$2b$10$e8w.x.5p6c...', 'Sarah Jenkins (Head)', 'HEAD_USER');

-- Insert Viewer User
INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'viewer.attendee@ems.com', '$2b$10$e8w.y.6q7d...', 'Alex Morgan (Viewer)', 'VIEWER');

-- Insert Sample Event created by Head User
INSERT INTO events (id, organizer_id, title, description, location, date_time, capacity, registered_count, status) VALUES 
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tech Innovation Summit 2026', 'Annual conference highlighting AI, web development, and cloud computing trends.', 'Convention Center, Hall A', '2026-10-15 09:00:00+00', 500, 1, 'UPCOMING');

-- Insert Registration for Viewer User
INSERT INTO registrations (event_id, user_id, qr_code_hash, status) VALUES 
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'sha256_hash_token_example_987654321', 'CONFIRMED');
```
