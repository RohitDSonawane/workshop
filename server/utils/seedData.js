const bcrypt = require('bcryptjs');
const { db, saveDb } = require('../config/db');

const seedData = async () => {
  if (db.users.length > 0) {
    console.log('Database already populated, skipping seed.');
    return;
  }

  console.log('Seeding initial EMS data (Head User, Viewer User, Sample Event)...');

  // 1. Seed Head User (Admin)
  const headPasswordHash = await bcrypt.hash('Admin@123', 10);
  const headUser = {
    id: 'user-head-001',
    email: 'head.organizer@ems.com',
    fullName: 'Sarah Jenkins (Head Organizer)',
    passwordHash: headPasswordHash,
    role: 'HEAD_USER',
    createdAt: new Date().toISOString()
  };

  // 2. Seed Viewer User (Attendee)
  const viewerPasswordHash = await bcrypt.hash('User@123', 10);
  const viewerUser = {
    id: 'user-viewer-001',
    email: 'viewer.attendee@ems.com',
    fullName: 'Alex Morgan (Viewer)',
    passwordHash: viewerPasswordHash,
    role: 'VIEWER',
    createdAt: new Date().toISOString()
  };

  // 3. Seed Sample Events
  const sampleEvent1 = {
    id: 'evt-1001',
    organizerId: headUser.id,
    createdByEmail: headUser.email,
    title: 'Tech Innovation Summit 2026',
    description: 'Annual conference highlighting AI, web development, cloud computing trends, and modern software design patterns.',
    location: 'Convention Center, Hall A (San Francisco, CA)',
    dateTime: '2026-10-15T09:00:00Z',
    capacity: 500,
    registeredCount: 0,
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
    status: 'UPCOMING',
    createdAt: new Date().toISOString()
  };

  const sampleEvent2 = {
    id: 'evt-1002',
    organizerId: headUser.id,
    createdByEmail: headUser.email,
    title: 'Global Developer Workshop & Hackathon',
    description: 'Hands-on coding workshop on building scalable web APIs and real-time collaborative frontend applications.',
    location: 'Tech Hub Center, Auditorium B',
    dateTime: '2026-11-20T10:00:00Z',
    capacity: 150,
    registeredCount: 0,
    bannerUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop',
    status: 'UPCOMING',
    createdAt: new Date().toISOString()
  };

  db.users.push(headUser, viewerUser);
  db.events.push(sampleEvent1, sampleEvent2);
  saveDb();

  console.log('Seeding completed successfully!');
};

module.exports = { seedData };
