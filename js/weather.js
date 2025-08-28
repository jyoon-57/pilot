const API_KEY = 'dd1dafc203315b30d93b9256e7e10eb2';

const weatherEl = document.getElementById('weather');
const icon = document.getElementById('icon');
const tempEl = document.getElementById('temp');

/* Weather font-size */
const BASE_W = 1920;
const BASE_WEATHER_SIZE = 200;
const BASE_ICON_SIZE = 130;
const BASE_TEMP_SIZE = 160;

/* ───── OpenWeather → 우리 레이블/아이콘 매핑 표 ───── */
const MAP = {
  sunny: { label: 'Sunny', file: 'sunny.png' }, // Clear
  cloudy: { label: 'Cloudy', file: 'cloudy.png' }, // Clouds
  rainy: { label: 'Rainy', file: 'rainy.png' }, // Rain·Drizzle·Thunderstorm·Squall·Tornado
  snowy: { label: 'Snowy', file: 'snowy.png' }, // Snow
  foggy: { label: 'Foggy', file: 'foggy.png' }, // Mist·Smoke·Haze·Dust·Fog·Sand·Ash
  unknown: { label: '––', file: 'cloudy.png' }, // 예외
};

/* 각 main 을 우리 키(sunny, rainy …)로 변환 */
function mainToKey(main) {
  switch (main) {
    case 'clear':
      return 'sunny';
    case 'clouds':
      return 'cloudy';
    case 'rain':
    case 'drizzle':
    case 'thunderstorm':
    case 'squall':
    case 'tornado':
      return 'rainy';
    case 'snow':
      return 'snowy';
    case 'mist':
    case 'smoke':
    case 'haze':
    case 'dust':
    case 'fog':
    case 'sand':
    case 'ash':
      return 'foggy';
    default:
      return 'unknown';
  }
}

/* ───── 새로고침 시 상태 불러오기 ───── */
function restoreWeatherFromStorage() {
  const savedLabel = localStorage.getItem('wx_label');
  const savedTemp = localStorage.getItem('wx_temp');
  const savedIcon = localStorage.getItem('wx_icon');
  const weatherDone = localStorage.getItem('weather-done');

  if (weatherDone) {
    if (savedLabel) weatherEl.textContent = savedLabel;
    if (savedTemp) tempEl.textContent = savedTemp;
    if (savedIcon) {
      icon.src = savedIcon;
      icon.alt = savedLabel || 'weather';
    }
  }
}

// 모듈 로드 직후 즉시 반영
restoreWeatherFromStorage();

/* ───── geolocation 성공 콜백 ───── */
function onGeoOk(pos) {
  const { latitude: lat, longitude: lon } = pos.coords;
  // 아래 두 변수를 한 번에 선언한 것
  // const lat = pos.coords.latitude;
  // const lon = pos.coords.longitude;

  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  )
    .then((r) => r.json())
    .then((data) => {
      const key = mainToKey(data.weather[0].main.toLowerCase());
      const label = MAP[key].label;
      const file = MAP[key].file;
      const date = new Date();

      /* DOM 업데이트 */
      if (label === 'Sunny' && date.getHours() >= 19) {
        icon.src = `/assets/icons/moonlit.png`;
        icon.alt = label;
        weatherEl.textContent = 'moonlit';
      } else {
        icon.src = `/assets/icons/${file}`;
        icon.alt = label;
        weatherEl.textContent = label;
      }

      tempEl.textContent = `${Math.round(data.main.temp)}°C`;

      localStorage.setItem('wx_label', weatherEl.textContent);
      localStorage.setItem('wx_temp', tempEl.textContent);
      localStorage.setItem('wx_icon', icon.src);
    })
    .catch(console.error);

  setWeatherFont();
  setIconSize();
}

function setWeatherFont() {
  const scale = Math.max(window.innerWidth, window.innerHeight) / BASE_W;
  const weatherSize = BASE_WEATHER_SIZE * scale;
  const tempSize = BASE_TEMP_SIZE * scale;
  const minWeather = Math.max(100, weatherSize);
  const minTemp = Math.max(100, tempSize);

  document.getElementById('weather').style.fontSize = `${minWeather}px`;
  document.getElementById('temp').style.fontSize = `${minTemp}px`;
}

function setIconSize() {
  const scale = Math.max(window.innerWidth, window.innerHeight) / BASE_W;
  const size = BASE_ICON_SIZE * scale;

  document.getElementById('icon').style.height = `${size}px`;
}

function onGeoError() {
  alert("Can't find you. No weather for you.");
}

navigator.geolocation.getCurrentPosition(onGeoOk, onGeoError);

window.addEventListener('resize', () => {
  setWeatherFont();
  setIconSize();
});
