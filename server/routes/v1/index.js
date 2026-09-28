const { Router } = require('express');

const authRoutes         = require('./auth');
const eventRoutes        = require('./events');
const registrationRoutes = require('./registrations');
const adminRoutes        = require('./admin');

const router = Router();

router.use('/auth',          authRoutes);
router.use('/events',        eventRoutes);
router.use('/registrations', registrationRoutes);
router.use('/admin',         adminRoutes);

module.exports = router;
