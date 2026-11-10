const fs = require('fs');
const crypto = require('crypto');

// Compose mounts each secret at /run/secrets/NAME. Outside Docker we fall
// back to the environment. The value is never logged: only a fingerprint.
function readSecret(name) {
  try {
    return fs.readFileSync(`/run/secrets/${name}`, 'utf8').trim();
  } catch {
    return (process.env[name] || '').trim();
  }
}

function fingerprint(value) {
  if (!value) return null;
  return 'sha256:' + crypto.createHash('sha256').update(value).digest('hex').slice(0, 10);
}

function secretStatus(names) {
  const out = {};
  for (const n of names) {
    const v = readSecret(n);
    out[n] = v ? { loaded: true, fingerprint: fingerprint(v) } : { loaded: false };
  }
  return out;
}

module.exports = { readSecret, fingerprint, secretStatus };
