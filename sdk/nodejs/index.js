// @nano-sdk/node — Official Node.js SDK for Nano secrets manager
const https = require('https');
const http = require('http');
const { EventEmitter } = require('events');

const DEFAULT_BASE_URL = 'https://api.nano.dev';
const DEFAULT_TTL_MS = 60_000;
const DEFAULT_CACHE_SIZE = 500;

class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }
  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.maxSize) {
      this.map.delete(this.map.keys().next().value);
    }
    this.map.set(key, value);
  }
  delete(key) { this.map.delete(key); }
  clear() { this.map.clear(); }
}

class NanoClient extends EventEmitter {
  constructor({ token, env, baseURL = DEFAULT_BASE_URL, ttl = DEFAULT_TTL_MS, cacheSize = DEFAULT_CACHE_SIZE } = {}) {
    super();
    if (!token) throw new Error('Nano: token is required');
    if (!env) throw new Error('Nano: env (environment ID) is required');
    this.token = token;
    this.envID = env;
    this.baseURL = baseURL.replace(/\/$/, '');
    this.ttl = ttl;
    this.cache = new LRUCache(cacheSize);
    this.cacheTs = 0;
    this.ws = null;
    this._ready = false;
    this._initPromise = this._init();
  }

  async _init() {
    await this._bulkPull();
    this._connectWS();
    this._ready = true;
  }

  async ready() {
    await this._initPromise;
    return this;
  }

  async get(key) {
    await this.ready();
    const now = Date.now();
    if (now - this.cacheTs > this.ttl) {
      await this._bulkPull();
    }
    return this.cache.get(key) ?? null;
  }

  async getAll() {
    await this.ready();
    const result = {};
    for (const [k, v] of this.cache.map) result[k] = v;
    return result;
  }

  async _bulkPull() {
    try {
      const data = await this._request('GET', `/v1/envs/${this.envID}/secrets/values`);
      if (data && typeof data === 'object') {
        this.cache.clear();
        for (const [k, v] of Object.entries(data)) {
          this.cache.set(k, v);
        }
        this.cacheTs = Date.now();
        this.emit('refresh', Object.keys(data).length);
      }
    } catch (err) {
      this.emit('error', err);
    }
  }

  _connectWS() {
    // Graceful WS using native ws module if available, else polling fallback
    try {
      const WebSocket = require('ws');
      const wsURL = this.baseURL.replace(/^http/, 'ws') + `/v1/envs/${this.envID}/watch`;
      const connect = () => {
        this.ws = new WebSocket(wsURL, { headers: { Authorization: `Bearer ${this.token}` } });
        this.ws.on('message', (data) => {
          try {
            const event = JSON.parse(data.toString());
            if (event.env_id === this.envID) {
              if (event.secret_key) this.cache.delete(event.secret_key);
              else this.cache.clear();
              this._bulkPull();
              this.emit('invalidation', event);
            }
          } catch {}
        });
        this.ws.on('close', () => setTimeout(connect, 5000));
        this.ws.on('error', () => {});
      };
      connect();
    } catch {
      // ws module not available — fall back to polling
      this._startPolling();
    }
  }

  _startPolling(intervalMs = 30_000) {
    this._pollTimer = setInterval(() => this._bulkPull(), intervalMs);
    if (this._pollTimer.unref) this._pollTimer.unref();
  }

  _request(method, path, body) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseURL + path);
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'nano-node-sdk/2.0',
        },
      };
      const req = lib.request(options, (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch { resolve(raw); }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  destroy() {
    if (this.ws) this.ws.terminate();
    if (this._pollTimer) clearInterval(this._pollTimer);
  }
}

module.exports = { NanoClient };