/* ------------------------------------------------------------------ */
/* 0. 기본 설정                                                       */
/* ------------------------------------------------------------------ */
const canvas = document.getElementById('canvasBarToDo');
const ctx = canvas.getContext('2d');

/* ------------------------------------------------------------------ */
/* 1. 상태 변수                                                      */
/* ------------------------------------------------------------------ */
const BAR_W = 9; // 바 너비
const BAR_R = 4; // 모서리 반지름
const MAX_LEN = 180; // flower 길이
const FINAL_LEN = 47; // 최종 길이랑 차이 있긴한데 계산식 못만들게써잉
const N_BARS = 12; // 바 개수 (360/30 = 12)
const DURATION = 1500; // 애니메이션 길이(ms)
let len = MAX_LEN;
let barTopY = MAX_LEN;

const HAND_W = 9;
const HAND_R = 4;
const HAND_LEN = 120;
let handTopY = HAND_LEN;
let handLen = HAND_LEN;

import { showTodoList } from './todo.js';
import { borning } from './boom.js';
import { slideLastTodoRight } from './todo.js';
import { booom } from './boom.js';
import { labelBoom } from './boom.js';

/* ------------------------------------------------------------------ */
/* 2. easing 함수                                                      */
/* ------------------------------------------------------------------ */
function easyOutPower(t) {
  return 1 - Math.pow(1 - t, 2.5);
}

function easyOutDoublePower(t) {
  return 1 - Math.pow(1 - t, 2);
}

function easyInOutPower(t) {
  if (t < 0.5) {
    return 0.5 * Math.pow(2 * t, 2);
  } else {
    return 1 - 0.5 * Math.pow(2 * (1 - t), 2);
  }
}

function easyInPower(t) {
  return Math.pow(t, 2.5);
}

function plain(t) {
  return t;
}

/* ------------------------------------------------------------------ */
/* 3. flowering                                                     */
/* ------------------------------------------------------------------ */
let floweringStart = null;

export function animateFlowering(ts) {
  if (!floweringStart) floweringStart = ts;
  const raw = Math.min((ts - floweringStart) / DURATION, 1);
  const p = easyOutPower(raw);

  if (raw < 0.3) {
    barTopY = MAX_LEN * p;
    len = MAX_LEN * p;
    drawFrame();
    requestAnimationFrame(animateFlowering);
  } else if (raw >= 0.3 && raw < 1) {
    barTopY = MAX_LEN * p;
    len = MAX_LEN * p - (MAX_LEN * p - FINAL_LEN) * p;
    drawFrame();
    requestAnimationFrame(animateFlowering);
  } else {
    setTimeout(startHanding, 300);
  }
}

/* ------------------------------------------------------------------ */
/* 3. rotate flowering                                            */
/* ------------------------------------------------------------------ */
const ROT_STEP = -Math.PI / 6;
let barsOffset = 0;
let barsAnim = null;

export function rotateBarsTodoMinus30(duration = 2000) {
  const now = performance.now();
  const from = barsOffset;
  const to = from + ROT_STEP;
  barsAnim = { start: now, from, to, dur: duration };
  requestAnimationFrame(stepBarsRotation);
}

function stepBarsRotation(now) {
  if (!barsAnim) return;
  const raw = Math.min((now - barsAnim.start) / barsAnim.dur, 1);
  const e = easyInOutPower(raw);

  barsOffset = barsAnim.from + (barsAnim.to - barsAnim.from) * e;

  if (raw < 1) {
    if (!isHanding) drawFrame();
    requestAnimationFrame(stepBarsRotation);
  } else {
    barsOffset = barsAnim.to;
    barsAnim = null;
    if (!isHanding) drawFrame();
  }
}

/* ------------------------------------------------------------------ */
/* 3. hand 생성                                                     */
/* ------------------------------------------------------------------ */
let handStart = null;
let isHanding = false;

function startHanding() {
  if (isHanding) return;
  isHanding = true;
  requestAnimationFrame(animateHanding);
}

function animateHanding(ts) {
  if (!handStart) handStart = ts;
  const raw = Math.min((ts - handStart) / 1500, 1);
  const p = easyOutPower(raw);

  if (raw < 1) {
    handTopY = HAND_LEN * p;
    handLen = HAND_LEN * p;
    drawFrame();
    requestAnimationFrame(animateHanding);
  } else {
    requestAnimationFrame(runHandCycle);
    showTodoList();
  }
}

/* ------------------------------------------------------------------ */
/* 3. hand 소멸                                                     */
/* ------------------------------------------------------------------ */
let handShrinkStart = null;

export function shrinkHand(ts) {
  if (!handShrinkStart) handShrinkStart = ts;
  const raw = Math.min((ts - handShrinkStart) / 1500, 1);
  const p = easyInOutPower(raw);

  if (raw < 0.7) {
    handTopY = HAND_LEN - HAND_LEN * p;
    handLen = HAND_LEN - HAND_LEN * p;
    drawFrame();
    requestAnimationFrame(shrinkHand);
  } else if (raw >= 0.7 && raw < 1) {
    handTopY = HAND_LEN - HAND_LEN * p;
    handLen = HAND_LEN - HAND_LEN * p;
    drawFrame();
    requestAnimationFrame(shrinkHand);
    requestAnimationFrame(borning);
  } else {
    isHanding = false;
    handStart = null;
    handShrinkStart = null;
    slideLastTodoRight();
    startOverlayBarSlideRight();
  }
}

/* ------------------------------------------------------------------ */
/* 4. hand rotation                                                */
/* ------------------------------------------------------------------ */
// --- 각도 목표(도 단위)
const FIRST_T = 80; // 0 -> 80
const SECOND_T = 60; // 80 -> 20
const THIRD_T = 110; // 20 -> 110
const FOURTH_T = -20;
// 마지막: 110 -> 80 (사이클 닫기)

// --- 구간 길이(ms)
const DUR_ONE = 4000;
const DUR_TWO = 1000;
const DUR_THREE = 3500;
const DUR_FOUR = 7000;
const DUR_FIVE = 4000;

// --- 이징
const POWER = 3;
function easeIn70Out30(u, p = POWER) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  if (u < 0.7) {
    const v = u / 0.7;
    return Math.pow(v, p) * 0.7;
  }
  const v = (u - 0.7) / 0.3;
  return 0.7 + (1 - Math.pow(1 - v, p)) * 0.3;
}

// --- 사이클 정의(원하는 이징으로 조절 가능)
// 끊김 완화를 위해 '이전 구간 끝=0속도' 다음 구간은 'easeOut'처럼
// 시작 속도가 있는 곡선을 쓰면 덜 멈춘 느낌이 납니다.
const PHASES = [
  { from: -90, to: FIRST_T, dur: DUR_ONE, ease: easyInPower }, // 0->80
  { from: FIRST_T, to: SECOND_T, dur: DUR_TWO, ease: easyOutPower }, // 80->20 (← 시작 빠르게)
  { from: SECOND_T, to: THIRD_T, dur: DUR_THREE, ease: easyInPower }, // 20->110 (← 끝 빠르게)
  { from: THIRD_T, to: FOURTH_T, dur: DUR_FOUR, ease: easyOutPower }, // 110->80 (사이클 닫기)
  { from: FOURTH_T, to: FIRST_T, dur: DUR_FIVE, ease: easyInPower },
];

// --- 상태
let phaseIdx = 0;
let phaseStartTs = null;
let handAngleDeg = -90; // drawFrame에서 사용할 현재 각도(도)
let introDone = false;

function nextPhaseIndex(idx) {
  // 0번을 막 끝냈다면 → 1번으로 진입하고, 이후는 1~3 반복
  if (!introDone && idx === 0) {
    introDone = true;
    return 1;
  }
  // 1,2,3만 순환: 1→2→3→1→…
  return 1 + ((idx - 1 + 1) % 4);
}

// 단일 rAF 루프
function runHandCycle(ts) {
  if (phaseStartTs === null) phaseStartTs = ts;

  const ph = PHASES[phaseIdx];
  const u = Math.min((ts - phaseStartTs) / ph.dur, 1); // 0..1
  const e = ph.ease(u);

  // ★ 매 프레임 누적 갱신 금지! 고정된 from/to로 '한 번'만 보간
  handAngleDeg = ph.from + (ph.to - ph.from) * e;

  drawFrame(); // ← 여기서 handAngleDeg 사용해 회전

  if (u < 1) {
    requestAnimationFrame(runHandCycle);
  } else {
    // 다음 구간으로 즉시 전환(빈 프레임 없음)
    phaseIdx = nextPhaseIndex(phaseIdx);
    phaseStartTs = ts; // ts를 그대로 넘겨서 갭 제거
    requestAnimationFrame(runHandCycle);
  }
}

/* ------------------------------------------------------------------ */
/* 5. 3시 방향 overay bar 생성                                      */
/* ------------------------------------------------------------------ */
/* === 3시 방향 오버레이 바 상태 === */
let overlayActive = false;
let overlayStart = 0;
let overlayDur = 2000; // 2s
let overlayFrom = 0;
let overlayTo = 100; // +100px
let overlayX = 0;
let PX_NUMBER = 0.35 * window.innerWidth;

let startShooting = null;
let ShootingDur = 1100;
let shootingTarget = -120;

/* 시작 함수: 흰 바를 오른쪽으로 100px 이동 */
function startOverlayBarSlideRight(px = PX_NUMBER, dur = 5000) {
  overlayActive = true;
  overlayStart = performance.now();
  overlayDur = dur;
  overlayFrom = 0;
  overlayTo = px;
  overlayX = 0;
  requestAnimationFrame(stepOverlayBar);
}

function stepOverlayBar(now) {
  if (!overlayActive) return;
  const t = Math.min((now - overlayStart) / overlayDur, 1);
  const p = easyInOutPower(t); // 기존 easing 재사용
  overlayX = overlayFrom + (overlayTo - overlayFrom) * p;

  // hand가 안 도는 상태면 우리가 렌더 트리거
  if (!isHanding) drawFrame();

  if (t < 1) {
    requestAnimationFrame(stepOverlayBar);
  } else {
    setTimeout(() => requestAnimationFrame(shootingBar), 500);
  }
}

function shootingBar(ts) {
  if (!overlayActive) return;
  if (!startShooting) startShooting = ts;
  const raw = Math.min((ts - startShooting) / ShootingDur, 1);
  const p = easyOutDoublePower(raw);
  overlayX = PX_NUMBER - (PX_NUMBER - shootingTarget) * p;

  if (!isHanding) drawFrame();

  if (raw < 1) {
    requestAnimationFrame(shootingBar);
  } else {
    requestAnimationFrame(booom);
    setTimeout(() => requestAnimationFrame(labelBoom), 800);
  }
}

/* ------------------------------------------------------------------ */
/* 5. 메인 렌더                                                     */
/* ------------------------------------------------------------------ */
//한 프레임 그리기
function drawFrame() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < N_BARS; i++) {
    const ang = i * (Math.PI / 6) + barsOffset;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.roundRect(-BAR_W / 2, -barTopY, BAR_W, len, BAR_R);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.restore();
  }

  if (isHanding) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((handAngleDeg * Math.PI) / 180);
    ctx.beginPath();
    ctx.roundRect(-HAND_W / 2, -handTopY, HAND_W, handLen, HAND_R);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.restore();
  }

  // === 3시 방향 오버레이(아래: 배경색으로 가리기, 위: 흰색 이동) ===
  if (overlayActive) {
    // 아래: 원래 바를 덮는 마스킹 바(캔버스 배경과 같은 색)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.roundRect(-(BAR_W + 6) / 2, -(barTopY + 6), BAR_W + 6, len + 6, BAR_R);
    ctx.fillStyle = '#6fbde1';
    ctx.fill();
    ctx.restore();

    // 위: 움직이는 흰 바
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.roundRect(-BAR_W / 2, -barTopY - overlayX, BAR_W, len, BAR_R);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ */
/* 1000. 리사이즈                                                     */
/* ------------------------------------------------------------------ */

// 캔버스 DPR/리사이즈 세팅(레티나/고DPR 환경에서도 선명하게)
function fitCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // CSS px 기준으로 그리기
}

fitCanvas();

window.addEventListener('resize', () => {
  fitCanvas();
  drawFrame(1);
});
