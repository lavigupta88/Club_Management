const pool = require('../config/db');

/* GET /api/v1/events — paginated list with search, filter, sort */
async function list(req, res, next) {
  try {
    const page     = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset   = (page - 1) * limit;
    const search   = req.query.search   || '';
    const category = req.query.category || '';
    const dateFrom = req.query.dateFrom || '';
    const dateTo   = req.query.dateTo   || '';
    const sortBy   = req.query.sortBy   || 'event_date';
    const order    = req.query.order === 'desc' ? 'DESC' : 'ASC';

    const allowedSorts = ['event_date', 'title', 'created_at', 'capacity'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'event_date';

    let where = "WHERE e.status = 'published'";
    const params = [];

    if (search) {
      where += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (category) {
      where += ' AND c.name = ?';
      params.push(category);
    }
    if (dateFrom) {
      where += ' AND e.event_date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      where += ' AND e.event_date <= ?';
      params.push(dateTo);
    }

    // Total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM events e JOIN categories c ON e.category_id = c.id ${where}`,
      params
    );
    const total = countRows[0].total;

    // Events with registration count
    const [rows] = await pool.query(
      `SELECT e.*, c.name AS category_name, u.name AS organizer_name,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registration_count
       FROM events e
       JOIN categories c ON e.category_id = c.id
       JOIN users u ON e.organizer_id = u.id
       ${where}
       ORDER BY e.${safeSort} ${order}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/* GET /api/v1/events/categories — list all categories */
async function listCategories(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/* GET /api/v1/events/:id */
async function getById(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, c.name AS category_name, u.name AS organizer_name, u.email AS organizer_email,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registration_count
       FROM events e
       JOIN categories c ON e.category_id = c.id
       JOIN users u ON e.organizer_id = u.id
       WHERE e.id = ?`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/* POST /api/v1/events */
async function create(req, res, next) {
  try {
    const { title, description, category_id, venue, event_date, start_time, end_time,
            banner_url, capacity, is_outdoor, latitude, longitude, status } = req.body;

    const [result] = await pool.query(
      `INSERT INTO events (title, description, category_id, organizer_id, venue, event_date,
        start_time, end_time, banner_url, capacity, is_outdoor, latitude, longitude, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, category_id, req.user.id, venue, event_date,
       start_time, end_time || null, banner_url || null, capacity || 100,
       is_outdoor ? 1 : 0, latitude || null, longitude || null, status || 'published']
    );

    const [created] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Event created', data: created[0] });
  } catch (err) {
    next(err);
  }
}

/* PUT /api/v1/events/:id */
async function update(req, res, next) {
  try {
    const eventId = req.params.id;

    // Only the organizer who created it or an admin can update
    const [existing] = await pool.query('SELECT organizer_id FROM events WHERE id = ?', [eventId]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (req.user.role !== 'admin' && existing[0].organizer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
    }

    const { title, description, category_id, venue, event_date, start_time, end_time,
            banner_url, capacity, is_outdoor, latitude, longitude, status } = req.body;

    await pool.query(
      `UPDATE events SET title=?, description=?, category_id=?, venue=?, event_date=?,
        start_time=?, end_time=?, banner_url=?, capacity=?, is_outdoor=?, latitude=?, longitude=?, status=?
       WHERE id=?`,
      [title, description, category_id, venue, event_date,
       start_time, end_time || null, banner_url || null, capacity || 100,
       is_outdoor ? 1 : 0, latitude || null, longitude || null, status || 'published', eventId]
    );

    const [updated] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    res.json({ success: true, message: 'Event updated', data: updated[0] });
  } catch (err) {
    next(err);
  }
}

/* DELETE /api/v1/events/:id */
async function remove(req, res, next) {
  try {
    const [existing] = await pool.query('SELECT id FROM events WHERE id = ?', [req.params.id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, listCategories, getById, create, update, remove };
