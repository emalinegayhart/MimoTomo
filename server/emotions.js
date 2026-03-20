// Map HuggingFace emotion labels → sprite emotion states

// j-hartmann/emotion-english-distilroberta-base outputs these 7 labels:
// anger, disgust, fear, joy, neutral, sadness, surprise

function mapHfToEmotion(label, score) {
  switch (label) {
    case 'joy':
      // high confidence joy → excited, moderate → happy
      return { emotion: score > 0.82 ? 'excited' : 'happy', confidence: score };
    case 'sadness':
      // very high sadness → distressed
      return { emotion: score > 0.85 ? 'distressed' : 'sad', confidence: score };
    case 'anger':
      return { emotion: 'angry', confidence: score };
    case 'disgust':
      return { emotion: 'distressed', confidence: score };
    case 'fear':
      return { emotion: 'anxious', confidence: score };
    case 'surprise':
      return { emotion: 'surprised', confidence: score };
    case 'neutral':
    default:
      return { emotion: 'neutral', confidence: score };
  }
}

// ── AFINN fallback (used when HF_TOKEN is not set) ─────────

const AFINN_THRESHOLDS = {
  DISTRESSED: -4,
  SAD:        -1,
  HAPPY:       2,
  EXCITED:     4,
};

const AFINN_KEYWORD_OVERRIDES = {
  angry:    ['hate','furious','rage','angry','anger','mad','pissed','livid','ugh','wtf','infuriating'],
  anxious:  ['scared','nervous','worried','anxious','anxiety','panic','dread','fear','afraid','stressed','overwhelmed'],
  surprised:['wow','omg','oh my god','whoa','wait','no way','seriously','unbelievable','shocked'],
};

function mapAfinnToEmotion(score, text) {
  const lower = text.toLowerCase();

  for (const [emotion, keywords] of Object.entries(AFINN_KEYWORD_OVERRIDES)) {
    const hits = keywords.filter(k => lower.includes(k)).length;
    if (hits > 0) {
      return { emotion, confidence: parseFloat(Math.min(0.95, 0.6 + hits * 0.1).toFixed(2)) };
    }
  }

  const hasQuestion = lower.includes('?') || lower.startsWith('why') || lower.startsWith('how');
  if (hasQuestion && Math.abs(score) <= 1) {
    return { emotion: 'contemplative', confidence: 0.65 };
  }

  let emotion;
  if      (score <= AFINN_THRESHOLDS.DISTRESSED) emotion = 'distressed';
  else if (score <= AFINN_THRESHOLDS.SAD)        emotion = 'sad';
  else if (score <  AFINN_THRESHOLDS.HAPPY)      emotion = 'neutral';
  else if (score <  AFINN_THRESHOLDS.EXCITED)    emotion = 'happy';
  else                                            emotion = 'excited';

  const confidence = parseFloat(Math.min(0.97, 0.5 + Math.abs(score) * 0.08).toFixed(2));
  return { emotion, confidence };
}

module.exports = { mapHfToEmotion, mapAfinnToEmotion };
