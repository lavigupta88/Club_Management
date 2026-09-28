const { Router } = require('express');
const { body }   = require('express-validator');
const validate   = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('../../controllers/adminController');

const router = Router();

// All admin routes require organizer or admin role
router.use(authenticate, authorize('organizer', 'admin'));

router.get('/dashboard', ctrl.dashboard);

router.get('/events/:id/registrations', ctrl.getRegistrations);

router.post('/attendance',
  [body('registration_id').isInt({ min: 1 }).withMessage('Registration ID is required')],
  validate,
  ctrl.markAttendance
);

router.get('/events/:id/export/csv', ctrl.exportCsv);

router.get('/events/:id/attendance-summary', ctrl.attendanceSummary);

module.exports = router;
