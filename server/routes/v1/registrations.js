const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const ctrl = require('../../controllers/registrationController');
const adminCtrl = require('../../controllers/adminController');

const router = Router();

// My registrations
router.get('/me', authenticate, ctrl.myRegistrations);

// Ticket download (proxied from PHP)
router.get('/:registrationId/ticket', authenticate, adminCtrl.getTicket);

module.exports = router;
