const { v4: uuidv4 } = require('uuid');
const { db, saveDb } = require('../config/db');

// Public / Viewer & Head User: List events with search & status filters
const getEvents = (req, res) => {
  try {
    let { search, status } = req.query;
    let events = [...db.events];

    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    }

    if (status) {
      events = events.filter(e => e.status.toUpperCase() === status.toUpperCase());
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
};

// Public / Viewer & Head User: Get event by ID
const getEventById = (req, res) => {
  const event = db.events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
};

// HEAD_USER Only: Create Event
const createEvent = (req, res) => {
  try {
    const { title, description, location, dateTime, capacity, bannerUrl } = req.body;

    if (!title || !description || !location || !dateTime || !capacity) {
      return res.status(400).json({ error: 'Title, description, location, dateTime, and capacity are required' });
    }

    const newEvent = {
      id: `evt-${uuidv4().substring(0, 8)}`,
      organizerId: req.user.id,
      createdByEmail: req.user.email,
      title,
      description,
      location,
      dateTime,
      capacity: parseInt(capacity, 10),
      registeredCount: 0,
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
      status: 'UPCOMING',
      createdAt: new Date().toISOString()
    };

    db.events.push(newEvent);
    saveDb();

    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
};

// HEAD_USER Only: Update Event
const updateEvent = (req, res) => {
  try {
    const eventIndex = db.events.findIndex(e => e.id === req.params.id);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const existingEvent = db.events[eventIndex];
    if (existingEvent.organizerId !== req.user.id && req.user.role !== 'HEAD_USER') {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own events' });
    }

    const { title, description, location, dateTime, capacity, status, bannerUrl } = req.body;

    const updatedEvent = {
      ...existingEvent,
      title: title || existingEvent.title,
      description: description || existingEvent.description,
      location: location || existingEvent.location,
      dateTime: dateTime || existingEvent.dateTime,
      capacity: capacity !== undefined ? parseInt(capacity, 10) : existingEvent.capacity,
      status: status || existingEvent.status,
      bannerUrl: bannerUrl || existingEvent.bannerUrl,
      updatedAt: new Date().toISOString()
    };

    db.events[eventIndex] = updatedEvent;
    saveDb();

    res.json({ message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
};

// HEAD_USER Only: Delete Event
const deleteEvent = (req, res) => {
  try {
    const eventIndex = db.events.findIndex(e => e.id === req.params.id);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    db.events.splice(eventIndex, 1);
    saveDb();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
