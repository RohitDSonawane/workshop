# Event Management System (EMS) - Technical Architecture Specification

## 1. Executive Summary
This document outlines the system architecture, database design, API specification, security model, and component interactions for the **Event Management System (EMS)** defined in [idea.md](file:///c:/Users/acer/Desktop/workshop/idea.md).

---

## 2. High-Level System Architecture

```
                                  +-----------------------+
                                  |     Client Layer      |
                                  +-----------+-----------+
                                              |
                        +---------------------+---------------------+
                        |                                           |
             +----------v----------+                     +----------v----------+
             | Head User Dashboard |                     | Viewer Dashboard    |
             | (Admin / Organizer) |                     | (Attendee / Guest)  |
             +----------+----------+                     +----------+----------+
                        |                                           |
                        +---------------------+---------------------+
                                              | HTTPS / JSON (REST API / WebSockets)
                                              v
                                  +-----------+-----------+
                                  |    API Gateway /      |
                                  |  Express Middleware   |
                                  +-----------+-----------+
                                              |
             +--------------------------------+--------------------------------+
             |                                |                                |
  +----------v----------+          +----------v----------+          +----------v----------+
  | Auth & RBAC Module  |          | Event Engine Module |          | Ticket/Pass Engine  |
  | (JWT Validation)    |          | (CRUD / Agendas)    |          | (QR Generator)      |
  +----------+----------+          +----------+----------+          +----------+----------+
             |                                |                                |
             +--------------------------------+--------------------------------+
                                              |
                                  +-----------v-----------+
                                  | Database & Storage    |
                                  | - PostgreSQL/MongoDB  |
                                  | - Cloudinary/S3 Storage|
                                  +-----------------------+
```

---

## 3. Database Schema Design (Relational / Entity-Relationship Model)

### 3.1 `Users` Table
| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / INT | PRIMARY KEY | Unique User ID |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User Email Address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt Hashed Password |
| `full_name` | VARCHAR(100) | NOT NULL | User's Full Name |
| `role` | ENUM | NOT NULL | `'HEAD_USER'` or `'VIEWER'` |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration Date |

### 3.2 `Events` Table
| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / INT | PRIMARY KEY | Unique Event ID |
| `organizer_id` | UUID / INT | FOREIGN KEY (`Users.id`) | Head User who created the event |
| `title` | VARCHAR(200) | NOT NULL | Event Title |
| `description` | TEXT | NOT NULL | Detailed event summary |
| `banner_url` | VARCHAR(500) | NULLABLE | Cover image URL |
| `date_time` | TIMESTAMP | NOT NULL | Start Date & Time |
| `location` | VARCHAR(255) | NOT NULL | Venue or Virtual Link |
| `capacity` | INT | NOT NULL | Max allowed attendees |
| `status` | ENUM | DEFAULT `'UPCOMING'` | `'DRAFT'`, `'UPCOMING'`, `'ONGOING'`, `'COMPLETED'`, `'CANCELLED'` |

### 3.3 `Registrations` (Tickets) Table
| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / INT | PRIMARY KEY | Ticket / Registration ID |
| `event_id` | UUID / INT | FOREIGN KEY (`Events.id`) | Referenced Event |
| `user_id` | UUID / INT | FOREIGN KEY (`Users.id`) | Registered Viewer User |
| `qr_code_hash` | VARCHAR(255) | UNIQUE, NOT NULL | Cryptographic token encoded in QR code |
| `status` | ENUM | DEFAULT `'CONFIRMED'` | `'CONFIRMED'`, `'CHECKED_IN'`, `'CANCELLED'` |
| `registered_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp of registration |

---

## 4. API Endpoints Specification

### 4.1 Authentication & User Routes (`/api/v1/auth`)
- `POST /register`: Register a new user (default role: `VIEWER`).
- `POST /login`: Authenticate and return JWT token containing `userId` and `role`.
- `GET /me`: Fetch authenticated user profile.

### 4.2 Event Management Routes (`/api/v1/events`)

#### Public / Viewer User Endpoints
- `GET /api/v1/events`: List all public events (Supports search, pagination, status filtering).
- `GET /api/v1/events/:id`: Get detailed event page.
- `POST /api/v1/events/:id/register`: Register authenticated Viewer user for an event (Generates QR ticket).
- `GET /api/v1/tickets/my-tickets`: Fetch current Viewer's registered events and QR passes.

#### Head User (Admin) Restricted Endpoints `[Requires Role: HEAD_USER]`
- `POST /api/v1/events`: Create a new event.
- `PUT /api/v1/events/:id`: Update event details.
- `DELETE /api/v1/events/:id`: Delete or cancel an event.
- `GET /api/v1/events/:id/attendees`: View guest list and registration details.
- `POST /api/v1/events/:id/checkin`: Scan/Validate attendee QR code hash for on-site entry.
- `GET /api/v1/events/:id/analytics`: Fetch metrics (capacity %, check-in rates, registration trend).

---

## 5. Security & Access Control Architecture

1. **JSON Web Token (JWT) Authentication**:
   - Headers: `Authorization: Bearer <token>`
   - Payload includes: `{ "sub": "user_id", "role": "HEAD_USER" | "VIEWER", "exp": 1757000000 }`
2. **Role-Based Access Control Middleware**:
   ```javascript
   // Authorization Middleware Snippet
   function authorize(allowedRoles = []) {
     return (req, res, next) => {
       if (!req.user || !allowedRoles.includes(req.user.role)) {
         return res.status(403).json({ error: 'Access Denied: Insufficient Permissions' });
       }
       next();
     };
   }
   ```
3. **Data Integrity Rules**:
   - Prevent registration if `registeredCount >= capacity`.
   - Prevent Viewer users from updating or deleting event entities.

---

## 6. Sequence Flow Diagrams

### Viewer Registration Flow
```
[Viewer User] ---> (POST /events/:id/register) ---> [API Gateway]
                                                           |
                                                (Validate JWT Token)
                                                           |
                                          (Check Capacity & Existing Reg)
                                                           |
                                           (Generate Unique QR Pass)
                                                           |
                                           (Save to Registrations DB)
                                                           |
[Viewer User] <--- (Returns Ticket JSON + QR Data) <-------+
```

### Head User Check-in Scan Flow
```
[Head User] ---> (Scans Attendee QR Code) ---> (POST /events/:id/checkin)
                                                          |
                                               (Verify HEAD_USER Token)
                                                          |
                                             (Query Ticket via Hash)
                                                          |
                                          (Mark Status = 'CHECKED_IN')
                                                          |
[Head User] <--- (Returns "Check-in Successful") <-------+
```
