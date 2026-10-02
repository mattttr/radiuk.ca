// Catalog of p5.js sketches shown in the Projects folder.
// Each id maps to ./<id>.js, which exports `default (p, env) => { ... }`.
// "classic" = carried over from the original radiuk.ca, "new" = added in Matt Radiuk 95.

export const sketches = [
  {
    id: 'flow-field', title: 'Flow Field', exe: 'FlowField.exe', origin: 'classic',
    blurb: 'Six hundred particles surfing a Perlin-noise vector field that slowly evolves over time. Your cursor bends the current around it.',
    hint: 'Move the mouse through the field.',
  },
  {
    id: 'boids', title: 'Boids', exe: 'Boids.exe', origin: 'classic',
    blurb: "Craig Reynolds' classic flocking model: separation, alignment and cohesion. Complex group behaviour from three simple rules.",
    hint: 'The flock is curious about your cursor.',
  },
  {
    id: 'gravity-wells', title: 'Gravity Wells', exe: 'GravWell.exe', origin: 'classic',
    blurb: 'Particles orbiting three drifting gravity wells, leaving light trails. The cursor acts as a repulsor.',
    hint: 'Push particles around with the mouse.',
  },
  {
    id: 'ripple-tank', title: 'Ripple Tank', exe: 'Ripple.exe', origin: 'classic',
    blurb: 'A 2D wave equation solved on a grid with damping. Drops create interfering ripples.',
    hint: 'Click (or drag) to drop pebbles.',
  },
  {
    id: 'swarm', title: 'Magnetic Swarm', exe: 'Swarm.exe', origin: 'classic',
    blurb: 'A cloud of particles attracted to a magnetic cursor, with friction and a speed cap so things stay (mostly) civilised.',
    hint: 'Move to attract, click to scatter.',
  },
  {
    id: 'lissajous', title: 'Lissajous Weave', exe: 'Lissajous.exe', origin: 'classic',
    blurb: 'Lissajous curves with frequency ratios you can tune live. When left alone it morphs on its own.',
    hint: 'Mouse X and Y set the two frequencies.',
  },
  {
    id: 'fractal-tree', title: 'Fractal Tree', exe: 'FracTree.exe', origin: 'classic',
    blurb: 'A recursive tree swaying in a breeze. Branch angle and trunk length follow your cursor.',
    hint: 'Move left/right to bend, up/down to grow.',
  },
  {
    id: 'particle-web', title: 'Particle Web', exe: 'PartWeb.exe', origin: 'classic',
    blurb: 'Drifting particles that connect with their neighbours, the sketch that opened the original radiuk.ca.',
    hint: 'Your cursor nudges nearby particles.',
  },
  {
    id: 'pipes', title: '3D Pipes', exe: 'Pipes3D.exe', origin: 'new', webgl: true,
    blurb: 'A tribute to the most famous screen saver of the 90s, written from scratch in WebGL. Pipes grow through a 3D grid, turning randomly and avoiding each other.',
    hint: 'Drag to spin, scroll to zoom, double-click to start over.',
  },
  {
    id: 'synthwave', title: 'Synthwave', exe: 'Outrun.exe', origin: 'new', webgl: true,
    blurb: 'Endless flight over procedurally generated Perlin-noise mountains toward a striped retro sun.',
    hint: 'Mouse X steers, mouse Y sets the speed.',
  },
  {
    id: 'julia', title: 'Julia Explorer', exe: 'Julia.exe', origin: 'new', webgl: true,
    blurb: 'Real-time Julia sets rendered on the GPU with a fragment shader. Every point of the plane is a different fractal.',
    hint: 'Move to change c, scroll to zoom, click to freeze, M for Mandelbrot.',
  },
  {
    id: 'epicycles', title: 'Fourier Epicycles', exe: 'Fourier.exe', origin: 'new',
    blurb: 'Draw any closed shape and a discrete Fourier transform rebuilds it from a chain of spinning circles.',
    hint: 'Draw a shape with the mouse, then let go.',
  },
  {
    id: 'life', title: 'Game of Life', exe: 'Life.exe', origin: 'new',
    blurb: "Conway's Game of Life on a wrapping grid, coloured by cell age. A universal computer hiding in four rules.",
    hint: 'Draw cells. Space pauses, R randomises, C clears.',
  },
  {
    id: 'pendulum', title: 'Double Pendulum', exe: 'Chaos.exe', origin: 'new',
    blurb: 'Three double pendulums that start a hair apart and quickly disagree. A small demonstration of chaos.',
    hint: 'Click to restart from a new angle.',
  },
  {
    id: 'lorenz', title: 'Lorenz Attractor', exe: 'Lorenz.exe', origin: 'new',
    blurb: "Edward Lorenz's butterfly: three coupled differential equations that never repeat, integrated live and drawn in 3D.",
    hint: 'Drag to orbit, scroll to zoom.',
  },
  {
    id: 'doom-fire', title: 'Doom Fire', exe: 'Fire.exe', origin: 'new',
    blurb: 'The fire effect from the PlayStation port of DOOM: a cellular automaton and a 37-colour palette.',
    hint: 'Mouse X adds wind, click to toggle the flame.',
  },
  {
    id: 'starfield', title: 'Starfield', exe: 'Starfld.exe', origin: 'new',
    blurb: 'Warp-speed starfield, the screen saver that came free with every 90s PC, now with a throttle.',
    hint: 'Mouse X/Y steers, hold the button for warp.',
  },
  {
    id: 'mystify', title: 'Mystify', exe: 'Mystify.exe', origin: 'new',
    blurb: 'Two bouncing polygons trailing colour-shifting echoes. Hypnotic, as intended.',
    hint: 'Click to shuffle.',
  },
];

export const getSketch = (id) => sketches.find((s) => s.id === id);
