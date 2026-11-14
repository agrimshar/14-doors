An arch-topped button that opens one substance's world, and the only place that door's colours appear on the night screen.

- **You provide:** the two-character code, the name, the two-digit number, and the door's colour pair as `--a` and `--b` (for example `--md-a`, `--md-b`).
- **States:** default (30 percent tint of `--a` over `ink`), hover (lifts 5px, border and glow in `--a`), selected (filled `--a` to `--b`, text in `ink`), carried (the gem fills and glows), closed (30 percent opacity, when the well is dry).
- Up to two doors can be selected at once. Selecting a third releases the oldest.
- Top corners use `radius-arch`, bottom corners `radius-foot`. Doors sit in a grid of seven with a `space-3` gap, five across under 860px and four under 520px.
- The code is display italic. The name is the `micro` style. Never put an icon in a door.
