import { verify } from 'node:crypto';
const PROJECT = 'ieltsplatform-ee25e';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function createTokenVerifier(fetchImpl = fetch) {
  let certificates = {}, expires = 0, pending;
  async function refresh() {
    if (!pending) pending = (async () => {
      const response = await fetchImpl(CERTS_URL, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Certificate service unavailable');
      certificates = await response.json();
      const age = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 300);
      expires = Date.now() + Math.min(age, 21600) * 1000;
    })().finally(() => { pending = undefined; });
    return pending;
  }
  return async function verifyToken(token) {
    let header, payload, parts;
    try {
      if (typeof token !== 'string' || token.length > 10000) throw new Error();
      parts = token.split('.');
      if (parts.length !== 3) throw new Error();
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      const now = Math.floor(Date.now() / 1000);
      if (header.alg !== 'RS256' || typeof header.kid !== 'string' || header.kid.length > 200
        || payload.aud !== PROJECT || payload.iss !== `https://securetoken.google.com/${PROJECT}`
        || typeof payload.sub !== 'string' || !payload.sub.length || payload.sub.length > 128
        || typeof payload.exp !== 'number' || payload.exp <= now
        || typeof payload.iat !== 'number' || payload.iat > now
        || typeof payload.auth_time !== 'number' || payload.auth_time > now) throw new Error();
    } catch { throw new HttpError(401, 'Сессия жарамсыз немесе аяқталған. Аккаунтыңызға қайта кіріңіз.'); }
    if (Date.now() >= expires) {
      try { await refresh(); }
      catch { throw new HttpError(503, 'Аккаунтты тексеру уақытша қолжетімсіз. Қайта көріңіз.'); }
    }
    let valid = false;
    try {
      const cert = Object.hasOwn(certificates, header.kid) ? certificates[header.kid] : null;
      valid = typeof cert === 'string' && verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), cert, Buffer.from(parts[2], 'base64url'));
    } catch { /* Invalid signature is always denied. */ }
    if (!valid) throw new HttpError(401, 'Аккаунтты растау мүмкін болмады. Қайта кіріңіз.');
    return payload.sub;
  };
}
export const verifyFirebaseToken = createTokenVerifier();
