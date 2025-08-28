const loginForm = document.querySelector('#log-in-form');
const loginInput = document.querySelector('#log-in-form input');
const USERNAME_KEY = 'username';
const clockWrapper = document.querySelector('div.clock-wrapper');

function nameOnH2(e) {
  const text = e.target.value.replace(/ /g, '&nbsp;');
  clock2.innerHTML = text;
  if (e.target.value === '') {
    clock2.innerHTML = '&nbsp;';
  }
}

function onLoginSubmit(event) {
  event.preventDefault();
  loginForm.classList.remove('show');
  loginInput.classList.add('hidden');

  const username = loginInput.value;
  console.log(username);
  localStorage.setItem(USERNAME_KEY, username);
  loginToReady();
  rotateBarsDiagonal();
  triggerBarColorChange();
}

const savedUsername = localStorage.getItem(USERNAME_KEY);
import { clockToLogin } from './clock.js';
import { loginToReady } from './clock.js';
import { ready } from './clock.js';
import { rotateBarsHorizontal } from './bar.js';
import { rotateBarsDiagonal } from './bar.js';
import { triggerBarColorChange } from './bar.js';

const WEATHER_KEY = 'weather_done';
const isWeatherDone = localStorage.getItem(WEATHER_KEY) === '1';

if (savedUsername === null) {
  const hoverBox = document.createElement('div');
  hoverBox.id = 'hover-box';
  document.body.appendChild(hoverBox);

  hoverBox.addEventListener('mouseover', () => {
    loginForm.classList.add('show');
    loginInput.focus();
    clockToLogin();
    clockWrapper.classList.remove('newClock');
    loginInput.addEventListener('input', nameOnH2);

    rotateBarsHorizontal();
    hoverBox.remove();
  });

  loginForm.addEventListener('submit', onLoginSubmit);
} else {
  ready();
  if (!isWeatherDone) {
    rotateBarsDiagonal();
    triggerBarColorChange();
  }
}
