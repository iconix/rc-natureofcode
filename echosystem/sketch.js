// ghost vars - draw
let y = 0;
let floatSpeed = 1;
let floatRange = 20;
let baseY;
let mouthSize = 0;
let opacity = 255;

// ghost vars - move
let currentCell = { x: 0, y: 0 };
let lastMoveTime = 0;
let moveInterval = 2000;    // move every 2 seconds

// ghost vars - boo!
let osc, amp, reverb;
let soundEnabled = false;
let isBooPlaying = false;
const reverbTime = 1;       // in seconds
const reverbDecay = 0.5;    // how quickly reverb fades out (0-1)
const durationMs = 1000;    // note: total duration = durationMs + ((reverbTime * (1 - reverbDecay)) * 1000)
const frameMs = 16;         // ~60fps
const startFreq = 440;      // A4 note (high pitch), in hz
const endFreq = 220;        // A3 note (low pitch), in hz
const baseAmplitude = 0.5;
const wobbleSpeed = 0.1;
const wobbleDepth = 0.5;
const stopFadeTime = 0.1;

// grid vars
let gridSize = 5;
let cellSize;

function setup() {
  createCanvas(400, 400);

  cellSize = width / gridSize;

  baseY = cellSize / 2;
  y = baseY;

  currentCell = {
    x: floor(random(gridSize)),
    y: floor(random(gridSize))
  };

  try {
    setupSound();
    soundEnabled = true;
  } catch (e) {
    console.log(`p5.sound failed to load: ${e}`)
  }
}

function setupSound() {
  // create oscillator for generating a pure, smooth tone based on sine wave
  osc = new p5.Oscillator('sine');

  // create amplitude analyzer to monitor volume
  amp = new p5.Amplitude();

  // create revert effect for ghostly echo/ambience
  reverb = new p5.Reverb();

  // disconnect direct output and route through reverb
  osc.disconnect();
  osc.connect(reverb);

  // make sound fade out gradually like it's in a large, haunted space
  reverb.process(osc, reverbTime, reverbDecay);
}

function draw() {
  background(220);
  drawGrid();

  let timeSinceMove = millis() - lastMoveTime;
  // start fading out halfway through the interval
  if (timeSinceMove > moveInterval / 2) {
    opacity = map(timeSinceMove, moveInterval / 2, moveInterval, 255, 0);
  } else {
    opacity = 255;
    isBooPlaying = false;
  }

  if (timeSinceMove > moveInterval) {
    moveGhost();
    lastMoveTime = millis();
    opacity = 255;
    if (!isBooPlaying) {
      playBoo();
      isBooPlaying = true;
    }
  }

  // calculate floating position (for animation)
  let floatingY = sin(frameCount * 0.05) * floatRange;
  drawGhost(currentCell.x * cellSize + cellSize/2,
            currentCell.y * cellSize + cellSize/2 + floatingY);
}

function drawGrid() {
  stroke(200);
  strokeWeight(1);
  for (let i = 0; i <= gridSize; i++) {
    line(i * cellSize, 0, i * cellSize, height);
    line(0, i * cellSize, width, i * cellSize);
  }
}

function drawGhost(x, y) {
  // mouth animation for 'booo' effect
  mouthSize = 15 + sin(frameCount * 0.1) * 10;

  // draw ghost
  push();
  translate(x, y);
  let ghostScale = cellSize / 200;  // make ghost smaller to fit cell with some padding
  scale(ghostScale);

  // body (main circle)
  fill(255, opacity);
  noStroke();
  circle(0, 0, 100);

  // bottom rectangle part
  rect(-50, 0, 100, 50);

  // wavy bottom
  beginShape();
  vertex(-50, 50);
  bezierVertex(-30, 70, -10, 60, 0, 70);
  bezierVertex(10, 60, 30, 70, 50, 50);
  endShape(CLOSE);

  // eyes
  fill(0, opacity);
  circle(-20, -10, 15);
  circle(20, -10, 15);

  // booing mouth
  fill(0, opacity);
  noStroke();
  ellipse(0, 15, mouthSize, mouthSize);

  // add small white highlight in mouth
  fill(255, opacity * 0.8);
  circle(0, 12, mouthSize/6);

  pop();
}

function moveGhost() {
  let newX, newY;

  // make sure we never appear in the same cell twice in a row
  do {
    newX = floor(random(gridSize));
    newY = floor(random(gridSize));
  } while (newX == currentCell.x && newY == currentCell.y);

  currentCell.x = newX;
  currentCell.y = newY;
}

function playBoo() {
  if (!soundEnabled) {
    return;
  }

  osc.start();
  let time = 0;

  // create sliding pitch effect with amplitude and pitch modulation
  // sound updates every frameMs
  let interval = setInterval(() => {
    let progress = time / durationMs;

    // non-linear (square root) pitch descent
    let currentPitch = startFreq + (endFreq - startFreq) * Math.pow(progress, 0.5);
    osc.freq(currentPitch);

    // amplitude descent based on 3 components:
    // - base amplitude of 0.5
    // - linear fadeout
    // - 'wobble' effect with sine wave
    osc.amp(baseAmplitude * (1 - progress) * (1 + wobbleDepth * Math.sin(time * wobbleSpeed)));

    time += frameMs;
    if (time > durationMs) {
      // after duration, stop oscillator with a 0.1s fadeout
      clearInterval(interval);
      osc.stop(stopFadeTime);
    }
  }, frameMs);
}
