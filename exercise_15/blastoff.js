let g_rocket;
let g_cameraOffset;

function setup() {
  createCanvas(300, 300);

  const initPosition = createVector(width / 2, height / 2);
  const initVelocity = createVector(1, -1);  // up and to the right

  g_rocket = new Rocket(initPosition, initVelocity);
  g_cameraOffset = createVector(0, 0);
}

function draw() {
  background(0);

  // calculate camera offset to keep rocket centered
  g_cameraOffset.x = width / 2 - g_rocket.position.x;
  g_cameraOffset.y = height / 2 - g_rocket.position.y;

  // apply camera transformation
  push();
  translate(g_cameraOffset.x, g_cameraOffset.y);

  drawStars();
  drawStation();

  g_rocket.update();
  g_rocket.show();
  pop();

  fill(255);
  noStroke();
  textSize(12);
  text(`Position: ${floor(g_rocket.position.x)}, ${floor(g_rocket.position.y)}\nVelocity: ${round(g_rocket.velocity.x, 1).toFixed(1)}, ${round(g_rocket.velocity.y, 1).toFixed(1)}`, 10, 20);
}

function keyPressed() {
  // press SPACE to pause/unpause
  if (key === ' ') {
    if (g_rocket.velocity.x !== 0 || g_rocket.velocity.y !== 0) {
      // TODO: save last rotation too
      g_rocket.lastVelocity = g_rocket.velocity;
      g_rocket.velocity = createVector(0, 0);
    } else {
      g_rocket.velocity = g_rocket.lastVelocity;
    }
  }
}

class Rocket {
  constructor(position, velocity) {
    this.position = position;
    this.velocity = velocity;
    this.acceleration = 0.2;
    this.maxVelocity = 10;

    this.lastVelocity = createVector(0, 0);
  }

  update() {
    // handle keyboard input
    if (keyIsDown(LEFT_ARROW)) {
      this.velocity.x -= this.acceleration;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.velocity.x += this.acceleration;
    }
    if (keyIsDown(UP_ARROW)) {
      this.velocity.y -= this.acceleration;
    }
    if (keyIsDown(DOWN_ARROW)) {
      this.velocity.y += this.acceleration;
    }

    // limit speed
    if (this.velocity.mag() > this.maxVelocity) {
      this.velocity.setMag(this.maxVelocity);
    }

    // update position
    this.position.add(this.velocity);
  }

  show() {
    push();
    translate(this.position.x, this.position.y);

    // rotate rocket based on movement direction
    if (this.velocity.mag() > 0.1) {
      rotate(this.velocity.heading() + PI/4);
    }

    textSize(36);
    textAlign(CENTER, CENTER);
    fill(255);
    text('🚀', 0, 0);
    pop();
  }
}

function drawStation() {
  push();
  fill(255, 255, 255, 180);
  noStroke();
  ellipse(width / 2, height / 2, 100, 100);
  pop();
}

function drawStars() {
  // draw some reference stars in the background
  // calculate visible area bounds based on rocket position
  let startX = floor((g_rocket.position.x - width / 2) / 50) * 50 - 50;
  let endX = startX + width + 100;
  let startY = floor((g_rocket.position.y - height / 2) / 50) * 50 - 50;
  let endY = startY + height + 100;

  // draw stars in visible area
  for (let x = startX; x < endX; x += 50) {
    for (let y = startY; y < endY; y += 50) {
      // use position to generate consistent star variations
      let starSeed = abs(x * 10000 + y);
      let starType = starSeed % 3;
      fill(255);
      textSize(8);

      // different star characters for variety
      if (starType === 0) {
        text('✨', x, y);
      } else if (starType === 1) {
        text('⭐', x, y);
      } else {
        text('★', x, y);
      }
    }
  }
}
