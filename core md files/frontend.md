# Event Management System (EMS) - Frontend Specification

## 1. Overview & UI/UX Vision
This document outlines the frontend structure, user experience design system, component hierarchy, page routes, and state management strategy for the **Event Management System (EMS)** based on [idea.md](file:///c:/Users/acer/Desktop/workshop/idea.md) and [architecture.md](file:///c:/Users/acer/Desktop/workshop/architecture.md).

The interface is built with modern web aesthetics—featuring dark mode default, glassmorphism card containers, responsive layouts, subtle micro-animations, and dynamic role-swapping capabilities.

---

## 2. Design System & Aesthetics Guidelines

### 🎨 Color Palette (Curated Dark / Glass Theme)
- **Background Main**: `#0F172A` (Deep Slate / Dark Mode)
- **Card Surface**: `rgba(30, 41, 59, 0.7)` with `backdrop-filter: blur(12px)`
- **Primary Accent**: `#6366F1` (Indigo Vivid)
- **Secondary Accent**: `#8B5CF6` (Purple Glow)
- **Success / Check-in**: `#10B981` (Emerald Green)
- **Warning / Alert**: `#F59E0B` (Amber)
- **Text Main**: `#F8FAFC` (Pure Off-White)
- **Text Muted**: `#94A3B8` (Cool Grey)

### 🔤 Typography & Effects
- **Font Family**: Modern Sans-Serif (`Inter`, `Outfit`, sans-serif)
- **Borders**: Thin translucent borders `1px solid rgba(255, 255, 255, 0.1)`
- **Shadows**: Soft neon glow `0 8px 32px 0 rgba(99, 102, 241, 0.15)`

---

## 3. Page Routes & Sitemap

| Route | Access Level | Page Name & Description |
| :--- | :--- | :--- |
| `/` | Public | **Home / Event Discovery**: Hero section, featured events, search & category filters. |
| `/login` | Public | **Authentication Page**: Login form with quick preset buttons for test users (`Head User` / `Viewer`). |
| `/events/:id` | Public | **Event Details Page**: Rich description, schedule agenda, speaker info, and RSVP button. |
| `/dashboard/viewer` | `VIEWER` | **Viewer Dashboard**: Registered tickets, QR pass wallet, and saved event bookmarks. |
| `/dashboard/head` | `HEAD_USER` | **Head User Admin Hub**: Overview of created events, total registrations, and quick action bar. |
| `/events/create` | `HEAD_USER` | **Event Creation Wizard**: Multi-step form (Details, Schedule, Banner Upload, Ticket Specs). |
| `/events/:id/manage` | `HEAD_USER` | **Event Management & Check-in**: Guest list table, attendee approval, and live QR Code Scanner. |

---

## 4. UI Component Architecture

```
src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx           # Dynamic navigation bar with role indicator
│   │   ├── Footer.jsx           # Global footer
│   │   ├── Button.jsx           # Styled glassmorphism buttons
│   │   ├── Modal.jsx            # Dynamic popup dialogs (QR modal, confirm dialog)
│   │   └── ProtectedRoute.jsx   # Role guard wrapper
│   │
│   ├── viewer/
│   │   ├── EventCard.jsx        # Glassmorphic event display card
│   │   ├── EventFilter.jsx      # Search input + tag pills filter
│   │   ├── TicketPassModal.jsx  # Renders dynamic QR Code ticket pass
│   │   └── AgendaTimeline.jsx   # Visual timeline for event schedule
│   │
│   └── head/
│       ├── StatWidget.jsx       # Analytics numbers (Registrations, Revenue, Check-ins)
│       ├── EventFormWizard.jsx  # Multi-step creation form
│       ├── GuestListTable.jsx   # Table with search, approval, and export CSV
│       └── QRScannerModal.jsx   # Camera-based or hash input QR validator
```

---

## 5. Screen Layout Wireframes & Design Descriptions

### 5.1 Viewer View: Event Card & Ticket Wallet
- **Event Card**: Floating glass card featuring event banner, live category badge (`AI`, `Dev`, `Music`), date pill, location icon, capacity bar, and `Register Now` button.
- **Ticket Wallet**: Interactive digital pass displaying a scannable **QR code**, Event Title, Seat/Ticket ID, Date, and a one-click `Download PDF / Add to Apple Wallet` action.

### 5.2 Head User View: Admin Dashboard & Live Scanner
- **Top Stats Bar**: 4 key indicator widgets showing *Total Events*, *Total Attendees*, *Active Check-in Rate (%)*, and *System Status*.
- **Creation Wizard**: Progress stepper (1. General Info -> 2. Location & Date -> 3. Tickets & Capacity -> 4. Review & Publish).
- **QR Check-in Portal**: Real-time camera viewfinder or string reader that scans attendee tickets, pops a green checkmark (`Verified: John Doe`), and updates check-in statistics dynamically.

---

## 6. Frontend State Management & API Integration

- **Auth State**: Stores current user object (`name`, `email`, `role`, `token`) in localStorage / React Context / Zustand.
- **Event State**: Central store managing fetched events list, current active event detail, and search filter parameters.
- **Mock Demo Fallback**: Local mock dataset allowing instant demo switching between `Head User` and `Viewer` personas without requiring an active database connection.
