// Yellow Star Catcher Game Logic (fixed version)
const STAR_COUNT = 5;
const STAR_RADIUS = 32;
const MIN_DISTANCE = 86;
const COLORS = { yellow: "#FFD600", white: "#FFFFFF" };

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const notificationEl = document.getElementById('notification');
const gameHeaderEl = document.getElementById('game-header');
gameHeaderEl.textContent = "Click on the yellow star";
let stars = [];
let yellowIdx = 0;
let score = 0;
let animationId;

function resizeCanvas() {
  // Make canvas a perfect square
  const dpr = window.devicePixelRatio || 1;
  let parent = canvas.parentElement;
  let maxWidth = parent ? parent.offsetWidth : window.innerWidth;
  let maxHeight = window.innerHeight - 160; // Leave space for header and score

  // Use the smaller dimension to make a perfect square
  let size = Math.min(maxWidth * 0.94, maxHeight, 500);

  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  // Regenerate stars after resize
  if (stars.length > 0) {
    generateStars();
  }
}

window.addEventListener('resize', resizeCanvas);

function randInRange(a, b) {
  return Math.random() * (b - a) + a;
}

function generateStars() {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width;
  const height = canvas.height;
  let margin = STAR_RADIUS * dpr * 1.5;

  stars = [];
  let attempt = 0;
  while (stars.length < STAR_COUNT && attempt < 400) {
    let x = randInRange(margin, width - margin);
    let y = randInRange(margin, height - margin);
    let tooClose = stars.some(s => {
      let dx = s.x - x, dy = s.y - y;
      return Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE * dpr;
    });
    if (!tooClose) stars.push({ x, y, opacity: 1 });
    attempt++;
  }

  // fallback pad
  while (stars.length < STAR_COUNT) {
    let x = randInRange(margin, width - margin);
    let y = randInRange(margin, height - margin);
    stars.push({ x, y, opacity: 1 });
  }
  yellowIdx = Math.floor(Math.random() * STAR_COUNT);
}

function drawStar(ctx, x, y, r, color, opacity = 1) {
  // Beautiful 5-pointed star with animation effects
  const time = Date.now() * 0.001; // Current time in seconds
  const isYellow = color === COLORS.yellow;

  // Animation effects
  const pulse = isYellow ? Math.sin(time * 3) * 0.15 + 1 : Math.sin(time * 1.5) * 0.07 + 1;
  const glowIntensity = isYellow ? 18 + Math.sin(time * 5) * 8 : 8 + Math.sin(time * 2.5) * 3;

  // Apply animations
  const animatedRadius = r * pulse;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  let rot = Math.PI / 2 * 3;
  let spikes = 5;
  let step = Math.PI / spikes;

  for (let i = 0; i < spikes; i++) {
    let sx = x + Math.cos(rot) * animatedRadius;
    let sy = y + Math.sin(rot) * animatedRadius;
    ctx.lineTo(sx, sy);
    rot += step;
    sx = x + Math.cos(rot) * (animatedRadius * 0.46);
    sy = y + Math.sin(rot) * (animatedRadius * 0.46);
    ctx.lineTo(sx, sy);
    rot += step;
  }

  ctx.closePath();

  // Enhanced glow effect
  ctx.shadowColor = isYellow ?
    "rgba(255, 214, 0, 1)" :
    "rgba(255, 255, 255, 0.8)";
  ctx.shadowBlur = glowIntensity;
  ctx.fillStyle = color;
  ctx.fill();

  // Star outline
  ctx.strokeStyle = isYellow ? COLORS.yellow : COLORS.white;
  ctx.lineWidth = isYellow ? 3 : 2;
  ctx.stroke();
  ctx.restore();
}

function draw() {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update and draw particles
  updateParticles();
  drawParticles();

  // Draw stars
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const color = (i === yellowIdx) ? COLORS.yellow : COLORS.white;
    drawStar(
      ctx,
      star.x,
      star.y,
      STAR_RADIUS * dpr,
      color,
      star.opacity
    );
  }

  // Request next animation frame to create continuous rendering loop
  animationId = requestAnimationFrame(draw);
}

function getEventPos(e) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  let x, y;
  if (e.touches && e.touches[0]) {
    x = (e.touches[0].clientX - rect.left) * dpr;
    y = (e.touches[0].clientY - rect.top) * dpr;
  } else {
    x = (e.clientX - rect.left) * dpr;
    y = (e.clientY - rect.top) * dpr;
  }
  return { x, y };
}

function handleInteraction(e) {
  e.preventDefault();
  if (!stars.length) return;
  const { x, y } = getEventPos(e);
  for (let i = 0; i < stars.length; i++) {
    const dx = x - stars[i].x, dy = y - stars[i].y;
    const dpr = window.devicePixelRatio || 1;
    if (dx * dx + dy * dy < (STAR_RADIUS * dpr) * (STAR_RADIUS * dpr)) {
      if (i === yellowIdx) {
        score++;
        scoreEl.textContent = score;
        createParticles(stars[i].x, stars[i].y);
        showNotification("Nice! That's the yellow star!", "#FFD600");
        setTimeout(() => {
          generateStars();
        }, 500);
      } else {
        createParticles(stars[i].x, stars[i].y, false);
        showNotification("Oops, wrong star!", "#FF4773");
      }
      return;
    }
  }
}

function showNotification(msg, color) {
  // Determine emoji based on message content
  let emoji = '';
  if (msg.includes('Nice')) {
    emoji = '\ud83c\udf1f ';
  } else if (msg.includes('Oops')) {
    emoji = '\u274c ';
  } else {
    emoji = '\u2728 ';
  }
  
  // Update the regular notification element below the score
  notificationEl.textContent = emoji + msg;
  notificationEl.style.opacity = "1";
  notificationEl.style.color = color || "#FFD600";
  setTimeout(() => { notificationEl.style.opacity = "0"; }, 1500);
}

// Particle system
let particles = [];

function createParticles(x, y, isSuccess = true) {
  const dpr = window.devicePixelRatio || 1;
  const count = isSuccess ? 24 : 12;
  const particleColor = isSuccess ? COLORS.yellow : "#FF4773";

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 * dpr + 2 * dpr;
    const size = Math.random() * 4 * dpr + 2 * dpr;
    const life = Math.random() * 20 + 20;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      color: particleColor,
      life,
      maxLife: life,
      opacity: 1
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.vy += 0.1; // slight gravity
    p.life--;
    p.opacity = p.life / p.maxLife;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 2;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

canvas.addEventListener('pointerdown', handleInteraction, { passive: false });
canvas.addEventListener('touchstart', handleInteraction, { passive: false });

// Initialize the game
function initGame() {
  resizeCanvas(); // This will set up canvas dimensions
  generateStars(); // Generate initial stars
  draw(); // Start the animation loop
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// Change stars position every 6 seconds
setInterval(() => {
  generateStars();
}, 6000);
