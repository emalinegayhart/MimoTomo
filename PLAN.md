# feels-with-you

> *"It feels with you, it doesn't speak with you."*

A real-time emotional companion. You type, it feels. It doesn't respond with words — it responds with its whole body.

---

## Concept

A small animated sprite lives on your screen. As you type anything — venting, journaling, rambling — it reads the emotional weight of your words in real-time via WebSocket and reacts physically. Sad text makes it slump and tear up. Excited text makes it bounce. Angry text makes it tremble. When you go quiet, it idles — breathing, looking around, occasionally yawning — just *present*.

It is not a chatbot. It has no voice. It just feels alongside you.

---

## Emotion Output Shape

```json
{ "emotion": "sad", "confidence": 0.87 }
```

Emotions: `happy`, `excited`, `sad`, `distressed`, `angry`, `anxious`, `surprised`, `neutral`, `contemplative`

---

## Architecture

```
client (browser)
  │  user types in textarea
  │  sends { type: "text", content: "..." } over WebSocket
  ▼
server (Node.js + ws)
  │  runs sentiment analysis (sentiment + emotion mapping)
  │  responds with { type: "emotion", emotion: "sad", confidence: 0.87, score: -3 }
  ▼
client
  │  sprite controller applies emotion class to sprite
  │  CSS animations handle the visual expression
  │  idle manager takes over after N seconds of silence
```

---

## Tech Stack

| Layer | Tool |
|---|---|
| Server | Node.js + Express + `ws` |
| Sentiment | `sentiment` (AFINN lexicon) + emotion mapper |
| Transport | WebSocket (native `ws`) |
| Frontend | Vanilla JS, no framework |
| Sprite | Pure CSS character (divs + keyframe animations) |
| Idle AI | JS timer-based ambient state machine |

---

## File Structure

```
feels-with-you/
├── PLAN.md
├── package.json
├── server/
│   ├── index.js          # Express + WebSocket server
│   ├── sentiment.js      # Sentiment analysis + score → emotion
│   └── emotions.js       # Emotion definitions + keyword boosters
├── client/
│   ├── index.html        # Shell
│   ├── css/
│   │   ├── style.css     # Layout, textarea, dark UI
│   │   └── sprite.css    # Sprite anatomy + all emotion keyframes
│   ├── js/
│   │   ├── main.js       # App entry, ties everything together
│   │   ├── socket.js     # WebSocket client, message dispatch
│   │   ├── sprite.js     # Sprite DOM controller (apply emotion states)
│   │   └── idle.js       # Idle / ambient state machine
│   └── assets/
│       └── sprite/       # (reserved for future sprite sheet PNGs)
└── .env.example
```

---

## Emotion → Animation Map

| Emotion | Visual Behavior |
|---|---|
| `happy` | Eyes curve upward, mouth smiles, gentle bounce |
| `excited` | Eyes wide open, big smile, fast bounce, rosy cheeks |
| `sad` | Eyes droop, mouth frowns, body slumps, tears form |
| `distressed` | Tears flowing, shaking, curled posture |
| `angry` | Furrowed brows, red tint, body vibrates |
| `anxious` | Eyes dart, small jittery movement, tense |
| `surprised` | Eyes go wide (O shape), mouth open circle, jump |
| `contemplative` | Eyes half-closed, head tilt, slow breathe |
| `neutral` | Default resting, slow breathe |

---

## Idle / Ambient State Machine

When the user stops typing for `N` seconds, the sprite transitions through ambient states:

```
0s  → emotion hold (lingers on last felt emotion, fades toward neutral)
5s  → neutral + breathing cycle
15s → looks left, looks right (curiosity idle)
30s → yawn animation
60s → falls asleep (zzz particles float up)
∞   → sleeping, occasional dream twitches
```

On user return (keydown): sprite wakes up with a little startle → ready state.

---

## Sentiment Analysis Logic

1. Run raw text through `sentiment` → numeric score (e.g. -5 to +5)
2. Check for keyword boosters (fear words → anxious, anger words → angry, etc.)
3. Normalize score → 0–1 confidence based on magnitude
4. Output `{ emotion, confidence }`

```
score ≤ -4          → distressed
score -3 to -1      → sad
score 0             → neutral (or contemplative if text has "?")
score +1 to +3      → happy
score ≥ +4          → excited

keyword override:
  anger words       → angry  (furious, hate, rage, ugh)
  fear/worry words  → anxious (scared, nervous, worried, terrified)
  surprise words    → surprised (wow, omg, what, no way, wait)
```

---

## WebSocket Protocol

```
Client → Server
  { type: "text", content: "I feel so alone today" }

Server → Client
  { type: "emotion", emotion: "sad", confidence: 0.87, score: -3 }
  { type: "pong" }   // keepalive
```

---

## Roadmap

- [x] Scaffold project structure
- [x] Write plan
- [ ] Implement sentiment server
- [ ] Implement WebSocket server
- [ ] Build CSS sprite (blob character with expressions)
- [ ] Wire up WebSocket client
- [ ] Build idle state machine
- [ ] Emotion transition smoothing (don't snap between states, crossfade)
- [ ] Tune confidence thresholds with test phrases
- [ ] Add ambient particle effects (tears, hearts, zzz)
- [ ] Mobile layout
- [ ] Optional: persist emotion history as a waveform timeline at bottom
- [ ] Optional: Transformers.js for richer emotion nuance (joy/fear/disgust/surprise via text classification)
