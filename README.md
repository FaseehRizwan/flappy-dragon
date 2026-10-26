# Flappy Dragon — HTML5 Edition

Responsive browser game using the original Flappy Dragon art and sounds.

## Run
Open `index.html` in a modern browser. If your browser blocks local image/audio files, start a local web server:

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in a browser. For mobile testing on the same Wi-Fi, use your computer's LAN IP address (and allow the port in the firewall).

## Controls
- Mobile: tap anywhere in the gameplay area to flap. Tap the pause button to pause.
- Desktop: Space, Up arrow, W, or mouse click to flap; P or Escape to pause; R to restart; F for fullscreen.
- High scores are saved in the browser using localStorage.

## Gameplay
- Random pipe heights and irregular spacing.
- Increasing difficulty and tighter gaps as score increases.
- Pipe foot ends hidden beyond the screen/ground.
- Scrolling volcanoes with occasional eruptions.
- Responsive canvas supporting mobile portrait and landscape, tablet, and desktop.

No external libraries or CDN dependencies.
