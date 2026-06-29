// ── Copy to clipboard ─────────────────────────────────────────────────────────
async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 1500);
  } catch {
    btn.textContent = 'Error';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  }
}

// ── Render strength bar ───────────────────────────────────────────────────────
function renderStrength(entropy, barEl, ratingEl, crackEl) {
  const level = getLevel(entropy);
  barEl.style.width      = level.pct + '%';
  barEl.style.background = level.color;
  ratingEl.textContent   = level.label;
  ratingEl.style.color   = level.color;
  crackEl.textContent    = formatCrackTime(entropy);
}

// ── Generate tab ──────────────────────────────────────────────────────────────
const slider      = document.getElementById('lengthSlider');
const lengthVal   = document.getElementById('lengthVal');
const btnGen      = document.getElementById('btnGenerate');
const pwList      = document.getElementById('pwList');
const genStrength = document.getElementById('genStrength');
const genBar      = document.getElementById('genBar');
const genRating   = document.getElementById('genRating');
const genCrack    = document.getElementById('genCrack');

slider.addEventListener('input', () => {
  lengthVal.textContent = slider.value;
});

btnGen.addEventListener('click', () => {
  const len     = parseInt(slider.value);
  const upper   = document.getElementById('optUpper').checked;
  const lower   = document.getElementById('optLower').checked;
  const digits  = document.getElementById('optDigits').checked;
  const symbols = document.getElementById('optSymbols').checked;
  const noAmbig = document.getElementById('optNoAmbig').checked;

  if (!upper && !lower && !digits && !symbols) {
    pwList.innerHTML = '<div class="empty-state"><span class="icon">⚠️</span>Select at least one character type</div>';
    genStrength.style.display = 'none';
    return;
  }

  const passwords = Array.from({ length: 3 }, () =>
    generatePassword(len, upper, lower, digits, symbols, noAmbig)
  );

  pwList.innerHTML = '';
  passwords.forEach(pw => {
    const row  = document.createElement('div');
    row.className = 'pw-row';

    const text = document.createElement('span');
    text.className   = 'pw-text';
    text.textContent = pw;

    const btn = document.createElement('button');
    btn.className   = 'btn-copy';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => copyText(pw, btn));

    row.appendChild(text);
    row.appendChild(btn);
    pwList.appendChild(row);
  });

  genStrength.style.display = 'block';
  renderStrength(calcEntropy(passwords[0]), genBar, genRating, genCrack);
});

// ── Check tab ─────────────────────────────────────────────────────────────────
const checkInput      = document.getElementById('checkInput');
const checkResultCard = document.getElementById('checkResultCard');
const checkBar        = document.getElementById('checkBar');
const checkRating     = document.getElementById('checkRating');
const checkCrack      = document.getElementById('checkCrack');
const checkFeedback   = document.getElementById('checkFeedback');

checkInput.addEventListener('input', () => {
  const pw = checkInput.value;
  if (!pw) {
    checkResultCard.style.display = 'none';
    return;
  }
  checkResultCard.style.display = 'block';
  renderStrength(calcEntropy(pw), checkBar, checkRating, checkCrack);
  checkFeedback.innerHTML = getFeedback(pw)
    .map(t => `<div class="feedback-item">${t}</div>`)
    .join('');
});

// ── Tab switching ─────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});
