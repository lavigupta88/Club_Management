const pool       = require('../config/db');
const phpService = require('../services/phpService');

/* GET /api/v1/admin/dashboard */
async function dashboard(req, res, next) {
  try {
    const [[{ totalEvents }]] = await pool.query(
      "SELECT COUNT(*) AS totalEvents FROM events WHERE status = 'published'"
    );
    const [[{ totalRegistrations }]] = await pool.query(
      "SELECT COUNT(*) AS totalRegistrations FROM registrations WHERE status = 'registered'"
    );
    const [[{ upcomingEvents }]] = await pool.query(
      "SELECT COUNT(*) AS upcomingEvents FROM events WHERE status = 'published' AND event_date >= CURDATE()"
    );
    const [[{ totalUsers }]] = await pool.query(
      'SELECT COUNT(*) AS totalUsers FROM users'
    );

    // Fill rate: average (registrations / capacity) across published events
    const [[{ avgFillRate }]] = await pool.query(
      `SELECT IFNULL(AVG(sub.fill), 0) AS avgFillRate FROM (
         SELECT (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') / e.capacity AS fill
         FROM events e WHERE e.status = 'published'
       ) sub`
    );

    // Registrations per category (for chart)
    const [categoryData] = await pool.query(
      `SELECT c.name AS category, COUNT(r.id) AS registrations
       FROM categories c
       LEFT JOIN events e ON e.category_id = c.id AND e.status = 'published'
       LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
       GROUP BY c.id, c.name
       ORDER BY registrations DESC`
    );

    res.json({
      success: true,
      data: {
        totalEvents,
        totalRegistrations,
        upcomingEvents,
        totalUsers,
        fillRate: Math.round(avgFillRate * 100),
        categoryData,
      },
    });
  } catch (err) {
    next(err);
  }
}

/* GET /api/v1/admin/events/:id/registrations */
async function getRegistrations(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT r.id AS registration_id, r.status, r.registered_at,
              u.id AS user_id, u.name, u.email,
              (SELECT COUNT(*) FROM attendance a WHERE a.registration_id = r.id) AS attended
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = ?
       ORDER BY r.registered_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/* POST /api/v1/admin/attendance */
async function markAttendance(req, res, next) {
  try {
    const { registration_id } = req.body;

    // Check if already marked
    const [existing] = await pool.query(
      'SELECT id FROM attendance WHERE registration_id = ?',
      [registration_id]
    );
    if (existing.length) {
      // Toggle off
      await pool.query('DELETE FROM attendance WHERE registration_id = ?', [registration_id]);
      return res.json({ success: true, message: 'Attendance unmarked' });
    }

    await pool.query(
      'INSERT INTO attendance (registration_id, marked_by) VALUES (?, ?)',
      [registration_id, req.user.id]
    );

    res.status(201).json({ success: true, message: 'Attendance marked' });
  } catch (err) {
    next(err);
  }
}

/* GET /api/v1/admin/events/:id/export/csv — proxied from PHP */
async function exportCsv(req, res, next) {
  try {
    const response = await phpService.get(`/export/csv/${req.params.id}`);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=registrations_event_${req.params.id}.csv`);
    res.send(response);
  } catch (err) {
    next(err);
  }
}

/* GET /api/v1/registrations/:registrationId/ticket — proxied from PHP */
async function getTicket(req, res, next) {
  try {
    const html = await phpService.get(`/receipt/${req.params.registrationId}`);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    next(err);
  }
}

/* GET /api/v1/admin/events/:id/attendance-summary — proxied from PHP */
async function attendanceSummary(req, res, next) {
  try {
    const data = await phpService.getJson(`/attendance/summary/${req.params.id}`);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, getRegistrations, markAttendance, exportCsv, getTicket, attendanceSummary };
