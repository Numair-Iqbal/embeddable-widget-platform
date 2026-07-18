const express = require('express');
const router = express.Router();
const submissionsService = require('../services/submissions.service');
const verifyToken = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute ka window
  max: 5, // is window mein max 5 requests per IP
  message: { message: 'Too many submissions from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Public endpoint — visitor submits the widget form
router.post('/:widgetId/submissions', submissionLimiter, async (req, res) => {
  try {
    const widgetId = req.params.widgetId;
    const ipAddress = req.ip;

    const submission = await submissionsService.createSubmission(widgetId, req.body, ipAddress);

    res.status(201).json({
      message: 'Submission received',
      submission: {
        id: submission.id,
        widgetId: submission.widget_id,
        createdAt: submission.created_at
      }
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message || 'Something went wrong' });
  }
});
router.get('/:widgetId/submissions', verifyToken, async (req, res) => {
  try {
    const widgetId = req.params.widgetId;
    const submissions = await submissionsService.getSubmissionsForWidget(widgetId, req.owner.id);
    res.status(200).json({ submissions });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message || 'Something went wrong' });
  }
});
// Protected endpoint — owner ke saare widgets ka combined stats
router.get('/owners/me/stats', verifyToken, async (req, res) => {
  try {
    const stats = await submissionsService.getOwnerStats(req.owner.id);
    res.status(200).json({ stats });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message || 'Something went wrong' });
  }
});
// PATCH /widgets/:widgetId/submissions/:id - edit a submission's data
router.patch('/:widgetId/submissions/:id', verifyToken, async (req, res) => {
  try {
    const submission = await submissionsService.updateSubmission(req.params.id, req.owner.id, req.body);
    res.status(200).json({ message: 'Submission updated', submission });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message || 'Something went wrong' });
  }
});

// DELETE /widgets/:widgetId/submissions/:id - delete a submission
router.delete('/:widgetId/submissions/:id', verifyToken, async (req, res) => {
  try {
    await submissionsService.deleteSubmission(req.params.id, req.owner.id);
    res.status(200).json({ message: 'Submission deleted' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message || 'Something went wrong' });
  }
});
module.exports = router;


