/* ------------------------------------------------------------------ */
/* 0. 기본 설정                                                       */
/* ------------------------------------------------------------------ */
const canvas = document.querySelector('#canvasBarTop');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.addEventListener('click', inBarClick);

import { deleteBar } from './bar.js';
/* ------------------------------------------------------------------ */
/* 날씨 끝나고 상태 저장                                        */
/* ------------------------------------------------------------------ */
const WEATHER_KEY = 'weather_done';
let resizeRaf = null;
let noClick = false;

/* ------------------------------------------------------------------ */
/* 1. 상태 변수 (스트레치 전용)                                        */
/* ------------------------------------------------------------------ */
let hasStarted = false;
let isStretching = false;
let stretchStartTime = null;

let currentRecHeight = 680;
let targetRecHeight = Math.max(1.5 * canvas.width, 1.5 * canvas.height);

let currentBarY = 300;
let targetBarY = 150;

let currentBarHeight = 80;
let targetBarHeight = Math.max(canvas.width, canvas.height);

let extraBarHeight = 0; // 2차 스트레치용
let extraRecHeight = 0;
let isTopBarVisible = true;

/* ------------------------------------------------------------------ */
/* 2. 회전 + 블루밍 공통 파라미터                                     */
/* ------------------------------------------------------------------ */
const COMBO_DURATION = 2400; // 두 효과 공통 시간(ms)
const ROT_TARGET_RAD = (249 * Math.PI) / 180; // 바가 돌 각도
const SECOND_ROT_TARGET_RAD = (232 * Math.PI) / 180;
const THIRD_ROT_TARGET_RAD = 2 * Math.PI;

const MAX_BLOOM_SCALE = 0.692; // 부채꼴 최대 비율
const SECOND_BLOOM_SCALE = 0.645;
const THIRD_BLOOM_SCALE = 1;

let comboStart = null; // RAF 시작 시각
let comboBackStart = null;
let comboFinalStart = null;
let epilogueStart = null;
let epilogueFinalStart = null;
let rotCurrent = 0; // 매 프레임 갱신될 회전각(rad)
let isBlueming = false; // 부채꼴 활성 플래그
let bloomCurrent = 0;
let isWeatherTexting = false; // weather 글씨 활성 플래그
let epilogueRunning = false;

/* ------------------------------------------------------------------ */
/* 3. 블루밍 기하/색 파라미터                                         */
/* ------------------------------------------------------------------ */
const radiusCorner = 4;
let kx = canvas.width / 2 - 4.5 + radiusCorner; // 회전·그라디언트 기준점
let ky = canvas.height / 2 - 40 - 300 + radiusCorner;

let blueRadius = Math.max(canvas.width, canvas.height);
const startAngle = (2 * Math.PI) / 4; // 225° 출발

/* ------------------------------------------------------------------ */
/*  블루밍 Gradient Collapse 애니메이션 파라미터                       */
/* ------------------------------------------------------------------ */
const GRADIENT_COLLAPSE_DURATION = 1200;
let gradCollapseStart = null;
let gradCollapseP = 0;
let gradCollapseRunning = false;
const EPS = 1e-4;

/* ------------------------------------------------------------------ */
/* 날씨 그라디언트                                        */
/* ------------------------------------------------------------------ */
const weatherGradEnd = 50;

/* ------------------------------------------------------------------ */
/* 4. 클릭 감지1                                                       */
/* ------------------------------------------------------------------ */
function inBarClick(e) {
  if (!localStorage.getItem('username')) return;
  if (noClick) return;

  const rect = canvas.getBoundingClientRect();
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // 클릭 좌표를 45° 보정
  const dx = e.clientX - rect.left - cx;
  const dy = e.clientY - rect.top - cy;
  const a = -Math.PI / 4;
  const rx = dx * Math.cos(a) - dy * Math.sin(a) + cx;
  const ry = dx * Math.sin(a) + dy * Math.cos(a) + cy;

  const barX = canvas.width / 2 - 4.5;
  const barY = canvas.height / 2 - 40 + currentBarY;
  const inBar =
    rx >= barX - 20 &&
    rx <= barX + 29 &&
    ry >= barY - 20 &&
    ry <= barY + currentBarHeight + 20;

  if (inBar && !isStretching) {
    hasStarted = true;
    isStretching = true;
    stretchStartTime = performance.now();
    deleteBar();
    requestAnimationFrame(animateStretch);
  }
}

/* ------------------------------------------------------------------ */
/* 4. 클릭 감지2                                                       */
/* ------------------------------------------------------------------ */
//날씨 이후 발생한 바 클릭 감지
canvas.addEventListener('click', detectWeatherAreaClick);

function detectWeatherAreaClick(e) {
  // weather_done일 때만 동작
  if (!localStorage.getItem(WEATHER_KEY)) return;

  const rect = canvas.getBoundingClientRect();
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // 1) 캔버스 좌표
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;

  // 2) 전역 45° 회전(센터 기준) 해제
  ({ x, y } = rotateAround(x, y, cx, cy, -Math.PI / 4));

  // 3) 바의 추가 회전(kx, ky 기준 rotCurrent) 해제
  ({ x, y } = rotateAround(x, y, kx, ky, -rotCurrent));

  // 4) 바 + 패딩(±5px) 영역 판정
  const pad = 5;
  const barX = canvas.width / 2 - 4.5;
  const barY = canvas.height / 2 - 40 + currentBarY - extraBarHeight;
  const inArea =
    x >= barX - pad &&
    x <= barX + 9 + pad &&
    y >= barY - pad &&
    y <= barY + currentBarHeight + pad;

  if (inArea) {
    if (epilogueRunning) return;
    requestAnimationFrame(epilogueRotation);
    requestAnimationFrame(weatherDeleteGradient);
    epilogueRunning = true;
  }
}

// 회전 역변환 유틸
function rotateAround(x, y, ox, oy, angle) {
  const dx = x - ox;
  const dy = y - oy;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: dx * c - dy * s + ox, y: dx * s + dy * c + oy };
}

/* ------------------------------------------------------------------ */
/* 5-1. 1차 스트레치                                                  */
/* ------------------------------------------------------------------ */
function animateStretch(ts) {
  const p = Math.min((ts - stretchStartTime) / 500, 1);

  currentRecHeight = 680 + (targetRecHeight - 680) * p;
  currentBarY = 300 - (300 - targetBarY) * p;
  currentBarHeight = 80 - (80 - targetBarHeight) * p;

  draw();
  if (p < 1) return requestAnimationFrame(animateStretch);

  // 잠깐 멈췄다가…
  setTimeout(() => {
    stretchStartTime = performance.now();
    requestAnimationFrame(animateMoreStretch);
  }, 500);
}

/* ------------------------------------------------------------------ */
/* 5-2. 2차 스트레치 (위로 450px 더)                                   */
/* ------------------------------------------------------------------ */
function animateMoreStretch(ts) {
  const p = Math.min((ts - stretchStartTime) / 600, 1);

  extraBarHeight = 375 * p;
  extraRecHeight = (600 - 80 - targetBarY) * p;

  draw();
  if (p < 1) return requestAnimationFrame(animateMoreStretch);

  // 스트레치 완료 → 콤보 애니메이션 시작
  isTopBarVisible = false;
  extraBarHeight = 450;
  extraRecHeight = 600 - 80 - 80 + 10;
  draw();

  const barCanvas = document.querySelector('#canvasBar');
  if (barCanvas) barCanvas.style.display = 'none';

  isBlueming = true;
  isWeatherTexting = true;
  comboStart = null;
  requestAnimationFrame(comboForwardLoop);
  hideText();
}

/* ------------------------------------------------------------------ */
/* 6. 회전+블루밍 단일 루프                                           */
/* ------------------------------------------------------------------ */
function easyOutPower(t) {
  return 1 - Math.pow(1 - t, 2.5);
}

function easeInOutPower(t) {
  if (t < 0.5) {
    return 0.5 * Math.pow(2 * t, 2.5);
  } else {
    return 1 - 0.5 * Math.pow(2 * (1 - t), 3);
  }
}

function comboForwardLoop(ts) {
  if (!comboStart) comboStart = ts;
  const rawProgress = Math.min((ts - comboStart) / COMBO_DURATION, 1);
  const easedProgress = easyOutPower(rawProgress);

  rotCurrent = ROT_TARGET_RAD * easedProgress; // 바 회전
  bloomCurrent = MAX_BLOOM_SCALE * easedProgress; // 부채꼴 진행

  draw(bloomCurrent);

  if (easedProgress < 1) {
    requestAnimationFrame(comboForwardLoop);
  } else {
    weatherOn();
    setTimeout(() => {
      comboBackStart = null;
      requestAnimationFrame(comboBackLoop);
    }, 1500);
  }
}

function comboBackLoop(ts) {
  if (!comboBackStart) comboBackStart = ts;
  const rawProgress = Math.min((ts - comboBackStart) / 1000, 1);
  const easedProgress = easyOutPower(rawProgress);
  const RotDelta = ROT_TARGET_RAD - SECOND_ROT_TARGET_RAD;
  const BloomDelta = MAX_BLOOM_SCALE - SECOND_BLOOM_SCALE;

  rotCurrent = ROT_TARGET_RAD - RotDelta * easedProgress; // 바 회전
  bloomCurrent = MAX_BLOOM_SCALE - BloomDelta * easedProgress; // 부채꼴 진행

  draw(bloomCurrent);

  if (easedProgress < 1) {
    requestAnimationFrame(comboBackLoop);
  } else {
    comboFinalStart = null;
    requestAnimationFrame(comboFinalLoop);
    requestAnimationFrame(weatherGradient);

    setTimeout(() => {
      isWeatherTexting = false;
    }, 200);

    setTimeout(() => {
      weatherIndex();

      applyWeatherMask();
    }, 570);
  }
}

function comboFinalLoop(ts) {
  if (!comboFinalStart) comboFinalStart = ts;
  const rawProgress = Math.min((ts - comboFinalStart) / 2000, 1);
  const easedProgress = easeInOutPower(rawProgress);
  const RotDelta = SECOND_ROT_TARGET_RAD - THIRD_ROT_TARGET_RAD;
  const BloomDelta = SECOND_BLOOM_SCALE - THIRD_BLOOM_SCALE;

  rotCurrent = SECOND_ROT_TARGET_RAD - RotDelta * easedProgress; // 바 회전
  bloomCurrent = SECOND_BLOOM_SCALE - BloomDelta * easedProgress; // 부채꼴 진행

  draw(bloomCurrent);

  if (easedProgress < 1) {
    requestAnimationFrame(comboFinalLoop);
  } else {
    localStorage.setItem(WEATHER_KEY, 1);
    noClick = true;
  }
}

/* ------------------------------------------------------------------ */
/* 6-1. Weather 정보 등장                                              */
/* ------------------------------------------------------------------ */
function weatherOn() {
  document.querySelector('.weather-box').classList.remove('hidden');
  document.querySelector('#temp').classList.remove('hidden');
  document.querySelector('.weather-box').style.display = 'flex';
  document.querySelector('#temp').style.display = 'flex';
}

function weatherIndex() {
  document.querySelector('.weather-box').style.zIndex = '9999';
  document.querySelector('#temp').style.zIndex = '9999';
}

// 바 최종 각도가 45°(=Math.PI/4 라디안)라면, 경계선이 45°가 되도록
// 그라디언트 각도는 “바 각 + 90°”를 쓰는 게 정확함(경계선은 그라디언트에 수직이므로)
function applyWeatherMask() {
  const el = document.querySelector('#weather');
  if (!el) return;

  el.classList.remove('hidden');
  el.classList.add('weather-masked');

  el.style.setProperty('--mask-angle', `135deg`);

  // 2) 마스크를 '뷰포트(0,0)'에 정렬: 요소의 화면 좌표만큼 역오프셋
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mask-x', `${-rect.left}px`);
  el.style.setProperty('--mask-y', `${-rect.top}px`);

  // ★ 초기 정렬 보정
  ensureWeatherMaskAligned();
}

// 화면 크기/스크롤 변화 시 항상 정렬 유지
function updateWeatherMaskPosition() {
  const el = document.querySelector('#weather');
  if (!el) return;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mask-x', `${-rect.left}px`);
  el.style.setProperty('--mask-y', `${-rect.top}px`);
}

window.addEventListener('resize', () => updateWeatherMaskPosition('#weather'));
window.addEventListener('scroll', () => updateWeatherMaskPosition('#weather'));

let start = null;
let deleteStart = null;

function weatherGradient(ts) {
  if (start === null) start = ts;
  const el = document.querySelector('#weather');
  if (!el) return;
  const rawProgress = Math.min((ts - start) / 2150, 1);
  const easedProgress = easyOutPower(rawProgress);
  const delta = 100 - weatherGradEnd;

  let currentGradient = 100 - delta * easedProgress;

  el.style.setProperty('--mask-stop', `${currentGradient}%`);

  if (easedProgress < 1) {
    requestAnimationFrame(weatherGradient);
  } else {
    el.style.setProperty('--mask-stop', '50%'); // 끝값 고정
  }
}

function weatherDeleteGradient(ts) {
  if (deleteStart === null) deleteStart = ts;
  const el = document.querySelector('#weather');
  if (!el) return;
  const rawProgress = Math.min((ts - deleteStart) / 2150, 1);
  const easedProgress = easyOutPower(rawProgress);
  const delta = 50 - 100;

  let currentGradient = 50 - delta * easedProgress;

  el.style.setProperty('--mask-stop', `${currentGradient}%`);

  if (easedProgress < 1) {
    requestAnimationFrame(weatherDeleteGradient);
  } else {
    el.style.setProperty('--mask-stop', '100%'); // 끝값 고정
  }
}

/* ------------------------------------------------------------------ */
/* 6-2. epilogue bar rotation                                            */
/* ------------------------------------------------------------------ */
// 클릭 후 실행할 새 함수(원하는 로직으로 교체)
function epilogueRotation(ts) {
  if (!epilogueStart) epilogueStart = ts;
  const rawProgress = Math.min((ts - epilogueStart) / 1400, 1);
  const easedProgress = easyOutPower(rawProgress);
  const RotDelta = THIRD_ROT_TARGET_RAD - ROT_TARGET_RAD;
  const BloomDelta = THIRD_BLOOM_SCALE - MAX_BLOOM_SCALE;

  rotCurrent = THIRD_ROT_TARGET_RAD - RotDelta * easedProgress; // 바 회전
  bloomCurrent = THIRD_BLOOM_SCALE - BloomDelta * easedProgress; // 부채꼴 진행

  draw(bloomCurrent);

  if (easedProgress < 1) {
    requestAnimationFrame(epilogueRotation);
  } else {
    requestAnimationFrame(epilogueFinalRotation);
    addHidden();
    startGradientCollapse();
  }
}

function epilogueFinalRotation(ts) {
  if (!epilogueFinalStart) epilogueFinalStart = ts;
  const rawProgress = Math.min((ts - epilogueFinalStart) / 1200, 1);
  const easedProgress = easeInOutPower(rawProgress);
  const RotDelta = ROT_TARGET_RAD - THIRD_ROT_TARGET_RAD;
  const BloomDelta = MAX_BLOOM_SCALE - THIRD_BLOOM_SCALE;

  rotCurrent = ROT_TARGET_RAD - RotDelta * easedProgress; // 바 회전
  bloomCurrent = MAX_BLOOM_SCALE - BloomDelta * easedProgress; // 부채꼴 진행

  draw(bloomCurrent);

  if (easedProgress < 1) {
    requestAnimationFrame(epilogueFinalRotation);
  } else {
    startShrinkBar();
  }
}

function addHidden() {
  document.querySelector('.weather-box').classList.add('hidden');
  document.querySelector('.weather-box').style.display = 'none';
  document.querySelector('#temp').classList.add('hidden');
  document.querySelector('#temp').style.display = 'none';
}

/* ------------------------------------------------------------------ */
/* 6-4 블루밍 Gradient Collapse                                      */
/* ------------------------------------------------------------------ */
function startGradientCollapse() {
  if (gradCollapseRunning) return;
  gradCollapseRunning = true;
  gradCollapseStart = null;
  requestAnimationFrame(bloomStopsCollapse);
}

function bloomStopsCollapse(ts) {
  if (!gradCollapseStart) gradCollapseStart = ts;
  const raw = Math.min(
    (ts - gradCollapseStart) / GRADIENT_COLLAPSE_DURATION,
    1
  );
  gradCollapseP = easyOutPower(raw);

  draw(bloomCurrent);

  if (raw < 1) {
    requestAnimationFrame(bloomStopsCollapse);
  } else {
    gradCollapseRunning = false;
    gradCollapseP = 1;
    draw(bloomCurrent); // 최종 프레임 보정
  }
}

// ■ 블루밍 그라디언트 스톱 생성기
function applyBloomGradient(cg, scale) {
  // 애니메이션이 시작되기 전엔 기존 그라디언트 그대로 사용
  if (gradCollapseStart === null) {
    cg.addColorStop(0, '#FFFFFF00');
    cg.addColorStop(0.002 * scale, '#FFFFFF00');
    cg.addColorStop(0.012 * scale, '#FFFFFF');
    cg.addColorStop(0.09 * scale, '#BAE1F3');
    cg.addColorStop(0.29 * scale, '#A5D8F0');
    cg.addColorStop(0.87 * scale, '#6FBDE1');
    cg.addColorStop(0.9999 * scale, '#6FBDE1');
    cg.addColorStop(1, '#FFFFFF00');
    return;
  }

  // 애니메이션 진행: 숫자×scale 들을 (1 - p) 배로 수축
  const p = gradCollapseP; // 0→1 (easyOutPower)
  const shrink = 1 - p; // 1→0
  let last = 0;

  // 수축 대상(0이 되면 자동 삭제)
  const shrinking = [
    { coef: 0.002 * shrink, color: '#FFFFFF00' },
    { coef: 0.012 * shrink, color: '#FFFFFF' },
    { coef: 0.09 * shrink, color: '#BAE1F3' },
    { coef: 0.29 * shrink, color: '#A5D8F0' },
    { coef: 0.87 * shrink, color: '#6FBDE1' },
  ];

  for (const s of shrinking) {
    let pos = s.coef * scale; // 0..1
    if (pos > last + EPS) {
      // 0 이거나 역전되면 스킵(삭제)
      cg.addColorStop(pos, s.color);
      last = pos;
    }
  }

  // 0.9999*scale → 1*scale로 확대 (#6FBDE1 영역 확장)
  let near = (0.9999 + (1 - 0.9999) * p) * scale; // = (0.9999 + 0.0001*p)*scale
  near = Math.min(1, Math.max(last + EPS, near)); // 단조증가 보장
  cg.addColorStop(near, '#6FBDE1');
}

/* ------------------------------------------------------------------ */
/* 6-3. 바 수축                                            */
/* ------------------------------------------------------------------ */
// ■ 바 수축 애니메이션 상태
const SHRINK_DURATION = 500; // ms
let shrinkStart = null;
let shrinkRunning = false;
let shrinkActive = false;

// 처음 프레임 기준의 top/bottom과 목표 centerY(=화면 중심)
let shrinkTop0 = 0;
let shrinkBottom0 = 0;
let shrinkCenterY = 0;

// draw()에서 쓸 오버라이드 값
let shrinkY = 0;
let shrinkH = 0;

function startShrinkBar() {
  if (shrinkRunning) return;
  shrinkRunning = true;
  shrinkStart = null;

  // 현재 바의 초기 top/bottom 계산
  const topY0 = canvas.height / 2 - 40 + currentBarY - extraBarHeight;
  const h0 = currentBarHeight;

  shrinkTop0 = topY0;
  shrinkBottom0 = topY0 + h0;
  shrinkCenterY = canvas.height / 2; // ★ 화면 중심을 기준으로 수축

  requestAnimationFrame(shrinkBar);
}

function shrinkBar(ts) {
  if (!shrinkStart) shrinkStart = ts;
  const raw = Math.min((ts - shrinkStart) / SHRINK_DURATION, 1);
  const p = easyOutPower(raw); // 0→1

  // 윗끝·아랫끝을 각각 화면 중심으로 보간(lerp)
  const top = shrinkTop0 + (shrinkCenterY - shrinkTop0) * p;
  const bottom = shrinkBottom0 + (shrinkCenterY - shrinkBottom0) * p;

  const h = Math.max(0, bottom - top);
  shrinkActive = true;
  shrinkY = top;
  shrinkH = h;

  draw(bloomCurrent);

  if (raw < 1) {
    requestAnimationFrame(shrinkBar);
  } else {
    shrinkActive = false;
    shrinkRunning = false;
    currentBarHeight = 0; // 이후 프레임에서 완전히 제거
    draw(bloomCurrent);
    barToDoJs();
  }
}

/* ------------------------------------------------------------------ */
/* 6-3. bar-todo.js 등장                                             */
/* ------------------------------------------------------------------ */
import { animateFlowering } from './bar-todo.js';

function barToDoJs() {
  document.querySelector('#canvasBarToDo').classList.remove('hidden');
  document.querySelector('#canvasBarToDo').style.display = 'block';
  requestAnimationFrame(animateFlowering);
}

/* ------------------------------------------------------------------ */
/* 6-3. Weather 상태 저장                                             */
/* ------------------------------------------------------------------ */
function enterWeatherStateFromStorage() {
  if (localStorage.getItem(WEATHER_KEY) !== '1') return;

  // 1) 애니메이션 플래그/상태를 "최종"으로 세팅
  hasStarted = true;
  isStretching = false;
  isTopBarVisible = false;
  isBlueming = true;
  isWeatherTexting = false; // 캔버스에 그리던 weather 텍스트 비활성
  extraBarHeight = 450; // 네 코드의 최종값
  extraRecHeight = 450;
  currentBarHeight = Math.max(canvas.width, canvas.height);
  currentBarY = targetBarY; // 최종 y 기준
  rotCurrent = 2 * Math.PI; // THIRD_ROT_TARGET_RAD(=2π)
  bloomCurrent = THIRD_BLOOM_SCALE;

  // 하단 캔버스(구 바) 숨김
  const barCanvas = document.querySelector('#canvasBar');
  if (barCanvas) barCanvas.style.display = 'none';

  // 클릭 감지 못하도록
  noClick = true;

  // 2) 날씨 UI 보이기 + z-index 정리
  weatherOn();
  weatherIndex();

  // 2) 날씨 마스크 정리
  updateWeatherMaskPosition();

  // 3) 마스크 각/위치 보정 + 컷 위치 고정(50%)
  applyWeatherMask(); // 각도=135deg, 포지션 오프셋 계산
  const el = document.querySelector('#weather');
  if (el) el.style.setProperty('--mask-stop', '50%');

  syncWeatherStateToViewport();

  // 4) 뒤에 이름 텍스트 나타나지 않게
  hideTextImmediate();
}

// 최종(=weather) 상태용: 화면 크기에 맞춰 모든 의존 값 재계산 + 리드로우
function syncWeatherStateToViewport() {
  // 1) 캔버스 기하 재계산
  kx = canvas.width / 2 - 4.5 + radiusCorner;
  ky = canvas.height / 2 - 40 - 300 + radiusCorner;
  blueRadius = Math.max(canvas.width, canvas.height);

  // 2) 바/사각형 타깃·현재값을 새 뷰포트 기준으로 보정
  targetRecHeight = Math.max(1.5 * canvas.width, 1.5 * canvas.height);
  targetBarHeight = Math.max(canvas.width, canvas.height);
  currentBarHeight = targetBarHeight; // 최종 상태 유지
  currentRecHeight = targetRecHeight; // 최종 상태라면 사각형도 끝값으로
  // currentBarY, extraBarHeight 등은 이미 최종값이므로 유지

  // 3) 마스크 원점(뷰포트 0,0) 정렬
  updateWeatherMaskPosition(); // getBoundingClientRect()로 --mask-x/y 갱신

  // 4) 리드로우 (블루밍은 끝값)
  draw(1);
}

let weatherRO = null;

function ensureWeatherMaskAligned() {
  const el = document.querySelector('#weather');
  if (!el) return;

  // 1) 지금 프레임에서 일단 보정
  updateWeatherMaskPosition();

  // 2) 다음 페인트 직후(레이아웃 확정) 한 번 더
  requestAnimationFrame(() => updateWeatherMaskPosition());

  // 3) 폰트가 모두 로드된 뒤(텍스트 폭 변동 반영) 한 번 더
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready
      .then(() => updateWeatherMaskPosition())
      .catch(() => {});
  }

  // 4) 요소 자체 크기 변화 감지(텍스트/스타일 변화) 시 자동 보정
  if (window.ResizeObserver) {
    if (weatherRO) weatherRO.disconnect();
    weatherRO = new ResizeObserver(() => updateWeatherMaskPosition());
    weatherRO.observe(el);
  }
}

// 컷 위치 고정
const el = document.querySelector('#weather');
if (el) el.style.setProperty('--mask-stop', '50%');

function init() {
  const done = localStorage.getItem(WEATHER_KEY) === '1';
  if (done) {
    enterWeatherStateFromStorage(); // 내부에서 draw(1) 호출 OK

    // ★ 복구 직후 정렬 보정
    ensureWeatherMaskAligned();
    syncWeatherStateToViewport();
  } else {
    // 초기화면: 캔버스 비우고 아무것도 그리지 않음
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

init();

/* ------------------------------------------------------------------ */
/* 7. 백그라운드 이름 텍스트 숨김                                                         */
/* ------------------------------------------------------------------ */
function hideText() {
  const w = document.querySelector('.clock-wrapper');
  if (!w) return;

  w.style.transition = 'opacity 0.2s ease';
  w.style.opacity = '0';
  w.addEventListener('transitionend', () => (w.style.display = 'none'), {
    once: true,
  });
}

function hideTextImmediate() {
  const w = document.querySelector('.clock-wrapper');
  if (!w) return;

  w.style.opacity = '0';
}

/* ------------------------------------------------------------------ */
/* 8. 메인 렌더러                                                     */
/* ------------------------------------------------------------------ */
function draw(bloomCurrent) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* --- 45° 회전 좌표계 --- */
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 4);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  /* (1) 회색 블러 사각형 */
  const g = ctx.createLinearGradient(
    canvas.width / 2 - 6.5,
    0,
    canvas.width,
    0
  );
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.025, 'rgba(240,240,240,1)');
  g.addColorStop(0.1, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;

  ctx.save();
  ctx.filter = 'blur(5px)';
  ctx.fillRect(
    canvas.width / 2 - 6.5,
    canvas.height / 2 - 40 - 300 + (680 - 80) - targetBarY - extraRecHeight,
    canvas.width / 2,
    currentRecHeight - (680 - 80) + targetBarY
  );
  ctx.restore();
  ctx.restore(); // ← 45° 좌표계 해제

  /* (2) 블루밍 부채꼴 */
  if (isBlueming) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 4);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const endAngle = startAngle + 2 * Math.PI * bloomCurrent;
    const cg = ctx.createConicGradient(startAngle, kx, ky);
    const scale = bloomCurrent;

    applyBloomGradient(cg, scale);

    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.arc(kx, ky, blueRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* (2.5) WEATHER 텍스트 */
  if (isWeatherTexting) {
    ctx.save();
    const x = canvas.width - 30; // right:40px
    const y = canvas.height / 2 - 355 + canvas.height * 0.2;
    // const y = canvas.height * 0.33; // 화면 33% 지점

    const BASE_W = 1920;
    const fontScale = Math.max(canvas.width, canvas.height) / BASE_W;
    const mainFontSize = 120 * fontScale;
    const subFontSize = 22 * fontScale;
    const lineGap = 30 * fontScale;
    const subYOffset = mainFontSize * 0.85;

    ctx.translate(x, y);
    ctx.rotate((0.7 * Math.PI) / 180);
    ctx.translate(-x, -y);
    ctx.fillStyle = '#fff';
    ctx.font = `400 ${mainFontSize}px 'Crimson Text', serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    ctx.fillText('weather', x, y);

    ctx.font = `100 ${subFontSize}px 'Crimson Text', serif`;
    const lines = [
      'He had to listen to the silence of the sky',
      'to weigh the winds',
      'to feel the night',
    ];
    lines.forEach((txt, i) =>
      ctx.fillText(txt, x, y + subYOffset + i * lineGap)
    );
    ctx.restore();
  }

  /* (3) 흰색 바 */
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 4);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  ctx.translate(kx, ky);
  ctx.rotate(rotCurrent);
  ctx.translate(-kx, -ky);

  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 0;

  const r = 4;
  if (isTopBarVisible) {
    ctx.beginPath();
    ctx.roundRect(
      canvas.width / 2 - 4.5,
      canvas.height / 2 - 40 - 300,
      9,
      80,
      r
    );
    ctx.fill();
  }
  // ▼ 수축 상태면 오버라이드, 아니면 기존 값 사용
  const barX = canvas.width / 2 - 4.5;
  let barY = canvas.height / 2 - 40 + currentBarY - extraBarHeight;
  let barH = currentBarHeight;

  if (shrinkActive) {
    barY = shrinkY;
    barH = shrinkH;
  }

  if (barH > 0.5) {
    // 0 또는 음수 높이로 roundRect 호출 방지
    ctx.beginPath();
    ctx.roundRect(barX, barY, 9, barH, r);
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 9. 리사이즈 대응                                                   */
/* ------------------------------------------------------------------ */
addEventListener('resize', () => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const isWeatherFinal = localStorage.getItem(WEATHER_KEY) === '1';
    if (isWeatherFinal) {
      // 최종 상태: 뷰포트 동기화 루틴으로 전체 보정
      syncWeatherStateToViewport();
    } else {
      // 진행 중/초기 상태: 기존 로직 유지
      kx = canvas.width / 2 - 4.5 + radiusCorner;
      ky = canvas.height / 2 - 40 - 300 + radiusCorner;
      blueRadius = Math.max(canvas.width, canvas.height);
      if (hasStarted) draw(bloomCurrent);
      else draw(0);
      updateWeatherMaskPosition(); // 마스크 썼다면 보정
    }

    if (hasStarted) {
      draw(bloomCurrent);
    } else {
      // ✅ 시작 전: 아무것도 그리지 않음
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
});

window.addEventListener('scroll', () => {
  if (localStorage.getItem(WEATHER_KEY) === '1') updateWeatherMaskPosition();
});


