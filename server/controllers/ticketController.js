const crypto = require('crypto');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { db, saveDb } = require('../config/db');

// VIEWER Only: Register for an Event (Generates Ticket & Dynamic QR Code)
const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const event = db.events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ error: 'Event is fully booked' });
    }

    const existingTicket = db.tickets.find(
      t => t.eventId === eventId && t.userId === req.user.id && t.status !== 'CANCELLED'
    );
    if (existingTicket) {
      return res.status(400).json({ error: 'You are already registered for this event', ticket: existingTicket });
    }

    // Generate SHA256 QR Hash Token
    const rawString = `${req.user.id}-${eventId}-${Date.now()}-${uuidv4()}`;
    const qrCodeHash = crypto.createHash('sha256').update(rawString).digest('hex');

    // Generate Base64 QR Code Image Data URL
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
      ticketId: `tkt-${uuidv4().substring(0, 8)}`,
      eventId,
      userId: req.user.id,
      hash: qrCodeHash
    }));

    const newTicket = {
      id: `tkt-${uuidv4().substring(0, 8)}`,
      eventId,
      eventTitle: event.title,
      eventDate: event.dateTime,
      eventLocation: event.location,
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.fullName,
      qrCodeHash,
      qrDataUrl,
      status: 'CONFIRMED',
      registeredAt: new Date().toISOString()
    };

    db.tickets.push(newTicket);
    event.registeredCount += 1;
    saveDb();

    res.status(201).json({
      message: 'Registration successful',
      ticket: newTicket
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

// VIEWER Only: Fetch authenticated viewer's registered tickets
const getMyTickets = (req, res) => {
  try {
    const userTickets = db.tickets.filter(t => t.userId === req.user.id);
    res.json(userTickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets', details: error.message });
  }
};

// HEAD_USER Only: Fetch guest list for an event
const getEventAttendees = (req, res) => {
  try {
    const { eventId } = req.params;
    const attendees = db.tickets.filter(t => t.eventId === eventId);
    res.json(attendees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendees', details: error.message });
  }
};

// HEAD_USER Only: Scan QR Hash & Check-in Attendee
const checkInAttendee = (req, res) => {
  try {
    const { eventId } = req.params;
    const { qrCodeHash } = req.body;

    if (!qrCodeHash) {
      return res.status(400).json({ error: 'qrCodeHash is required for check-in' });
    }

    const ticket = db.tickets.find(t => t.qrCodeHash === qrCodeHash && t.eventId === eventId);

    if (!ticket) {
      return res.status(404).json({ error: 'Invalid Ticket QR Code for this event' });
    }

    if (ticket.status === 'CHECKED_IN') {
      return res.status(400).json({
        error: 'Ticket has ALREADY been checked-in',
        checkedInAt: ticket.checkedInAt,
        ticket
      });
    }

    ticket.status = 'CHECKED_IN';
    ticket.checkedInAt = new Date().toISOString();
    saveDb();

    res.json({
      message: 'Attendee checked-in successfully!',
      verifiedAttendee: {
        name: ticket.userName,
        email: ticket.userEmail,
        ticketId: ticket.id,
        checkedInAt: ticket.checkedInAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Check-in failed', details: error.message });
  }
};

module.exports = {
  registerForEvent,
  getMyTickets,
  getEventAttendees,
  checkInAttendee
};
