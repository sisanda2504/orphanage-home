exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { templateType, templateParams } = JSON.parse(event.body || '{}');

  const templates = {
    volunteerApproved: process.env.EMAILJS_TEMPLATE_VOLUNTEER,
    sponsorFailed:     process.env.EMAILJS_TEMPLATE_SPONSOR
  };

  const templateId = templates[templateType];
  if (!templateId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown template type' }) };
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:  process.env.EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id:     process.env.EMAILJS_PUBLIC_KEY,
      template_params: templateParams
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return { statusCode: response.status, body: JSON.stringify({ error: text }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
