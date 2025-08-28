const clock1 = document.querySelector('h2#clock1');
const clock2 = document.querySelector('h2#clock2');
const clock3 = document.querySelector('h2#clock3');
const clockWrapper = document.querySelector('div.clock-wrapper');
let isClockFrozen = false;

function timeKeeper1() {
  if (isClockFrozen) return;
  const date = new Date(Date.now() - 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  clock1.innerText = `${hours} ${minutes} ${seconds}`;
}

timeKeeper1();
setInterval(timeKeeper1, 1000);

function timeKeeper2() {
  if (isClockFrozen) return;
  const date = new Date();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  clock2.innerText = `${hours} ${minutes} ${seconds}`;
}

timeKeeper2();
setInterval(timeKeeper2, 1000);

function timeKeeper3() {
  if (isClockFrozen) return;
  const date = new Date(Date.now() + 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  clock3.innerText = `${hours} ${minutes} ${seconds}`;
}

timeKeeper3();
setInterval(timeKeeper3, 1000);

export function clockToLogin() {
  isClockFrozen = true;

  clock1.classList.add('fade-out');
  clock2.classList.add('fade-out');
  clock3.classList.add('fade-out');

  setTimeout(() => {
    clock1.innerText = 'name of';
    clock1.classList.remove('fade-out');
    clock1.classList.add('fade-in');

    clock2.innerHTML = '&nbsp;';
    clock2.classList.remove('fade-out');

    clock3.innerText = 'our pilot';
    clock3.classList.remove('fade-out');
    clock3.classList.add('fade-in');
  }, 250);
}

export function loginToReady() {
  isClockFrozen = true;

  clock1.classList.remove('fade-in');
  clock3.classList.remove('fade-in');
  clock1.classList.add('fade-out');
  clock3.classList.add('fade-out');

  setTimeout(() => {
    clock1.innerText = 'ready to fly';
    clock1.classList.remove('fade-out');
    clock1.classList.add('fade-in');
    clock1.classList.add('ready-font');
  }, 250);
}

export function ready() {
  isClockFrozen = true;

  clock1.innerText = 'ready to fly';
  clock1.classList.add('ready-font');
  clock2.innerText = localStorage.getItem('username');
  clock3.classList.add('hide');
}
