const express = require('express');
const router = express.Router();
const widgetsService = require('../services/widgets.service');

// GET /widgets/:id/config
// PUBLIC endpoint - no authentication required.
// This is fetched by the embed script from any external website.
router.get('/:id/config', async (req, res) => {
  try {
    const config = await widgetsService.getPublicConfig(req.params.id);

    // Allow this endpoint to be fetched from any origin (embed scripts run on
    // customer websites we don't control), and cache it briefly for speed.
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=60');

    res.status(200).json(config);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = router;