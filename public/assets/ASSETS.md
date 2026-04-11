# Assets Directory

Place image files here to customize game visuals.
All assets are optional — SVG fallbacks are generated automatically when files are missing.

## Structure

```
assets/
├─ backgrounds/
│  └─ playfield.png         # Playfield background (any resolution, will cover)
├─ notes/
│  ├─ note-0.png             # Lane 0 note (recommended 48×48 or 64×64, transparent PNG)
│  ├─ note-1.png             # Lane 1 note
│  ├─ note-2.png             # Lane 2 note
│  └─ note-3.png             # Lane 3 note
├─ receptors/
│  ├─ receptor-0.png         # Lane 0 receptor (recommended 80×80, transparent PNG)
│  ├─ receptor-1.png         # Lane 1 receptor
│  ├─ receptor-2.png         # Lane 2 receptor
│  └─ receptor-3.png         # Lane 3 receptor
└─ ui/
   ├─ btn-play.png           # Play button
   ├─ btn-pause.png          # Pause button
   ├─ btn-restart.png        # Restart button
   └─ btn-menu.png           # Menu button
```

## Naming Convention

- `note-{laneIndex}.png` — per-lane note sprites
- `receptor-{laneIndex}.png` — per-lane receptor sprites
- `playfield.png` — gameplay background
- `btn-{action}.png` — UI buttons

If a file is missing, the game falls back to CSS gradients / inline SVG.
