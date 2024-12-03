// TODO: introduce oop - ghost, grid, user presence, sound (used by ghost)

// ghost vars - draw
let y = 0;
let floatSpeed = 1;
let floatRange = 20;
let baseY;
let mouthSize = 0;
let opacity = 255;
let isVisible = true;

// ghost vars - move
let currentCell = { x: 0, y: 0 };
let position;
let velocity;               // aka speed
let acceleration;
let topSpeed = 6;
let lastMoveTime = 0;
let moveInterval = 3000;    // move every 3 seconds

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
let gridSize = 6;
let cellSize;

// user presence vars
let waveRadius = 0;
let waveGrowing = true;
let mouseCell;
let waveSpeed = 1;
let maxWaveRadius;
let colorShift = 0;

function setup() {
  createCanvas(600, 600);

  // un-set mouse positions until user moves mouse
  mouseX = undefined;
  mouseY = undefined;

  cellSize = width / gridSize;
  maxWaveRadius = cellSize * 0.75;  // wave fills most of cell but not overflow
  baseY = cellSize / 2;
  y = baseY;

  // initialize starting cell
  currentCell = {
    x: floor(random(gridSize)),
    y: floor(random(gridSize))
  };

  // initialize vectors for movement
  position = getCellCenter(currentCell, cellSize);
  velocity = createVector(0, 0);
  acceleration = createVector(0, 0);

  try {
    setupSound();
    soundEnabled = true;
  } catch (e) {
    console.log(`p5.sound failed to load: ${e}`);
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
  background(30);  // like a dark charcoal

  drawGrid();
  drawUserPresence();

  let timeSinceMove = millis() - lastMoveTime;
  // start fading out halfway through the interval
  if (timeSinceMove > moveInterval / 2) {
    opacity = map(timeSinceMove, moveInterval / 2, moveInterval, 255, 0);
    isVisible = opacity > 0;
  } else {
    opacity = 255;
    isVisible = true;
    isBooPlaying = false;
  }

  if (timeSinceMove > moveInterval) {
    moveGhostToNewCell();
    lastMoveTime = millis();
    opacity = 255;
    if (!isBooPlaying) {
      playBoo();
      isBooPlaying = true;
    }
  }

  if (isVisible && mouseIsInGrid()) moveGhostTowardsMouse();

  // calculate floating animation
  let floatingY = sin(frameCount * 0.05) * floatRange;

  // draw ghost at current position
  drawGhost(position.x, position.y + floatingY);

  // update color shift for magical effect
  colorShift += 0.05;

  drawInstructions();
}

function drawGrid() {
  stroke(200);
  strokeWeight(1);
  for (let i = 0; i <= gridSize; i++) {
    line(i * cellSize, 0, i * cellSize, height);
    line(0, i * cellSize, width, i * cellSize);
  }
}

function drawUserPresence() {
  // update mouse cell position
  mouseCell = {
    x: floor(mouseX / cellSize),
    y: floor(mouseY / cellSize)
  };

  // update wave radius
  if (waveGrowing) {
    waveRadius += waveSpeed;
  } else {
    waveRadius -= waveSpeed;
  }

  // reverse the growing direction at limits
  if (waveRadius > maxWaveRadius || waveRadius < 0) {
    waveGrowing = !waveGrowing;
  }

  drawMagicalEffect();
}

function drawMagicalEffect() {
  // only draw if mouse is within grid
  if (mouseIsInGrid()) {
    // get center of current mouse cell
    let cellCenter = getCellCenter(mouseCell, cellSize);

    // draw the magical glow
    drawMagicalGlow(cellCenter.x, cellCenter.y, waveRadius);

    // draw the magical core
    drawMagicalCore(cellCenter.x, cellCenter.y);
  }
}

function drawMagicalGlow(x, y, r) {
  // draw the glowing magical wave effect

  let alpha = map(r, 0, cellSize * 0.75, 255, 0);  // fading glow effect
  let waveColor = color(204 + sin(colorShift) * 50, 255, 204 + sin(colorShift) * 50, alpha);

  push();
  noFill();
  stroke(waveColor);
  strokeWeight(5);
  ellipse(x, y, r * 2, r * 2);  // outer magical wave
  pop();
}

function drawMagicalCore(x, y) {
  // draw the core or center of the magical wave

  fill(255, 255, 255, 180); // bright white core
  noStroke();
  ellipse(x, y, 30, 30);  // small core at the center
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
  ellipse(0, 15, mouthSize, mouthSize);

  // add small white highlight in mouth
  fill(255, opacity * 0.8);
  circle(0, 12, mouthSize/6);

  pop();
}

function drawInstructions() {
  push();
  fill(0, 180);  // semi-transparent black
  noStroke();
  rectMode(CENTER);
  rect(width / 2, height - 20, 340, 30);

  fill(255);
  noStroke();
  textSize(16);
  textAlign(CENTER);
  textStyle(BOLD);
  text('Lure the \'ghost\' with your mouse!', width / 2, height - 20);
  pop();
}

function moveGhostToNewCell() {
  let newX, newY;

  // make sure we never appear in the same cell twice in a row
  do {
    newX = floor(random(gridSize));
    newY = floor(random(gridSize));
  } while (newX === currentCell.x && newY === currentCell.y);

  currentCell.x = newX;
  currentCell.y = newY;

  // reset position to center of new cell
  position = getCellCenter(currentCell, cellSize);

  // reset velocity after teleport
  velocity = createVector(0, 0);
}

function moveGhostTowardsMouse() {
  // create vector pointing to center of mouse cell
  let mouseCenter = getCellCenter(mouseCell, cellSize);

  let dir = p5.Vector.sub(mouseCenter, position);

  // set magnitude of acceleration (normalize then scale)
  dir.setMag(0.2);

  // accelerate!
  acceleration = dir;
  velocity.add(acceleration);
  velocity.limit(topSpeed);
  position.add(velocity);
}

function playBoo() {
  if (!soundEnabled) return;

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

function mouseIsInGrid() {
  return mouseCell.x >= 0 && mouseCell.x < gridSize &&
    mouseCell.y >= 0 && mouseCell.y < gridSize
}

function getCellCenter(cell, cellSize) {
  // converts a grid cell position to the center point coordinates of that cell
  // also considered naming this gridToWorldPosition

  return createVector(
    cell.x * cellSize + cellSize / 2,
    cell.y * cellSize + cellSize / 2
  );
}
