# Fourteen Doors

A short autobiographical game about altered states, what they cost, and finding level ground. Built in a day for the Toronto Game Jam (Chroma Awards).

## Play

- `index.html` is the 3D first-person game. Open it in a current desktop browser, or serve the folder with any static host.
- `2d/index.html` is the earlier 2D version: fourteen shader worlds, one per substance.

Both are single self-contained files. The 3D game loads three.js r128 and two fonts from public CDNs; everything else, including all music and sound, is generated in the browser.

### 3D controls

Click to look, WASD to walk, hold E to act, Esc frees the mouse. Arrow keys also turn and walk.

### 3D objective

Each of the four days has a joy goal. Reach it and get to bed before midnight to keep the day. Keep three of four days. The game ends early if the family finds out or the habit meter fills.

## Layout

| Path | What |
| --- | --- |
| `index.html` | Built 3D game |
| `3d/src/` | 3D source: `game3d.js` (logic and three.js scene), `house.js` (tuning, tasks, people, story text), `post.js` (screen effects), `house.css`, `index.html` template |
| `2d/index.html` | Built 2D game |
| `2d/src/` | 2D source, also shared by the 3D build: `shaders.js` (the fourteen worlds), `data.js` (substances, pairings, story text), `audio.js` (synth and sequencer), `style.css`, `game.js` |
| `design-system/project/` | Tokens, brand book and component previews. Note: it still documents the original serif and mono type; the 3D game has since moved to Syncopate and Chakra Petch. |

## Build

Needs Node, no dependencies.

```
node 2d/build.js   # writes 2d/index.html
node 3d/build.js   # writes index.html
```

## Editing the story

All narration is placeholder text written in the first person. Replace it with your own in `2d/src/data.js` (captions and lessons per substance, pairing lines) and `3d/src/house.js` (`STORY`, `SAY`, `ENDINGS`, task lines).
