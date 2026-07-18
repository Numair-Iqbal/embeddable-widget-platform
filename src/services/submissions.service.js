const submissionsRepository = require('../repositories/submissions.repository');
const widgetsRepository = require('../repositories/widgets.repository');
const { getGeoInfo } = require('./geo.service');
const { notifyOwnerOfSubmission } = require('./notification.service');

async function createSubmission(widgetId, body, ipAddress) {
  // 1. Confirm the widget actually exists
  const widget = await widgetsRepository.findById(widgetId);
  if (!widget) {
    const error = new Error('Widget not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Honeypot check — agar ye chupa hua field bhara hai, to bot hai
  if (body && body.website) {
    const error = new Error('Spam detected');
    error.statusCode = 400;
    throw error;
  }

  // 3. Basic validation — data must be a non-empty object
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const error = new Error('Invalid submission data');
    error.statusCode = 400;
    throw error;
  }

  if (Object.keys(body).length === 0) {
    const error = new Error('Submission data cannot be empty');
    error.statusCode = 400;
    throw error;
  }

  // 4. Reject oversized payloads (basic protection)
  const payloadSize = JSON.stringify(body).length;
  if (payloadSize > 5000) {
    const error = new Error('Submission data too large');
    error.statusCode = 400;
    throw error;
  }

  // 5. Geo lookup — visitor kahan se aaya, pata lagao
  const geoInfo = await getGeoInfo(ipAddress);

  // 6. Save it
  const submission = await submissionsRepository.createSubmission({
    widgetId,
    data: body,
    ipAddress,
    geoCountry: geoInfo.country,
    geoCity: geoInfo.city,
    geoProviderUsed: geoInfo.provider,
    isSpam: false
  });

  // 7. Owner ko notify karo (safe — fail hone par bhi submission save rehta hai)
  await notifyOwnerOfSubmission(widget, submission);

  return submission;
}

async function getSubmissionsForWidget(widgetId, ownerId) {
  // Confirm widget exists AND belongs to this owner (security check).
  // Use findByIdAndOwner (not findById) so owners can still see submissions
  // for their own widgets even if the widget has been set inactive —
  // active-status should only gate the PUBLIC embed/config endpoint, not the owner's own dashboard.
  const widget = await widgetsRepository.findByIdAndOwner(widgetId, ownerId);
  if (!widget) {
    const error = new Error('Widget not found');
    error.statusCode = 404;
    throw error;
  }

  const submissions = await submissionsRepository.findByWidgetId(widgetId);
  return submissions;
}
async function getOwnerStats(ownerId) {
  const widgets = await widgetsRepository.findAllByOwner(ownerId);
  const submissionCounts = await submissionsRepository.countByOwnerId(ownerId);
  const activeWidgets = await widgetsRepository.countActiveByOwnerId(ownerId);

  return {
    totalWidgets: widgets.length,
    activeWidgets,
    totalSubmissions: submissionCounts.totalSubmissions,
    submissionsThisWeek: submissionCounts.submissionsThisWeek
  };
}
async function updateSubmission(submissionId, ownerId, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
    const error = new Error('Invalid submission data');
    error.statusCode = 400;
    throw error;
  }
  const updated = await submissionsRepository.updateSubmission(submissionId, ownerId, data);
  if (!updated) {
    const error = new Error('Submission not found or not authorized');
    error.statusCode = 404;
    throw error;
  }
  return updated;
}

async function deleteSubmission(submissionId, ownerId) {
  const deleted = await submissionsRepository.removeSubmission(submissionId, ownerId);
  if (!deleted) {
    const error = new Error('Submission not found or not authorized');
    error.statusCode = 404;
    throw error;
  }
  return deleted;
}
module.exports = { createSubmission, getSubmissionsForWidget, getOwnerStats, updateSubmission, deleteSubmission };