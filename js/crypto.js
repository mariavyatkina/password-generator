// ── Character sets ────────────────────────────────────────────────────────────
const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER   = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS  = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIG   = /[0O1lI|]/g;

// ── Strength levels ───────────────────────────────────────────────────────────
const LEVELS = [
  { min: 0,   max: 28,       label: 'Very Weak',   color: 'var(--red)',    pct: 12  },
  { min: 28,  max: 36,       label: 'Weak',         color: 'var(--orange)', pct: 28  },
  { min: 36,  max: 60,       label: 'Fair',         color: 'var(--yellow)', pct: 50  },
  { min: 60,  max: 128,      label: 'Strong',       color: 'var(--green)',  pct: 76  },
  { min: 128, max: Infinity, label: 'Very Strong',  color: 'var(--teal)',   pct: 100 },
];

// ── Crypto-random helpers ─────────────────────────────────────────────────────
function randomIndex(max) {
  const arr = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  do { crypto.getRandomValues(arr); } while (arr[0] >= limit);
  return arr[0] % max;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Password generation ───────────────────────────────────────────────────────
function buildCharset(upper, lower, digits, symbols, noAmbig) {
  let cs = '';
  if (upper)   cs += UPPER;
  if (lower)   cs += LOWER;
  if (digits)  cs += DIGITS;
  if (symbols) cs += SYMBOLS;
  if (noAmbig) cs = cs.replace(AMBIG, '');
  return cs;
}

function generatePassword(len, upper, lower, digits, symbols, noAmbig) {
  const charset = buildCharset(upper, lower, digits, symbols, noAmbig);
  if (!charset.length) return '';

  // Guarantee at least one char from each selected group
  const pools = [];
  if (upper)   pools.push(noAmbig ? UPPER.replace(AMBIG, '')   : UPPER);
  if (lower)   pools.push(noAmbig ? LOWER.replace(AMBIG, '')   : LOWER);
  if (digits)  pools.push(noAmbig ? DIGITS.replace(AMBIG, '')  : DIGITS);
  if (symbols) pools.push(noAmbig ? SYMBOLS.replace(AMBIG, '') : SYMBOLS);

  const required = pools
    .filter(p => p.length)
    .map(p => p[randomIndex(p.length)]);

  const extra = Array.from(
    { length: len - required.length },
    () => charset[randomIndex(charset.length)]
  );

  return shuffle([...required, ...extra]).join('');
}

// ── Strength analysis ─────────────────────────────────────────────────────────
function detectCharsetSize(pw) {
  let size = 0;
  if (/[A-Z]/.test(pw))       size += 26;
  if (/[a-z]/.test(pw))       size += 26;
  if (/[0-9]/.test(pw))       size += 10;
  if (/[^A-Za-z0-9]/.test(pw)) size += 32;
  return size || 1;
}

function calcEntropy(pw) {
  return pw.length * Math.log2(detectCharsetSize(pw));
}

function getLevel(entropy) {
  return LEVELS.find(l => entropy >= l.min && entropy < l.max) || LEVELS[0];
}

// ── Crack time estimation ─────────────────────────────────────────────────────
const GUESSES_PER_SEC = 1e10;

function formatCrackTime(entropy) {
  const seconds = Math.pow(2, Math.min(entropy, 1023)) / GUESSES_PER_SEC;
  if (seconds < 1) return 'less than a second';

  const units = [
    { div: 3153600000, singular: 'century',  plural: 'centuries' },
    { div: 31536000,   singular: 'year',     plural: 'years'     },
    { div: 2592000,    singular: 'month',    plural: 'months'    },
    { div: 86400,      singular: 'day',      plural: 'days'      },
    { div: 3600,       singular: 'hour',     plural: 'hours'     },
    { div: 60,         singular: 'minute',   plural: 'minutes'   },
    { div: 1,          singular: 'second',   plural: 'seconds'   },
  ];

  for (const { div, singular, plural } of units) {
    const val = Math.floor(seconds / div);
    if (val >= 1) {
      if (div === 3153600000 && val >= 1e15) return 'longer than the age of the universe';
      return `~${val.toLocaleString()} ${val === 1 ? singular : plural}`;
    }
  }

  return 'less than a second';
}

// ── Feedback for check tab ────────────────────────────────────────────────────
function getFeedback(pw) {
  const tips = [];
  if (pw.length < 12)                              tips.push('Use at least 12 characters');
  if (!/[A-Z]/.test(pw))                           tips.push('Add uppercase letters');
  if (!/[a-z]/.test(pw))                           tips.push('Add lowercase letters');
  if (!/[0-9]/.test(pw))                           tips.push('Add numbers');
  if (!/[^A-Za-z0-9]/.test(pw))                   tips.push('Add symbols (!@#$…)');
  if (/(.)\1{2,}/.test(pw))                        tips.push('Avoid repeated characters');
  if (/^(password|123456|qwerty|abc|letmein)/i.test(pw)) tips.push('Avoid common patterns');
  return tips;
}
