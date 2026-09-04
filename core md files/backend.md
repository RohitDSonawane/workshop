# Event Management System (EMS) - Backend Specification

## 1. Overview
This document specifies the backend architectural patterns, service directory structure, API controller logic, middleware implementations, data validation schemas, and database seed scripts for the **Event Management System (EMS)** based on [idea.md](file:///c:/Users/acer/Desktop/workshop/idea.md) and [architecture.md](file:///c:/Users/acer/Desktop/workshop/architecture.md).

The backend is structured as a modular Node.js / Express or Python (FastAPI/Django) application adhering to RESTful standards and Role-Based Access Control (RBAC).

---

## 2. Directory & Module Structure

```
server/
├── config/
│   ├── db.js                # Database connection setup (PostgreSQL / MongoDB)
│   └── jwt.js               # JWT secret and sign/verify config
│
├── controllers/
│   ├── authController.js    # Login, registration, profile handlers
│   ├── eventController.js   # Event CRUD operations & query filtering
│   ├── ticketController.js  # Registration, QR token generation & check-in
│   └── analyticsController.js # Head User statistics & aggregate queries
│
├── middleware/
│   ├── authMiddleware.js    # Token extraction & verification
│   ├── rbacMiddleware.js    # Role checker (e.g. requireRole('HEAD_USER'))
│   └── errorHandler.js      # Global error handling middleware
│
├── models/
│   ├── User.js              # User schema & password hashing hooks
│   ├── Event.js             # Event schema with status & capacity counters
│   └── Ticket.js            # Registration schema with unique QR hash
│
├── routes/
│   ├── authRoutes.js        # /api/v1/auth
│   ├── eventRoutes.js       # /api/v1/events
│   ├── ticketRoutes.js      # /api/v1/tickets
│   └── analyticsRoutes.js   # /api/v1/analytics
│
├── utils/
│   ├── qrGenerator.js       # Generates QR codes/hashes for tickets
│   └── seedData.js          # Pre-populates Head User, Viewer, & default events
│
└── server.js                # Express app entry point
```

---

## 3. Core Controllers & Logic

### 3.1 Authentication Controller (`authController.js`)
- **Register**: Validates request body -> Hashes password with bcrypt (`saltRounds = 10`) -> Creates User (`role` defaults to `VIEWER`).
- **Login**: Verifies credentials -> Signs JWT containing `{ id: user._id, email: user.email, role: user.role }` -> Returns token and user payload.

### 3.2 Event Controller (`eventController.js`)
- **`createEvent` (HEAD_USER Only)**: Parses event details, validates start/end dates, sets capacity, and sets `createdBy` to `req.user.id`.
- **`getEvents` (Public)**: Supports query params (`?search=tech&status=UPCOMING&page=1&limit=10`).
- **`updateEvent` / `deleteEvent` (HEAD_USER Only)**: Verifies the requesting user is a `HEAD_USER` and owns the event before performing operations.

### 3.3 Ticket & Check-in Controller (`ticketController.js`)
- **`registerForEvent` (VIEWER Only)**:
  1. Checks if `Event.registeredCount < Event.capacity`.
  2. Ensures no existing registration for `(userId, eventId)`.
  3. Generates a cryptographically secure ticket hash:
     ```js
     const qrHash = crypto.createHash('sha256')
       .update(`${userId}-${eventId}-${Date.now()}-${SECRET}`)
       .digest('hex');
     ```
  4. Atomically increments `registeredCount` on the Event model.
  5. Returns Ticket details + Data URL of the generated QR Code.
- **`checkInAttendee` (HEAD_USER Only)**:
  1. Validates `qrHash` against `Tickets` table.
  2. Verifies `ticket.eventId === req.params.eventId`.
  3. Checks if `ticket.status === 'CHECKED_IN'` to prevent double entry.
  4. Updates status to `'CHECKED_IN'` with check-in timestamp.

---

## 4. Middleware Implementation Logic

### 4.1 Authentication Middleware (`authMiddleware.js`)
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authentication token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};
```

### 4.2 Role-Based Access Control Middleware (`rbacMiddleware.js`)
```javascript
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Requires one of the following roles: [${allowedRoles.join(', ')}]` 
      });
    }
    next();
  };
};

module.exports = { requireRole };
```

---

## 5. Pre-configured Database Seed Script (`utils/seedData.js`)

When initialized, the system automatically seeds default users and events if the database is empty:

```javascript
const seedDatabase = async () => {
  // 1. Seed Head User
  const headUser = {
    email: 'head.organizer@ems.com',
    passwordHash: await bcrypt.hash('Admin@123', 10),
    fullName: 'Sarah Jenkins (Head Organizer)',
    role: 'HEAD_USER'
  };

  // 2. Seed Viewer User
  const viewerUser = {
    email: 'viewer.attendee@ems.com',
    passwordHash: await bcrypt.hash('User@123', 10),
    fullName: 'Alex Morgan (Attendee)',
    role: 'VIEWER'
  };

  // 3. Seed Initial Event
  const sampleEvent = {
    title: 'Tech Innovation Summit 2026',
    description: 'Annual conference highlighting AI, web development, and cloud computing trends.',
    dateTime: new Date('2026-10-15T09:00:00Z'),
    location: 'Convention Center, Hall A',
    capacity: 500,
    registeredCount: 1,
    status: 'UPCOMING'
  };
};
```

---

## 6. Environmental Variables (`.env.example`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:password@localhost:5432/ems_db
JWT_SECRET=super_secret_jwt_key_ems_2026
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```
