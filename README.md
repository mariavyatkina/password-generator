# Password Tool

A client-side password generator and strength checker. No data leaves your browser.

**Live at: https://password-generator-hpdg.onrender.com/**

---

## Features

- Generate 3 secure passwords at once with a single click
- Configure length (8–64), character groups, and ambiguous character exclusion
- Check the strength of any existing password
- Entropy-based strength score with color bar (Very Weak → Very Strong)
- Estimated crack time against a modern GPU attacker
- Copy to clipboard with one click

---

## How Password Generation Works

### 1. Build the character pool

Based on the selected options, a pool of allowed characters is assembled:

| Group | Characters | Size |
|---|---|---|
| Uppercase | A–Z | 26 |
| Lowercase | a–z | 26 |
| Numbers | 0–9 | 10 |
| Symbols | !@#$%^&*()_+-=[]{}&#124;;:,.<>? | ~30 |

If **Exclude ambiguous** is on, the characters `0 O 1 l I |` are removed from the pool before any picking happens.

### 2. Guarantee diversity

Before random-filling the remaining length, one character is forced from each selected group. This ensures every generated password contains at least one uppercase letter, one digit, etc. — you'll never get an all-lowercase result by bad luck.

### 3. Cryptographically random selection

Each character is chosen using `crypto.getRandomValues()` — the browser's secure random number generator, the same one used by TLS. `Math.random()` is intentionally avoided because it is deterministic and predictable.

**Rejection sampling** is applied to eliminate modulo bias: since the pool size rarely divides evenly into 2³², naively taking `random % poolSize` would make low-index characters slightly more likely. The code discards any draw that falls in the biased remainder, so every character has exactly equal probability.

### 4. Shuffle

The forced "guarantee" characters start at the front of the array, which would create a predictable structure. After the array is filled, it is shuffled end-to-end using the Fisher-Yates algorithm (also driven by `crypto.getRandomValues()`), so the guaranteed characters land at uniformly random positions.

---

## How the Crack Time Estimation Works

### Step 1 — Entropy (bits)

Entropy quantifies how unpredictable a password is:

```
entropy = length × log₂(charset size)
```

Example — a 16-character password using all four groups (~92 characters):

```
16 × log₂(92) ≈ 16 × 6.52 ≈ 104 bits
```

Each additional bit doubles the search space. 104 bits means an attacker must try up to 2¹⁰⁴ ≈ 20 thousand trillion trillion combinations in the worst case.

For the **Check Strength** tab, the charset size is inferred from which character classes are actually present in the pasted password, not from any configuration — so the score is always honest.

### Step 2 — Divide by attack speed

The model assumes **10 billion guesses per second** — a realistic figure for a GPU cracking rig (e.g. hashcat on a high-end cluster) against a fast, unsalted hash. Against a slow hash like bcrypt the real number would be far lower, so this estimate is intentionally pessimistic (worst case for you).

```
seconds to crack = 2^entropy / 10,000,000,000
```

### Step 3 — Format

The raw seconds are converted to the largest human-readable unit: seconds → minutes → hours → days → months → years → centuries.

### Strength thresholds

| Entropy | Label | What it means |
|---|---|---|
| < 28 bits | Very Weak | Cracked in under a second |
| 28–35 bits | Weak | Seconds to minutes |
| 36–59 bits | Fair | Hours to days |
| 60–127 bits | Strong | Years to millennia |
| ≥ 128 bits | Very Strong | Longer than the age of the universe |

---

## Project Structure

```
password-generator/
├── index.html        # Markup
├── css/
│   └── style.css     # All styles and CSS variables
└── js/
    ├── crypto.js     # Generation logic, entropy, crack time, feedback
    └── ui.js         # DOM wiring and event listeners
```
