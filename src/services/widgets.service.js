const widgetsRepository = require('../repositories/widgets.repository');

const VALID_TYPES = ['popover', 'signup_form', 'cta'];

function validateWidgetInput({ type, title }) {
  if (!type || !VALID_TYPES.includes(type)) {
    const error = new Error(`Type must be one of: ${VALID_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  if (!title || title.trim().length === 0) {
    const error = new Error('Title is required');
    error.statusCode = 400;
    throw error;
  }
}

async function createWidget(ownerId, data) {
  validateWidgetInput(data);
  return widgetsRepository.create(ownerId, data);
}

async function listWidgets(ownerId) {
  return widgetsRepository.findAllByOwner(ownerId);
}

async function getWidget(id, ownerId) {
  const widget = await widgetsRepository.findByIdAndOwner(id, ownerId);
  if (!widget) {
    const error = new Error('Widget not found');
    error.statusCode = 404;
    throw error;
  }
  return widget;
}

async function updateWidget(id, ownerId, data) {
  validateWidgetInput(data);
  const updated = await widgetsRepository.update(id, ownerId, data);
  if (!updated) {
    const error = new Error('Widget not found');
    error.statusCode = 404;
    throw error;
  }
  return updated;
}

async function deleteWidget(id, ownerId) {
  const deleted = await widgetsRepository.remove(id, ownerId);
  if (!deleted) {
    const error = new Error('Widget not found');
    error.statusCode = 404;
    throw error;
  }
  return deleted;
}
async function getPublicConfig(id) {
  const widget = await widgetsRepository.findById(id);
  if (!widget) {
    const error = new Error('Widget not found');
    error.statusCode = 404;
    throw error;
  }

  // Only return fields that are safe to expose publicly.
  // Never expose owner_id or internal flags to the public internet.
  return {
    id: widget.id,
    type: widget.type,
    title: widget.title,
    copyText: widget.copy_text,
    fields: widget.fields,
    targeting: widget.targeting
  };
}
module.exports = { createWidget, listWidgets, getWidget, updateWidget, deleteWidget, getPublicConfig };