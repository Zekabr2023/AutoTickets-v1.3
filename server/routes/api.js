const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');

// Config
router.get('/config', controller.getConfiguration);
router.post('/config', controller.updateConfiguration);

// Discord
router.post('/notify/discord', controller.notifyDiscord);

// WhatsApp
router.get('/whatsapp/templates', controller.listTemplates);
router.post('/whatsapp/templates', controller.createTemplate);
router.post('/whatsapp/send', controller.sendWhatsApp);
router.post('/whatsapp/test', controller.testWhatsApp);

// Email
router.post('/email/verify', controller.verifyEmailConfig);

// Unified Trigger
router.post('/notify/status-change', controller.notifyStatusChange);

// Tacit Acceptance (auto-resolve expired tickets)
router.post('/tickets/process-tacit-acceptance', controller.processTacitAcceptance);

module.exports = router;
