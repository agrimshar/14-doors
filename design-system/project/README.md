# Fourteen Doors

Clinical labels on molten colour. The design system for a short autobiographical game about altered states, what they cost, and finding level ground.

## The idea

Two voices share every screen and never mix.

- **The narrator** speaks in Bodoni Moda italic. First person, past tense, plain words. This voice is warm and it tells the truth about cost.
- **The instrument** measures in DM Mono, uppercase, tracked wide. Well, tide, light, door codes. This voice never has feelings.

Behind both is a full-bleed live world. The interface floats on it, anchored bottom-left, with no panels and no cards.

## Content fundamentals

- First person, past tense. "Someone handed me water and I loved them for it."
- One thought a line, fourteen words at most. Captions are read while steering.
- Name the cost without a lecture. "Tuesday came for all of it." Never advise, never instruct, never mention amounts.
- Each door gets three captions (arriving, the middle, coming down) and one lesson. A lesson is something the narrator keeps: "Even the small ones are loans."
- Instrument labels are two or three words: THE WELL, THE TIDE, LIGHTS CARRIED, LEAVE EARLY. Buttons say what happens: STEP THROUGH, BACK TO THE NIGHT, LET THE MORNING IN.
- Substances are named plainly, by the name the narrator would use. Codes are two characters in the manner of a periodic table: Md, Ps, 2C.

## Visual foundations

**Ground and ink.** `ink` is the night and `paper` is everything written on it. `dim` is for labels, `faint` for hairlines only. There is one theme. The game is a night.

**Door colours.** Every door owns a pair: `<id>-a` is its identity and `<id>-b` its companion. A door's colours appear on its arch, its gem and inside its world, and nowhere else. `dawn` belongs to morning and to the breathing light. `warn` marks a tide that is off level.

**Type.** Narrator styles (`title`, `heading`, `caption`, `numeral`, `lesson`, `lede`) use the display family. Instrument styles (`label`, `action`, `micro`) use the mono family in uppercase. Italic means the narrator is speaking. Upright display type is used for the title and for running text.

**Shape.** The arch (`radius-arch` over `radius-foot`) means a door. The circle means breath. Everything else is square (`radius-square`) and drawn with a one-pixel `paper` or `faint` line.

**Legibility.** Text sits directly on moving colour, so every line carries the `scrim` shadow. Do not add boxes behind text. Where a world is pale (the Quiet, morning), the world is dimmed instead.

**Layout.** One screen, no scrolling during play. Text blocks anchor bottom-left at the gutter (`space-4` to `space-gutter`) and are at most 680px wide. The top edge carries the instrument: who, where, a two-pixel progress hairline, the light counter.

**Motion.** Screens cross-fade over 0.7 to 0.9 s. Captions rise 8px as they fade in. Doors lift 5px on hover. Nothing bounces. Inside a door all motion belongs to the world: trails, drift and zoom are set per door in the table below. Reduced-motion settings cut world intensity to 60 percent and remove the fades.

**Sound.** Every door has its own tempo and scale, synthesised live. Collected lights play notes of that door's scale, so the player performs the melody. Morning stacks one bell per carried light into a major chord.

## Iconography

There are no icons. The system has three marks, all drawn in CSS:

- **The diamond**, a 9 to 11px square turned 45 degrees, is a light. Outlined when empty, filled with a door's `-a` colour and glowing when carried.
- **The arch** is a door.
- **The ring** around the breathing light shows the well, drawn clockwise in `paper` over `faint`.

There is no logo. The name is set in the `title` style, with *Doors* in italic.

## The fourteen worlds

| No. | Code | Name | Place | Colours | Look | Rule | Sound |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | Md | MDMA | The Warm Room | `md-a` #ff2e93 · `md-b` #ffc94d | Bokeh and a heartbeat ring | Lights are pulled toward you | 124 bpm, lydian, four on the floor |
| 02 | Ps | Mushrooms / LSD | The Garden | `ps-a` #a855ff · `ps-b` #b6ff3c | Six-fold breathing marble | Touch one light, gather its six mirrors | 92 bpm, mixolydian bells |
| 03 | Cn | Cannabis | The Slow Green | `cn-a` #35d07f · `cn-b` #e9b949 | Slow ink-in-water smoke | Heavy steering, slowed time, a forgetful scatter | 74 bpm, dorian, swung and detuned |
| 04 | Al | Alcohol | Last Call | `al-a` #ff9a2e · `al-b` #ff3b5c | Sloshing amber under bar neon | Generous at first, then sway and double vision | 100 bpm shuffle, pitch drifting |
| 05 | Kt | Ketamine | The Corridor | `kt-a` #7ff3ea · `kt-b` #e8ffff | Cold perspective grid around a hole | The body follows the hand 0.65 s late | 60 bpm, whole tone, long delay |
| 06 | Cf | Caffeine | Nine A.M. | `cf-a` #ffd60a · `cf-b` #fff3d6 | Top-down cup, yellow rays | Lights pop on a tick and expire | 138 bpm pizzicato |
| 07 | Nc | Nicotine | The Ember | `nc-a` #ff6a1a · `nc-b` #9db4c8 | Grey smoke, one ember | Glow fades in four seconds; touch the ember to relight | 80 bpm, a single low drone |
| 08 | Co | Cocaine | The Mirror | `co-a` #a8e6ff · `co-b` #ffffff | Black and white mirror shards | Each light is worth one less; speed keeps rising; hard cut | 128 bpm accelerating, phrygian |
| 09 | Ad | Adderall | The Grid | `ad-a` #3d6bff · `ad-b` #ff8a1f | Blue lattice under a spotlight | Only the next item in the list can be taken | 120 bpm sine sequence, metronome |
| 10 | Dx | Dexedrine | The Thread | `dx-a` #ff3b2f · `dx-b` #ffe9dc | One red thread over parallel lines | Stay on the thread to build a multiplier | 108 bpm, dorian strings |
| 11 | Xn | Xanax | The Quiet | `xn-a` #b9b4ff · `xn-b` #ffc9b8 | Pastel fog | Blackouts skip time and erase the room | 56 bpm, low-passed to 520 Hz |
| 12 | 2C | 2C-B | Neon Geometry | `cb-a` #ff00c8 · `cb-b` #c6ff00 | Neon hexagon tiling | Your trail gathers as well as your head | 116 bpm pentatonic, ping delay |
| 13 | 4M | 4-MMC | The Wave | `mm-a` #00e5ff · `mm-b` #8a3dff | Interference bands, a sweeping wavefront | Waves shrink; fly through AGAIN to renew them, at a cost | 140 bpm rolling bass |
| 14 | Dm | DMT | The Breakthrough | `dm-a` #ffcf3a · `dm-b` #e0115f | Eight-fold jewel tunnel | Hold still and the aperture opens | 170 bpm, whole tone, endless riser |

Two doors opened together blend their worlds through a drifting marble mask and combine their rules. Named pairings change yield and cost: some lift each other, most cost more than they give, and one goes black.

## The three numbers

- **Light** is gathered inside a door. Enough of it, and the door's lesson is carried out as a diamond.
- **The well** is what every door spends. When it is low the colours do not come. It refills only by breathing.
- **The tide** rises with stimulants and falls with depressants. Morning needs it level.

Morning arrives with five lights, a well of 70 percent and a level tide. The sunrise is banded in the colours of the lights that were carried.

## Usage rules

1. Never place a door colour on the night screen except on that door.
2. Never set narrator text in mono or instrument text in the display face.
3. Text on a live world always carries `scrim`.
4. `dawn` appears on one button in the whole game. Keep it that way.
5. Text pairs that pass 4.5:1: `paper` on `ink`, `dim` on `ink`, `ink` on `paper`, `ink` on `dawn`, and `ink` on every door `-a` colour (the selected door).
