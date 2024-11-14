let g_droplets = [];

function setup() {
  createCanvas(400, 400);
  background(220);
}

function createSplatter(numDroplets, impactPoint) {
  let droplets = []

  const palette = createColorPalette(createPaintColor());
  // const color = {r: 237, g: 34, b: 93};  // p5.js pink!
  const color = palette.getColor();

  const innerSpread = impactPoint.diameter * 0.7;  // spread droplets closer to center
  const outerSpread = impactPoint.diameter * 1.2;  // spread droplets further from center
  const minDiameter = 2;

  for (let i = 0; i < numDroplets; i++) {
    // more droplets closer to center, fewer at edges
    const spread = random() < 0.7 ? innerSpread : outerSpread;

    // gaussian to create more natural-looking clustering
    const position = {
      x: randomGaussian(impactPoint.x, spread),
      y: randomGaussian(impactPoint.y, spread),
    };

    // pythagorean theorem!
    const distanceFromCenter = Math.sqrt(
      Math.pow(impactPoint.x - position.x, 2) +
      Math.pow(impactPoint.y - position.y, 2)
    );

    // smaller droplets as we get further from center
    // by remapping distance to a diameter range
    const maxDiameter = map(distanceFromCenter, 0, outerSpread * 1.5,
                            impactPoint.diameter * 0.4, impactPoint.diameter * 0.1);

    const diameter = random(minDiameter, maxDiameter);

    // add circular randomness to position as distance increases
    const angleJitter = map(distanceFromCenter, 0, outerSpread,
                            0, random(0, TWO_PI));
    const diameterJitter = random(-10, 10);

    position.x += cos(angleJitter) * diameterJitter;
    position.y += sin(angleJitter) * diameterJitter;

    droplets.push({
      position: position,
      diameter: diameter,
      color: color,
    });
  }

  return droplets;
}

/**
 * Generate a palette of related colors using normal distribution
 * @param {*} baseColor
 * @param {*} variance
 * @returns
 */
function createColorPalette(baseColor, variance = 20) {
  return {
    // create a function that returns slightly different colors from the base
    getColor: () => ({
      r: constrain(randomGaussian(baseColor.r, variance), 0, 255),
      g: constrain(randomGaussian(baseColor.g, variance), 0, 255),
      b: constrain(randomGaussian(baseColor.b, variance), 0, 255)
    }),
    // store base color for reference
    baseColor: baseColor
  };
}


/**
 * Create a random base color that is vibrant like paint.
 * Ensure at least one color channel is bright (> 200)
 * and at least one is dark (< 100), for vibrancy.
 */
function createPaintColor() {
  let r = random(255);
  let g = random(255);
  let b = random(255);

  // bright channel
  const brightest = max(r, g, b);
  if (brightest < 200) {
    const brightChannel = floor(random(3));
    if (brightChannel === 0) r = random(220, 255);
    else if (brightChannel === 1) g = random(220, 255);
    else b = random(220, 255);
  }

  // dark channel
  const darkest = min(r, g, b);
  if (darkest > 100) {
    const darkChannel = floor(random(3));
    if (darkChannel === 0) r = random(0, 35);
    else if (darkChannel === 1) g = random(0, 35);
    else b = random(0, 35);
  }

  // add some randomness to prevent colors from being too systematic
  colorVariance = 20;  // percentage
  const maxShift = (255 * colorVariance) / 100;
  r = constrain(r + random(-maxShift, maxShift), 0, 255);
  g = constrain(g + random(-maxShift, maxShift), 0, 255);
  b = constrain(b + random(-maxShift, maxShift), 0, 255);

  return {r, g, b};
}

/**
 * Define where paint hits the surface
 */
function createRandomImpactPoint() {
  return {
    diameter: random(30, 50),
    x: random(width),
    y: random(height)
  };
}

function drawDroplet(droplet) {
  const { diameter, position, color } = droplet;

  fill(color.r, color.g, color.b);
  noStroke();
  circle(position.x, position.y, diameter);
}

function drawSplatter() {
  g_droplets.forEach(drawDroplet);
}

function draw() {
  const fps = 60;
  frameRate(fps);

  const pps = 5;  // "paint per second"

  // paint every {pps} seconds, starting at frame {pps}
  if (frameCount % (fps * pps) === Math.ceil(pps)) {
    const numDroplets = 1000;
    const impactPoint = createRandomImpactPoint();
    const newDroplets = createSplatter(numDroplets, impactPoint);

    g_droplets = [...g_droplets, ...newDroplets];

    drawSplatter();
  }
}
