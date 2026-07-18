// Safe side effect — agar ye fail ho, submission par asar nahi padna chahiye
async function notifyOwnerOfSubmission(widget, submission) {
  try {
    // Abhi ke liye sirf console log (future mein real email/webhook laga sakte hain)
    console.log(`📩 New submission for widget "${widget.title}" (id: ${widget.id}):`, submission.data);

    // Agar widget ka koi webhook URL set ho, to us par bhi bhej do
    if (widget.webhook_url) {
      const response = await fetch(widget.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: widget.id,
          submissionId: submission.id,
          data: submission.data,
          createdAt: submission.created_at
        })
      });

      if (!response.ok) {
        console.error(`Webhook call failed with status ${response.status}`);
      }
    }
  } catch (err) {
    // Kabhi bhi is function ka error bahar throw nahi hona chahiye
    console.error('Notification failed (non-blocking):', err.message);
  }
}

module.exports = { notifyOwnerOfSubmission };