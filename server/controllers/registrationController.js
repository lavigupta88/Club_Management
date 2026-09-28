const pool = require('../config/db');

/* POST /api/v1/events/:id/register */
async function register(req, res, next) {
  try {
    const eventId = parseInt(req.params.id, 10);
    const userId  = req.user.id;

    // Check event exists and is published
    const [events] = await pool.query(
      `SELECT e.id, e.event_date, e.capacity,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registration_count
       FROM events e WHERE e.id = ? AND e.status = 'published'`,
      [eventId]
    );
    if (!events.length) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const event = events[0];

    // Block registration for past events
    if (new Date(event.event_date) < new Date(new Date().toDateString())) {
      return res.status(400).json({ success: false, message: 'Cannot register for a past event' });
    }

    // Check capacity
    if (event.registration_count >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is at full capacity' });
    }

    // Check for existing registration
    const [existing] = await pool.query(
      'SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );

    if (existing.length) {
      if (existing[0].status === 'registered') {
        return res.status(409).json({ success: false, message: 'Already registered for this event' });
      }
      // Re-activate a cancelled registration
      await pool.query(
        "UPDATE registrations SET status = 'registered', updated_at = NOW() WHERE id = ?",
        [existing[0].id]
      );
      return res.json({ success: true, message: 'Registration restored' });
    }

    await pool.query(
      'INSERT INTO registrations (user_id, event_id, status) VALUES (?, ?, ?)',
      [userId, eventId, 'registered']
    );

    res.status(201).json({ success: true, message: 'Registered successfully' });
  } catch (err) {
    next(err);
  }
}

/* DELETE /api/v1/events/:id/register */
async function cancel(req, res, next) {
  try {
    const eventId = parseInt(req.params.id, 10);
    const userId  = req.user.id;

    const [rows] = await pool.query(
      "SELECT id FROM registrations WHERE user_id = ? AND event_id = ? AND status = 'registered'",
      [userId, eventId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    await pool.query(
      "UPDATE registrations SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
      [rows[0].id]
    );

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (err) {
    next(err);
  }
}

/* GET /api/v1/registrations/me */
async function myRegistrations(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT r.id AS registration_id, r.status AS registration_status, r.registered_at,
              e.id AS event_id, e.title, e.venue, e.event_date, e.start_time, e.end_time,
              e.banner_url, e.is_outdoor, c.name AS category_name,
              (SELECT COUNT(*) FROM attendance a WHERE a.registration_id = r.id) AS attended
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       JOIN categories c ON e.category_id = c.id
       WHERE r.user_id = ?
       ORDER BY e.event_date DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/* GET /api/v1/events/:id/registration-status */
async function registrationStatus(req, res, next) {
  try {
    if (!req.user) {
      return res.json({ success: true, data: { registered: false } });
    }
    const [rows] = await pool.query(
      "SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ? AND status = 'registered'",
      [req.user.id, req.params.id]
    );
    res.json({ success: true, data: { registered: rows.length > 0 } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, cancel, myRegistrations, registrationStatus };
