import { rotateBarsTodoMinus30 } from './bar-todo.js';
import { shrinkHand } from './bar-todo.js';

const TODO_KEY = 'todo';
const todoForm = document.querySelector('#todo-form');
const todoInput = document.querySelector('#todo-form input');
let arr = [];

/* ------------------------------------------------------------------ */
/* 0. ease-power                   */
/* ------------------------------------------------------------------ */
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

function easyOutDoublePower(t) {
  return 1 - Math.pow(1 - t, 2);
}

/* ------------------------------------------------------------------ */
/* 0. input 박스 폭 조정 (글씨 길이에 맞춰 늘어나도록)                   */
/* ------------------------------------------------------------------ */
(function autoGrowInput(input) {
  if (!input) return;
  const mirror = document.createElement('span');
  const cs = getComputedStyle(input);

  Object.assign(mirror.style, {
    position: 'absolute',
    top: '-9999px',
    left: '-9999px',
    whiteSpace: 'pre',
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    letterSpacing: cs.letterSpacing,
    textTransform: cs.textTransform,
    padding: cs.padding,
    border: cs.border,
  });
  document.body.appendChild(mirror);

  const EXTRA = 10; // 좌우 여유
  const MIN = 80; // 최소 폭

  function fit() {
    mirror.textContent = input.value || input.placeholder || '';
    const measured = mirror.offsetWidth + EXTRA; // 실제 필요한 폭
    input.style.width = Math.max(MIN, measured) + 'px';
  }

  fit();
  input.addEventListener('input', fit);
  window.addEventListener('load', fit);
})(todoInput);

/* ------------------------------------------------------------------ */
/* 1. todo                   */
/* ------------------------------------------------------------------ */
function deleteTodo(event) {
  const thatItem = event.target.parentElement;
  rotatePrevTodos(thatItem, 30);

  const label = thatItem.querySelector('label');
  const text = label.innerText;
  thatItem.remove();
  arr = arr.filter((item) => item !== text);
  localStorage.setItem(TODO_KEY, JSON.stringify(arr));
}

// 1) 앞선 항목들만 회전
function rotatePrevTodos(targetEl, stepDeg = 30) {
  const items = Array.from(document.querySelectorAll('#list > .todo-item'));
  const idx = items.indexOf(targetEl);
  if (idx <= 0) return;

  items.slice(0, idx).forEach((el) => {
    const cur = parseFloat(el.dataset.angle ?? '0');
    const next = cur + stepDeg;
    el.dataset.angle = String(next);
    el.style.setProperty('--angle', next + 'deg'); // CSS transition 적용됨
  });
}

function rotateAllTodos(stepDeg = -30) {
  document.querySelectorAll('#list > .todo-item').forEach((el) => {
    const cur = parseFloat(el.dataset.angle ?? '0'); //최초엔 0도
    const next = cur + stepDeg;
    el.dataset.angle = String(next);
    el.style.setProperty('--angle', next + 'deg');
  });
}

function onTodoSubmit(event) {
  event.preventDefault();
  document.querySelector('#todo-form input').removeAttribute('placeholder'); //placeholder 다시 안생기도록
  const newTodo = todoInput.value;
  arr.push(newTodo);
  localStorage.setItem(TODO_KEY, JSON.stringify(arr));
  todoInput.value = '';

  todoList(newTodo);

  if (arr.length === 12) {
    todoInput.dispatchEvent(new Event('input')); // 입력폭 자동조정 유지
    document.querySelector('#todo-form').classList.add('hidden');
    requestAnimationFrame(shrinkHand);
    return;
  }

  // 리스트가 혹시 투명 상태라면 표시
  document.querySelector('#list').classList.add('show');

  requestAnimationFrame(() => {
    document
      .querySelectorAll('#list > .todo-item')
      .forEach((el) => el.getBoundingClientRect());
    requestAnimationFrame(() => {
      rotateAllTodos(-30);
      rotateBarsTodoMinus30();
    });
  });
  todoInput.dispatchEvent(new Event('input')); // 입력폭 자동조정 유지
}

function todoList(newTodo) {
  //투 두 리스트 div태그 안에 생성
  const div = document.querySelector('#list');
  const span = document.createElement('span');

  span.classList.add('todo-item');
  span.dataset.angle = '0';
  span.style.setProperty('--angle', '0deg');

  const label = document.createElement('label');
  label.setAttribute('for', 'todo-list');
  label.innerText = newTodo;

  const button = document.createElement('button');
  button.addEventListener('click', deleteTodo);

  span.appendChild(button);
  span.appendChild(label);
  div.appendChild(span);
}

export function showTodoList() {
  const savedUsername2 = localStorage.getItem('username');
  const savedTodoList = localStorage.getItem(TODO_KEY);

  if (savedUsername2 !== null) {
    todoForm.classList.add('show');

    const list = document.querySelector('#list');
    requestAnimationFrame(() => list.classList.add('show'));

    todoForm.addEventListener('submit', onTodoSubmit);
  }
  if (savedTodoList !== null) {
    const parseTodo = JSON.parse(savedTodoList);
    arr = parseTodo;
    parseTodo.forEach((item) => todoList(item));
    applyInitialAngles(-30);

    const list = document.querySelector('#list');
    requestAnimationFrame(() => list.classList.add('show'));
  }
}

/* ------------------------------------------------------------------ */
/* 2. boom                   */
/* ------------------------------------------------------------------ */
let PX_NUMBER = 0.35 * window.innerWidth;

let startShooting = null;
let ShootingDur = 1100;
let shootingTarget = -120;

// 마지막(span.todo-item) 하나를 X로 슬라이드
export function slideLastTodoRight(px = PX_NUMBER, dur = 5000) {
  const items = document.querySelectorAll('#list > .todo-item');
  const el = items[items.length - 1];
  if (!el) return;

  // CSS transition 삭제
  el.style.transition = 'none';
  el.getBoundingClientRect(); // 강제 리플로우로 'none' 확정

  const start = performance.now();
  const curr = getComputedStyle(el).getPropertyValue('--shiftX') || '0';
  const from = parseFloat(curr) || 0;
  const to = from + px;

  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    const p = easyInOutPower(t);
    const v = from + (to - from) * p;
    el.style.setProperty('--shiftX', `${v}px`);

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      setTimeout(() => requestAnimationFrame(shootingTodo), 500);
    }
  }
  requestAnimationFrame(step);
}

function shootingTodo(ts) {
  const items = document.querySelectorAll('#list > .todo-item');
  const el = items[items.length - 1];

  if (!startShooting) startShooting = ts;
  const raw = Math.min((ts - startShooting) / ShootingDur, 1);
  const p = easyOutDoublePower(raw);
  const v = PX_NUMBER - (PX_NUMBER - shootingTarget) * p;

  el.style.setProperty('--shiftX', `${v}px`);

  if (raw < 1) {
    requestAnimationFrame(shootingTodo);
  }
}

/* ------------------------------------------------------------------ */
/* 3. 새로고침시 즉시 적용                  */
/* ------------------------------------------------------------------ */
// ✅ 0) 저장된 목록을 화면에 깔아놓을 때, 30° 간격으로 즉시 배치
function applyInitialAngles(step = -30) {
  const items = Array.from(document.querySelectorAll('#list > .todo-item'));
  const n = items.length;
  if (!n) return;

  // 첫 진입 때는 "애니메이션 없이" 각도만 세팅
  items.forEach((el) => (el.style.transition = 'none'));

  // 가장 오래된 것일수록 더 많이 회전: -30*n, -30*(n-1), ..., -30
  items.forEach((el, i) => {
    const ang = step * (n - i);
    el.dataset.angle = String(ang);
    el.style.setProperty('--angle', ang + 'deg');
  });

  // 강제 리플로우로 스타일 적용 확정
  items[0].getBoundingClientRect();

  // 이후부터는 CSS 전환(transition) 다시 사용
  items.forEach((el) => el.style.removeProperty('transition'));
}
