const canvas = document.querySelector('#canvasBar');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* ------------------------------------------------------------------ */
/* 1. intro                                                     */
/* ------------------------------------------------------------------ */
let introRunning = true;
let introRecH = 155;
let introTopY = 37.5;
let introBottomY = 37.5;
let introStartTime = null;

function intro() {
  setTimeout(
    () => document.querySelector('.clock-wrapper').classList.add('show'),
    500
  );
  requestAnimationFrame(animateIntro);
}

function animateIntro(ts) {
  if (!introStartTime) introStartTime = ts;
  const t = Math.min((ts - introStartTime) / 3000, 1);
  // 부드러운 ease-out
  const p = 1 - Math.pow(1 - t, 3);

  introTopY = 37.5 + (300 - 37.5) * p;
  introBottomY = 37.5 + (currentBarY - 37.5) * p; // currentBarY 초기값 300
  introRecH = 155 + (currentRecHeight - 155) * p;

  draw();

  if (t < 1) {
    requestAnimationFrame(animateIntro);
  } else {
    introRunning = false;
    introTopY = 300;
    introBottomY = currentBarY;
    introRecH = currentRecHeight;
    draw();
  }
}

/* ------------------------------------------------------------------ */
/* 2.                                                   */
/* ------------------------------------------------------------------ */

let currentAngle = 0;
let targetAngle = 0;
let isAnimating = false;

export function rotateBarsHorizontal() {
  if (!isAnimating) {
    isAnimating = true;

    targetAngle = Math.PI / 2;
    requestAnimationFrame(animateRotationPlus);
  }
}

export function rotateBarsDiagonal() {
  if (!isAnimating) {
    isAnimating = true;
    targetAngle = Math.PI / 4;
    requestAnimationFrame(animateRotationMinus);
  }
}

function animateRotationPlus() {
  const speed = 0.015;
  if (currentAngle < targetAngle) {
    currentAngle += speed;
    draw();
    requestAnimationFrame(animateRotationPlus);
  } else {
    currentAngle = targetAngle;
    draw();
    isAnimating = false;
  }
}

function animateRotationMinus() {
  const speed = 0.01;
  if (currentAngle > targetAngle) {
    currentAngle -= speed;
    draw();
    requestAnimationFrame(animateRotationMinus);
  } else {
    currentAngle = targetAngle;
    draw();
    isAnimating = false;
  }
}

let barColor = '#fff';
let colorPhase = 0; //0=idle, 1=white to blue, 2=blue to white
let colorTransitionStart = null;

export function triggerBarColorChange() {
  setTimeout(() => {
    colorPhase = 1;
    colorTransitionStart = performance.now();
    requestAnimationFrame(blueBlink);
  }, 2000);
}

function blueBlink(timestamp) {
  if (!colorTransitionStart) colorTransitionStart = timestamp;
  const elapsed = timestamp - colorTransitionStart;

  if (colorPhase === 1) {
    const progress = Math.min(elapsed / 500, 1);
    const r = 255 - (255 - 98) * progress;
    const g = 255 - (255 - 187) * progress;
    const b = 255 - (255 - 228) * progress;
    barColor = `rgb(${r}, ${g}, ${b})`;
    draw();

    if (progress < 1) {
      requestAnimationFrame(blueBlink);
    } else {
      colorPhase = 2;
      colorTransitionStart = performance.now();
      requestAnimationFrame(blueBlink);
    }
  } else if (colorPhase === 2) {
    const progress = Math.min(elapsed / 500, 1);
    const r = 98 + (255 - 98) * progress;
    const g = 187 + (255 - 187) * progress;
    const b = 228 + (255 - 228) * progress;
    barColor = `rgb(${r}, ${g}, ${b})`;
    draw();

    if (progress < 1) {
      requestAnimationFrame(blueBlink);
    } else {
      colorPhase = 0;
      colorTransitionStart = null;
    }
  }
}

//함수: if (localStorage key에 usename이 있다)
//{아래 바에 마우스 클릭이 감지 될 시에 사각형의 높이를 Math.max(vw/2, vh/2)으로 바꾸고,
//아래쪽 바의 + 300을 + 150으로, 높이를 Math.max(vw/2, vh/2)로 바꿔라}
canvas.addEventListener('click', inBarClick);

let isStretching = false;
let stretchStartTime = null;

let currentRecHeight = 680;
let targetRecHeight = Math.max(1.5 * canvas.width, 1.5 * canvas.height);
let currentBarY = 300;
let targetBarY = 150;
let currentBarHeight = 80;
let targetBarHeight = Math.max(canvas.width, canvas.height);

let isTopBarVisible = true;
let isBarVisible = true;

export function deleteBar() {
  isBarVisible = false;
  draw();
}

function inBarClick(event) {
  const username = localStorage.getItem('username');
  if (!username) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const dx = clickX - cx;
  const dy = clickY - cy;

  const angle = -currentAngle;
  const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle) + cx;
  const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle) + cy;

  const barX = canvas.width / 2 - 4.5;
  const barY = canvas.height / 2 - 40 + currentBarY;
  const barW = 9;
  const barH = currentBarHeight;

  const expand = 20;

  const inBar =
    rotatedX >= barX - expand &&
    rotatedX <= barX + barW + expand &&
    rotatedY >= barY - expand &&
    rotatedY <= barY + barH + expand;

  if (inBar && !isStretching) {
    isStretching = true;
    stretchStartTime = performance.now();
    requestAnimationFrame(animateStretch);
  }
}

function animateStretch(timestamp) {
  const elapsed = timestamp - stretchStartTime;
  const progress = Math.min(elapsed / 500, 1);

  currentRecHeight = 680 + (targetRecHeight - 680) * progress;
  currentBarY = 300 - (300 - targetBarY) * progress;
  currentBarHeight = 80 - (80 - targetBarHeight) * progress;

  draw();

  if (progress < 1) {
    requestAnimationFrame(animateStretch);
  } else {
    currentRecHeight = targetRecHeight;
    currentBarY = targetBarY;
    currentBarHeight = targetBarHeight;

    setTimeout(() => {
      stretchStartTime = performance.now();
      requestAnimationFrame(animateMoreStretch);
    }, 500);
  }
}

let extraBarHeight = null;

function animateMoreStretch(timestamp) {
  const elapsed = timestamp - stretchStartTime;
  const progress = Math.min(elapsed / 600, 1);

  extraBarHeight = 375 * progress;

  draw();

  if (progress < 1) {
    requestAnimationFrame(animateMoreStretch);
  } else {
    isTopBarVisible = false;
    extraBarHeight = 450;
    draw();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.translate(canvas.width / 2, canvas.height / 2);

  ctx.rotate(currentAngle);

  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  //사각형
  const gradient = ctx.createLinearGradient(
    canvas.width / 2 - 4.5 - 2,
    0,
    canvas.width,
    0
  );

  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.025, 'rgba(240, 240, 240, 1)');
  gradient.addColorStop(0.1, 'rgba(255, 255, 255, 1)');

  ctx.fillStyle = gradient;

  ctx.save();
  ctx.filter = 'blur(10px)';

  const rectH = introRunning ? introRecH : currentRecHeight;
  const rectY = introRunning
    ? canvas.height / 2 - rectH / 2
    : canvas.height / 2 - 40 - 300;

  ctx.fillRect(canvas.width / 2 - 4.5 - 2, rectY, canvas.width / 2, rectH);
  ctx.restore();

  // 바
  if (isBarVisible) {
    ctx.fillStyle = '#fff';

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 0;

    const radius = 4;

    if (isTopBarVisible) {
      const topY = canvas.height / 2 - 40 - (introRunning ? introTopY : 300);
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 4.5, topY, 9, 80, radius);
      ctx.fill();
    }

    ctx.fillStyle = barColor;
    const extra = extraBarHeight ?? 0;
    const bottomYParam = introRunning ? introBottomY : currentBarY;
    const bottomH = introRunning ? 80 : currentBarHeight;

    ctx.beginPath();
    ctx.roundRect(
      canvas.width / 2 - 4.5,
      canvas.height / 2 - 40 + bottomYParam - extra,
      9,
      bottomH,
      radius
    );
    ctx.fill();
  }
  ctx.restore();
}
draw();
intro();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});
