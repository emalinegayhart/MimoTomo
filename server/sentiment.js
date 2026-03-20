const { mapHfToEmotion, mapAfinnToEmotion } = require('./emotions');

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = 'j-hartmann/emotion-english-distilroberta-base';
const HF_URL   = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// ── HuggingFace Inference (primary) ───────────────────────

async function analyzeWithHf(text) {
  const res = await fetch(HF_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF API ${res.status}: ${err}`);
  }

  // returns [[{ label, score }, ...]] sorted by score desc
  const data = await res.json();
  const results = Array.isArray(data[0]) ? data[0] : data;
  const top = results[0];

  return {
    ...mapHfToEmotion(top.label.toLowerCase(), top.score),
    score: top.score,
    model: 'roberta',
  };
}

// ── AFINN fallback (no token / HF down) ───────────────────

let SentimentLib;
function getAfinn() {
  if (!SentimentLib) SentimentLib = new (require('sentiment'))();
  return SentimentLib;
}

function analyzeWithAfinn(text) {
  const { score } = getAfinn().analyze(text);
  return {
    ...mapAfinnToEmotion(score, text),
    score,
    model: 'afinn',
  };
}

// ── Public interface ───────────────────────────────────────

async function analyze(text) {
  if (!text || !text.trim()) {
    return { emotion: 'neutral', confidence: 1.0, score: 0, model: 'none' };
  }

  if (HF_TOKEN) {
    try {
      return await analyzeWithHf(text);
    } catch (err) {
      console.warn('[sentiment] HF API failed, falling back to AFINN:', err.message);
    }
  }

  return analyzeWithAfinn(text);
}

module.exports = { analyze };
