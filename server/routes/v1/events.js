const { Router } = require('express');
const { body }   = require('express-validator');
const validate   = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('../../controllers/eventController');
const regCtrl = require('../../controllers/registrationController');

const router = Router();

// Public
router.get('/',           ctrl.list);
router.get('/categories', ctrl.listCategories);
router.get('/:id',        ctrl.getById);

// Auth required — registration
router.post('/:id/register',   authenticate, regCtrl.register);
router.delete('/:id/register', authenticate, regCtrl.cancel);
router.get('/:id/registration-status', authenticate, regCtrl.registrationStatus);

// Organizer / Admin — event CRUD
const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category_id').isInt({ min: 1 }).withMessage('Category is required'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('event_date').isDate().withMessage('Valid date is required'),
  body('start_time').matches(/^\d{2}:\d{2}/).withMessage('Start time is required'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
];

router.post('/',
  authenticate, authorize('organizer', 'admin'),
  eventValidation, validate,
  ctrl.create
);

router.put('/:id',
  authenticate, authorize('organizer', 'admin'),
  eventValidation, validate,
  ctrl.update
);

router.delete('/:id',
  authenticate, authorize('admin'),
  ctrl.remove
);

module.exports = router;
