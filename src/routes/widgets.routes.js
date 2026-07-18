const express = require('express');
const router = express.Router();
const widgetsService = require('../services/widgets.service');
const verifyToken = require('../middleware/auth.middleware');
const submissionsService = require('../services/submissions.service');

// All widget routes require authentication
router.use(verifyToken);

// POST /widgets - create a new widget
router.post('/', async (req, res) => {
  try {
    const widget = await widgetsService.createWidget(req.owner.id, req.body);
    res.status(201).json({ message: 'Widget created', widget });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// GET /widgets - list all widgets for the logged-in owner
router.get('/', async (req, res) => {
  try {
    const widgets = await widgetsService.listWidgets(req.owner.id);
    res.status(200).json({ widgets });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// GET /widgets/me/stats - owner ke saare widgets ka combined stats
// ZAROORI: ye /:id route se PEHLE hona chahiye, warna "me" ko ID samajh liya jayega
router.get('/me/stats', async (req, res) => {
  try {
    const stats = await submissionsService.getOwnerStats(req.owner.id);
    res.status(200).json({ stats });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// GET /widgets/:id - get one widget (only if it belongs to this owner)
router.get('/:id', async (req, res) => {
  try {
    const widget = await widgetsService.getWidget(req.params.id, req.owner.id);
    res.status(200).json({ widget });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// PUT /widgets/:id - update a widget
router.put('/:id', async (req, res) => {
  try {
    const widget = await widgetsService.updateWidget(req.params.id, req.owner.id, req.body);
    res.status(200).json({ message: 'Widget updated', widget });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// DELETE /widgets/:id - delete a widget
router.delete('/:id', async (req, res) => {
  try {
    await widgetsService.deleteWidget(req.params.id, req.owner.id);
    res.status(200).json({ message: 'Widget deleted' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = router;