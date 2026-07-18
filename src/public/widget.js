(function () {
  // 1. Find the <script> tag that loaded this file
  const scriptTag = document.currentScript;
  const widgetId = scriptTag.getAttribute('data-widget-id');

  if (!widgetId) {
    console.error('Widget: data-widget-id attribute is missing.');
    return;
  }

  // 2. Fetch the widget's public config
  fetch(`http://localhost:3000/widgets/${widgetId}/config`)
    .then((res) => {
      if (!res.ok) throw new Error('Widget config not found');
      return res.json();
    })
    .then((config) => {
      renderWidget(config);
    })
    .catch((err) => {
      console.error('Widget failed to load:', err);
    });

  // 3. Build and show the popover
  function renderWidget(config) {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 280px;
      padding: 16px;
      background: #ffffff;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: Arial, sans-serif;
      z-index: 9999;
    `;

    const title = document.createElement('h3');
    title.textContent = config.title;
    title.style.cssText = 'margin: 0 0 8px 0; font-size: 16px;';

    const copy = document.createElement('p');
    copy.textContent = config.copyText;
    copy.style.cssText = 'margin: 0 0 12px 0; font-size: 13px; color: #555;';

    const form = document.createElement('form');

    (config.fields || []).forEach((field) => {
      const input = document.createElement('input');
      input.type = field.type || 'text';
      input.name = field.name;
      input.placeholder = field.name;
      input.required = !!field.required;
      input.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 8px; box-sizing: border-box;';
      form.appendChild(input);
    });

    // Honeypot field — asal user ko nazar nahi aata, bots isay bhar dete hain
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website';
    honeypot.autocomplete = 'off';
    honeypot.tabIndex = -1;
    honeypot.style.cssText = 'position: absolute; left: -9999px; opacity: 0;';
    form.appendChild(honeypot);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Submit';
    submitBtn.style.cssText = `
      width: 100%;
      padding: 8px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;

    form.appendChild(submitBtn);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value;

      fetch('http://localhost:3000/widgets/' + widgetId + '/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, website: honeypot.value })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          copy.textContent = 'Thank you! Submission received.';
          form.style.display = 'none';
        })
        .catch(function (err) {
          copy.textContent = 'Error: could not submit. Try again.';
          console.error(err);
        });
    });

    container.appendChild(title);
    container.appendChild(copy);
    container.appendChild(form);
    document.body.appendChild(container);
  }
})();


