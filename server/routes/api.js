const router = express.Router();
const controller = require('../controllers/notificationController');
const { authenticateUser } = require('../middleware/auth');

// Config (Secured)
router.get('/config', authenticateUser, controller.getConfiguration);
router.post('/config', authenticateUser, controller.updateConfiguration);

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

// AI (Secure Proxy)
const aiController = require('../controllers/aiController');
router.post('/ia/chat', aiController.generateResponse);

module.exports = router;
