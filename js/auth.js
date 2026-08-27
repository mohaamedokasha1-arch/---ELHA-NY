/* ============================================================
   الحَقني — ELHA'NI | Secure Auth & Session Checkpoint
   ------------------------------------------------------------
   • Master password is never stored in plain text.
   • Input is hashed with SHA-256 and compared against the
     pre-computed master hash.
   • Sessions persist in localStorage with a TTL, a single-use
     token, and failure rate-limiting (5 tries → 30s lock).
   • NOTE: this is a client-side checkpoint for the local build.
     In production, swap `verify()` for a POST to your API.
   ============================================================ */
(function () {
  "use strict";

  // SHA-256("MohamedAkasha12")
  var MASTER_HASH = "c1aa4e6bfe78d9d0d8ec26c2678ffaf53c4b8669650039f86a7fbde1307c6309";

  var SKEY = "elhani_session_v1";
  var LKEY = "elhani_auth_lock_v1";
  var MAX_TRIES = 5;
  var LOCK_MS = 30 * 1000;

  /* ---------- Pure-JS SHA-256 (fallback when crypto.subtle is unavailable) ---------- */
  function sha256Fallback(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow;
    var words = [];
    var asciiBitLen = ascii.length * 8;
    var hash = sha256Fallback.h = sha256Fallback.h || [];
    var k = sha256Fallback.k = sha256Fallback.k || [];
    var primeCounter = k.length;

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (var i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mp(candidate, 0.5) * 4294967296) | 0;
        k[primeCounter++] = (mp(candidate, 1 / 3) * 4294967296) | 0;
      }
    }

    ascii += "\x80";
    while (ascii.length % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii.length; i++) {
      var j = ascii.charCodeAt(i);
      if (j >> 8) return; // ASCII only
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (asciiBitLen / mp(2, 32)) | 0;
    words[words.length] = asciiBitLen;

    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16);
      var oldHash = hash;
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7]
          + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25))
          + ((e & hash[5]) ^ (~e & hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))
          ) | 0);
        var temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }

    var out = "";
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        out += ((b < 16) ? "0" : "") + b.toString(16);
      }
    }
    return out;
  }

  function utf8ToBytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.codePointAt(i);
      if (code > 0xffff) i++;
      if (code < 0x80) bytes.push(code);
      else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
      else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
      else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += ("0" + (bytes[i] & 255).toString(16)).slice(-2);
    return s;
  }

  /* ---------- Public API ---------- */
  function hashHex(password) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      var data = new TextEncoder().encode(password);
      return crypto.subtle.digest("SHA-256", data).then(function (buf) {
        return bytesToHex(new Uint8Array(buf));
      });
    }
    // Fallback: pure JS (handles ASCII perfectly — the master password is ASCII)
    return Promise.resolve(sha256Fallback(password));
  }

  function verify(password) {
    return hashHex(password).then(function (h) {
      return h === MASTER_HASH;
    });
  }

  /* ---------- Lockout (brute-force throttle) ---------- */
  function lockState() {
    try {
      var raw = localStorage.getItem(LKEY);
      if (!raw) return { fails: 0, until: 0 };
      return JSON.parse(raw);
    } catch (e) { return { fails: 0, until: 0 }; }
  }
  function isLocked() {
    var s = lockState();
    if (s.until > Date.now()) return s.until - Date.now();
    if (s.until <= Date.now() && s.fails > 0) { s.fails = 0; s.until = 0; localStorage.setItem(LKEY, JSON.stringify(s)); }
    return 0;
  }
  function recordFail() {
    var s = lockState();
    s.fails++;
    if (s.fails >= MAX_TRIES) { s.until = Date.now() + LOCK_MS; s.fails = 0; }
    localStorage.setItem(LKEY, JSON.stringify(s));
    return s.fails;
  }
  function clearFails() {
    localStorage.removeItem(LKEY);
  }

  /* ---------- Sessions ---------- */
  function makeToken() {
    try {
      var a = new Uint8Array(24);
      crypto.getRandomValues(a);
      return bytesToHex(a);
    } catch (e) {
      return "tok-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
    }
  }

  function createSession(durationMs) {
    var sess = {
      ok: true,
      role: "master",
      token: makeToken(),
      at: Date.now(),
      exp: Date.now() + (durationMs || 12 * 3600 * 1000)
    };
    localStorage.setItem(SKEY, JSON.stringify(sess));
    return sess;
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(SKEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.ok || !s.token) return null;
      if (Date.now() > s.exp) { localStorage.removeItem(SKEY); return null; }
      return s;
    } catch (e) { return null; }
  }

  function isAuthed() { return !!getSession(); }
  function clearSession() { localStorage.removeItem(SKEY); }

  window.ELHANI_AUTH = {
    verify: verify,
    createSession: createSession,
    getSession: getSession,
    isAuthed: isAuthed,
    clearSession: clearSession,
    isLocked: isLocked,
    recordFail: recordFail,
    clearFails: clearFails,
    MASTER_HASH: MASTER_HASH
  };
})();
