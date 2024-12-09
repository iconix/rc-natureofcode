let balloon;
let toggleButton;

let g_environments;

class Balloon {
    constructor(x, y) {
        // position and motion
        this.position = createVector(x, y);
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);
        this.restitution = 0.25; // make bounces realistic by reducing velocity after impact

        this.environment = g_environments.earth;
        this.windOffset = 0;
        this.windTime = 0;

        // physical properties
        this.textSize = 40;
        this.radius = textSize() / 2;
        this.volume = (4/3) * PI * Math.pow(this.radius, 3);  // m³ ('converting' pixels to meters)
        this.mass = this.environment.heliumDensity * this.volume;  // kg (combined mass of balloon and helium)
    }

    updateEnvironment(envType) {
        this.environment = g_environments[toCamelCase(envType)];
    }

    updateWind() {
        // update both noise dimensions for more complex wind patterns
        this.windOffset += 0.02;  // spatial variation
        this.windTime += 0.01;    // temporal variation

        // combine two perlin noise dimensions for more interesting wind patterns
        const spatialNoise = noise(this.windOffset) - 0.5;
        const temporalNoise = noise(this.windTime, 100) - 0.5;

        return this.environment.windForce +
            (spatialNoise + temporalNoise) * this.environment.windVariability;
    }

    applyForces() {
        // buoyant force (F = ρ * V * g)
        const buoyantForce = createVector(0, -this.environment.airDensity * this.volume * this.environment.gravity);

        // gravity (F = m * g)
        const gravity = createVector(0, this.mass * this.environment.gravity);

        // wind force
        let windForce = createVector(0, 0);
        if (this.environment.windForce !== 0) {
            const wind = this.updateWind();
            windForce = createVector(wind * this.environment.airDensity * 1000, 0);
        }

        // apply forces (F = ma)
        const netForce = p5.Vector.add(buoyantForce, gravity);
        netForce.add(windForce);
        const acceleration = p5.Vector.div(netForce, this.mass);
        this.acceleration.add(acceleration);
    }

    // updating position using time-based movement (semi-implicit euler integration)
    update() {
        balloon.applyForces();

        this.velocity.add(p5.Vector.mult(this.acceleration, deltaTime/1000));
        this.position.add(p5.Vector.mult(this.velocity, deltaTime / 1000));

        // reset acceleration
        this.acceleration.mult(0);

        this.checkEdges();
    }

    show() {
        push();
        textSize(balloon.textSize);
        textAlign(CENTER, CENTER);
        text('🎈', this.position.x, this.position.y);
        pop();
    }

    checkEdges() {
        // bounce for winds
        if (this.position.x > width - this.radius) {
            this.velocity.x *= -1;
            this.position.x = width - this.radius;
        } else if (this.position.x < this.radius) {
            this.velocity.x *= -1;
            this.position.x = this.radius;
        }

        // bounce for top and bottom
        if (this.position.y - this.radius < 0) {
            this.velocity.y *= -this.restitution;
            this.position.y = this.radius;
        }
        if (this.position.y + this.radius > height) {
            this.velocity.y *= -this.restitution;
            this.position.y = height - this.radius;
        }
    }

    getButtonText() {
        return '🪐';
    }
}

function setup() {
    createCanvas(400, 400);

    g_environments = {
        earth: {
            name: 'Earth',
            nextEnv: 'Lunar Base',
            gravity: 9.81,                      // m/s²
            airDensity: 1.225,                  // kg/m³
            heliumDensity: 0.1786,              // kg/m³
            bgColor: color(135, 206, 235),      // sky blue
            textColor: color(50),
            windForce: -0.5,                      // light base force
            windVariability: 1                  // small variations
        },
        lunarBase: {
            name: 'Lunar Base',
            nextEnv: 'Jupiter',
            gravity: 1.62,                      // m/s²
            airDensity: 0.5,                    // kg/m³ - artificial atmosphere at lower pressure than earth
            heliumDensity: 0.074,               // kg/m³ - proportionally reduced
            bgColor: color(20, 20, 40),         // dark blue-grey
            textColor: color(255)
        },
        jupiter: {
            name: 'Jupiter Stratosphere',
            nextEnv: 'Mars',
            gravity: 24.79,                     // m/s² - intense
            airDensity: 0.1,                    // kg/m³ - very thin atmosphere
            heliumDensity: 0.015,               // kg/m³
            bgColor: color(255, 222, 173),      // light orange
            textColor: color(233, 150, 122),    // dark salmon
            // very dynamic environment
            windForce: 50,                      // strong base force
            windVariability: 8,                 // high variability
        },
        mars: {
            name: 'Mars',
            nextEnv: 'Earth',
            gravity: 3.72,                      // m/s²
            airDensity: 0.020,                  // kg/m³ - very thin atmosphere
            heliumDensity: 0.003,               // kg/m³
            bgColor: color(183, 65, 14),        // rusty red-orange
            textColor: color(50),               // dark grey
        },
    };

    balloon = new Balloon(width / 2, height * 0.75);

    // create toggle button
    toggleButton = createButton(balloon.getButtonText());
    toggleButton.position(10, 10);
    toggleButton.mousePressed(toggleEnvironment);
    toggleButton.addClass('env-button');
  }

function draw() {
    background(balloon.environment.bgColor);
    drawEnvInfo();

    balloon.update();
    balloon.show();
}

function drawEnvInfo() {
    const env = balloon.environment;

    fill(env.textColor);
    noStroke();
    textSize(12);
    textAlign(RIGHT, TOP);
    text(`Environment: ${env.name}
        Gravity: ${env.gravity.toFixed(2)} m/s²
        Air Density: ${env.airDensity.toFixed(4)} kg/m³
        Helium Density: ${env.heliumDensity.toFixed(4)} kg/m³
        Wind Force: ${env.windForce ? (env.windForce > 20 ? 'Strong' : 'Light') : 'None'}`, width - 10, 10);
}

function toggleEnvironment() {
    nextEnv = balloon.environment.nextEnv;
    balloon.updateEnvironment(nextEnv);
    toggleButton.html(balloon.getButtonText());

    // reset balloon velocity
    balloon.velocity = createVector(0, 0);
}

function toCamelCase(str) {
    const words = str.toLowerCase().split(/\s+/);
    return words.map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
}
