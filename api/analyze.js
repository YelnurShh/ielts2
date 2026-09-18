// Remote AI analysis is disabled. Essays are analyzed locally in the browser.
export default function handler(req, res) {
  res.statusCode = 410;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ error: 'Талдау браузерде орындалады. API қолданылмайды.' }));
}
