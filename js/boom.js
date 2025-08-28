/* ------------------------------------------------------------------ */
/* 0. 기본 설정                                                       */
/* ------------------------------------------------------------------ */
const canvas = document.querySelector('#boom');
const ctx = canvas.getContext('2d', { alpha: true });

let dpr = 1;
let wCSS = 0,
  hCSS = 0;

function fitCanvas() {
  dpr = Math.max(1, window.devicePixelRatio || 1);
  wCSS = window.innerWidth;
  hCSS = window.innerHeight;

  canvas.width = Math.floor(wCSS * dpr);
  canvas.height = Math.floor(hCSS * dpr);
  canvas.style.width = `${wCSS}px`;
  canvas.style.height = `${hCSS}px`;

  // 1 그리기 단위 = 1 CSS px 이도록 변환
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', () => {
  fitCanvas();
  // 리사이즈 시 현재 프레임을 다시 그릴 수 있도록 화면만 정리
  ctx.clearRect(0, 0, wCSS, hCSS);

  draw(currentRadius);
});

/* ------------------------------------------------------------------ */
/* 1. born circle                                                       */
/* ------------------------------------------------------------------ */
const TARGET = 25; // 최종 반지름(px)
const DURATION = 1200; // 애니메이션 시간(ms)
let currentRadius = 0;
let bornStart = null;
let isBorning = false;

export function borning() {
  if (isBorning) return;
  isBorning = true;
  requestAnimationFrame(animateBorning);
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function animateBorning(ts) {
  if (!bornStart) bornStart = ts;
  const u = Math.min((ts - bornStart) / DURATION, 1); // 0→1
  const r = TARGET * easeOutCubic(u);
  draw(r);
  if (u < 1) requestAnimationFrame(animateBorning);
}

/* ------------------------------------------------------------------ */
/* 2. boom                                                       */
/* ------------------------------------------------------------------ */
function easyInPower(t) {
  return Math.pow(t, 5);
}

let boomStart = null;
const boomDur = 2000;
const THE_RAGE_OF_GOD_RADIUS = Math.max(window.innerWidth, window.innerHeight);

export function booom(ts) {
  if (!boomStart) boomStart = ts;
  const raw = Math.min((ts - boomStart) / boomDur, 1);
  const p = easyInPower(raw);
  const r = TARGET + THE_RAGE_OF_GOD_RADIUS * p;

  draw(r);

  if (raw < 1) {
    requestAnimationFrame(booom);
  } else {
    setTimeout(() => {
      document.querySelector('#epilogue').classList.add('show');
    }, 1000);
  }
}

/* ------------------------------------------------------------------ */
/* 3. label boom                                                      */
/* ------------------------------------------------------------------ */
let labelBoomStart = null;
const labelBoomDur = 1200;

export function labelBoom(ts) {
  const labels = document.querySelectorAll('#list span label');
  if (labels.length === 0) {
    requestAnimationFrame(labelBoom);
    return;
  }

  if (!labelBoomStart) labelBoomStart = ts;
  const raw = Math.min((ts - labelBoomStart) / labelBoomDur, 1);
  const p = easyInPower(raw);
  const x = -43 + 2000 * p;

  labels.forEach((el) => {
    el.style.transform = `translate(${x}px, -3px)`;
  });

  if (raw < 1) requestAnimationFrame(labelBoom);
}

/* ------------------------------------------------------------------ */
/* 4. 메인 랜더                                                      */
/* ------------------------------------------------------------------ */

function draw(radius) {
  currentRadius = radius;
  ctx.clearRect(0, 0, wCSS, hCSS);
  ctx.beginPath();
  ctx.arc(wCSS / 2, hCSS / 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffffff'; // 필요하면 색상 변경 가능
  ctx.fill();
}
