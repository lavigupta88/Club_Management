const env = require('../config/env');

const BASE = env.phpServiceUrl;

/* Fetch helper — returns raw text. */
async function get(path) {
  const url = `${BASE}${path}`;
  const resp = await fetch(url, { headers: { Accept: '*/*' } });
  if (!resp.ok) {
    const err = new Error(`PHP service error: ${resp.status}`);
    err.status = resp.status;
    throw err;
  }
  return resp.text();
}

/* Fetch helper — returns parsed JSON. */
async function getJson(path) {
  const url = `${BASE}${path}`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) {
    const err = new Error(`PHP service error: ${resp.status}`);
    err.status = resp.status;
    throw err;
  }
  return resp.json();
}

module.exports = { get, getJson };
