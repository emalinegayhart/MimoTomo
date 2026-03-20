<img width="2812" height="1544" alt="image" src="https://github.com/user-attachments/assets/a7f20d5b-8daa-4f1f-ba95-2c069060d8f1" />

**mimotomo** is a little bunny that lives on your screen and reads the emotional weight of what you type in real time. it doesn't respond. it doesn't give advice. it just feels alongside you.

click anywhere on the screen and start writing.

as you type, sentiment analysis runs on each line and the sprite reacts physically depending on what it picks up. when you go quiet it idles, looks around, yawns, and eventually falls asleep.

**technicals:**
- server - node.js + express + ws
- sentiment - distilroberta (HF inference API) + AFINN fallback
- frontend - vanilla js, no framework
- font - [caveat](https://fonts.google.com/specimen/Caveat)
- websockets - keystrokes stream to the server in real time, emotions stream back
- roberta - `j-hartmann/emotion-english-distilroberta-base` via hugging face inference API. understands context, negation, tone. falls back to AFINN lexicon if no token is set
- sprite - pure css. no images. every expression (droopy ears, furrowed brows, sclera tracking toward your cursor) is keyframes and transforms
- idle / ambient ai - a timer-based state machine. at 5s, expression is neutral. at 15s it looks around. at 30s it yawns. at 60s it sleeps. wakes with a little startle when you come back

**test plan:**

```bash
git clone https://github.com/emalinegayhart/MimoTomo
cd MimoTomo
npm install
```

add a `.env` file:

```
PORT=3000
HF_TOKEN=your_huggingface_token_here
```
then:

```bash
npm start
```

and open `http://localhost:3000`, click anywhere, start writing.

(you can get a token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)). it still works without one because it falls back to AFINN lexicon scoring, but it's less nuanced.

**call for artists**
- if you're an artist and want to help me make the bunny cuter, i would SO appreciate you. [Please lmk!!](https://twitter.com/emzraline)
