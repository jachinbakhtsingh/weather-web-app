const API_KEY = "a17693a6d435c2ef65d699b9bb5649a2"; 

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locBtn = document.getElementById('loc-btn');
const recentBtn = document.getElementById('recent-btn');
const recentDropdown = document.getElementById('recent-dropdown');
const messageEl = document.getElementById('message');

const locationNameEl = document.getElementById('location-name');
const localTimeEl = document.getElementById('local-time');
const tempDisplayEl = document.getElementById('temp-display');
const weatherDescEl = document.getElementById('weather-desc');
const weatherIconEl = document.getElementById('weather-icon');
const feelsEl = document.getElementById('feels');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const forecastCards = document.getElementById('forecast-cards');
const unitToggle = document.getElementById('unit-toggle');
const alertSlot = document.getElementById('alert-slot');

const RECENT_KEY = 'recentCities_v1';

function showMessage(text, type='info') {
  messageEl.innerHTML = `<div class="p-3 rounded ${type === 'error' ? 'bg-rose-100 text-rose-800' : 'bg-sky-50 text-sky-700'}">${text}</div>`;
  setTimeout(()=> { messageEl.innerHTML = ''; }, 6000);
}

function setRecent(city) {
  let arr = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  arr = arr.filter(c => c.toLowerCase() !== city.toLowerCase());
  arr.unshift(city);
  if (arr.length > 6) arr.pop();
  localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
  renderRecent();
}

function renderRecent() {
  const arr = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  if (arr.length === 0) {
    recentDropdown.innerHTML = '<div class="p-2 text-sm text-slate-500">No recent searches</div>';
    return;
  }
  recentDropdown.innerHTML = arr.map(city => `<div class="px-3 py-2 cursor-pointer hover:bg-slate-100" data-city="${city}">${city}</div>`).join('');
  // attach click handlers
  recentDropdown.querySelectorAll('[data-city]').forEach(el => {
    el.addEventListener('click', () => {
      fetchWeatherByCity(el.dataset.city);
      recentDropdown.classList.add('hidden');
    });
  });
}

// Toggle recent dropdown
recentBtn.addEventListener('click', () => {
  recentDropdown.classList.toggle('hidden');
  renderRecent();
});

document.addEventListener('click', (e) => {
  if (!recentBtn.contains(e.target) && !recentDropdown.contains(e.target)) {
    recentDropdown.classList.add('hidden');
  }
});

// Search button
searchBtn.addEventListener('click', () => {
  const q = cityInput.value.trim();
  if (!q) {
    showMessage('Please enter a city name.', 'error');
    return;
  }
  fetchWeatherByCity(q);
});

// Enter key
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

// Geolocation
locBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showMessage('Geolocation not supported by your browser.', 'error');
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    fetchWeatherByCoords(lat, lon);
  }, (err) => {
    showMessage('Unable to retrieve location. Allow location permissions.', 'error');
  });
});

// Unit toggle only affects today's displayed temperature (Celsius by default)
function displayTempCelsius(tempC) {
  const inC = Math.round(tempC);
  tempDisplayEl.textContent = `${inC}°C`;
}
function displayTempFahrenheit(tempC) {
  const f = Math.round(tempC * 9/5 + 32);
  tempDisplayEl.textContent = `${f}°F`;
}

// Using OpenWeatherMap endpoints
async function fetchWeatherByCity(city) {
  try {
    clearUI();
    showMessage(`Fetching weather for ${city}...`, 'info');
    // fetch current weather (get lat/lon)
    const curRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
    if (!curRes.ok) {
      const err = await curRes.json().catch(()=>({message:curRes.statusText}));
      throw new Error(err.message || 'City not found');
    }
    const curData = await curRes.json();
    const { coord } = curData;
    setRecent(curData.name);
    await fetchAndRender(curData, coord.lat, coord.lon);
  } catch (err) {
    showMessage(`Error: ${err.message}`, 'error');
  }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    clearUI();
    showMessage('Fetching weather for your location...', 'info');
    const curRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    if (!curRes.ok) throw new Error('Failed to fetch current weather for coordinates');
    const curData = await curRes.json();
    setRecent(curData.name);
    await fetchAndRender(curData, lat, lon);
  } catch (err) {
    showMessage(`Error: ${err.message}`, 'error');
  }
}

async function fetchAndRender(currentData, lat, lon) {
  try {
    // Fetch 5-day forecast
    const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    if (!fRes.ok) throw new Error('Failed to fetch forecast');
    const fData = await fRes.json();

    renderCurrent(currentData);
    renderForecast(fData);
    showMessage('Weather updated.', 'info');
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

function clearUI(){
  locationNameEl.textContent = '—';
  localTimeEl.textContent = '—';
  tempDisplayEl.textContent = '--°';
  weatherDescEl.textContent = '—';
  weatherIconEl.src = '';
  feelsEl.textContent = '—';
  humidityEl.textContent = '—';
  windEl.textContent = '—';
  forecastCards.innerHTML = '';
  alertSlot.innerHTML = '';
  document.body.style.background = ''; // reset
}

function renderCurrent(data) {
  const name = `${data.name}, ${data.sys?.country || ''}`;
  locationNameEl.textContent = name;
  const localTime = new Date((data.dt + data.timezone) * 1000).toUTCString(); // approximate local time
  localTimeEl.textContent = localTime;
  const tempC = data.main.temp;
  // toggle display
  if (unitToggle.checked) displayTempFahrenheit(tempC);
  else displayTempCelsius(tempC);

  weatherDescEl.textContent = data.weather?.[0]?.description || '';
  const icon = data.weather?.[0]?.icon || '';
  weatherIconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  feelsEl.textContent = `${Math.round(data.main.feels_like)}°C`;
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${Math.round(data.wind.speed)} m/s`;

  // custom alerts for extreme temps (Celsius)
  if (tempC >= 40) {
    alertSlot.innerHTML = `<span class="alert-badge">Extreme heat alert: ${Math.round(tempC)}°C</span>`;
  } else if (tempC <= -5) {
    alertSlot.innerHTML = `<span class="alert-badge">Extreme cold alert: ${Math.round(tempC)}°C</span>`;
  }

  // Dynamic background for rainy weather
  const mainCond = (data.weather?.[0]?.main || '').toLowerCase();
  if (mainCond.includes('rain')) {
    document.body.style.background = 'linear-gradient(180deg,#0f172a,#0b1220)';
  } else if (mainCond.includes('cloud')) {
    document.body.style.background = 'linear-gradient(180deg,#cbd5e1,#e2e8f0)';
  } else {
    document.body.style.background = 'linear-gradient(180deg,#fef3c7,#fff7ed)';
  }
}

// build 5-day forecast from 3-hour data: we pick one representative per day (midday) and compute daily aggregates
function renderForecast(fdata) {
  // fdata.list contains 3-hour step forecast entries
  const list = fdata.list || [];
  const daysMap = {};

  list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toISOString().slice(0,10);
    if (!daysMap[dayKey]) daysMap[dayKey] = [];
    daysMap[dayKey].push(item);
  });

  // Convert map to array and skip today if you want only next 5 days (but assignment expects 5-day including today often)
  const days = Object.keys(daysMap).slice(0,5);

  forecastCards.innerHTML = days.map(dayKey => {
    const items = daysMap[dayKey];
    // take midday item or first
    const midday = items[Math.floor(items.length/2)];
    // compute avg temp, max, humidity & wind
    const temps = items.map(i => i.main.temp);
    const avgTemp = Math.round(temps.reduce((a,b)=>a+b,0)/temps.length);
    const maxTemp = Math.round(Math.max(...temps));
    const minTemp = Math.round(Math.min(...temps));
    const avgHum = Math.round(items.reduce((a,b)=>a+b.main.humidity,0)/items.length);
    const avgWind = Math.round(items.reduce((a,b)=>a+b.wind.speed,0)/items.length);

    const icon = (midday && midday.weather && midday.weather[0] && midday.weather[0].icon) ? midday.weather[0].icon : '';
    const desc = (midday && midday.weather && midday.weather[0] && midday.weather[0].description) ? midday.weather[0].description : '';
    const dateObj = new Date(dayKey);
    const dateLabel = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    return `
      <div class="p-3 border rounded flex items-center justify-between">
        <div>
          <div class="text-sm text-slate-500">${dateLabel}</div>
          <div class="font-medium">${desc}</div>
        </div>
        <div class="text-right">
          <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" />
          <div class="text-sm">${avgTemp}°C</div>
          <div class="text-xs text-slate-500">H:${maxTemp} L:${minTemp}</div>
          <div class="text-xs text-slate-500">💧 ${avgHum}% • 🍃 ${avgWind} m/s</div>
        </div>
      </div>
    `;
  }).join('');
}

// Re-render today's temp echo on toggle change (only today's temp is toggled per requirement)
unitToggle.addEventListener('change', () => {
  // Try to re-render current displayed temp using numeric value in tempDisplay or stored last data (simple approach: re-fetch current location if name exists)
  const locName = locationNameEl.textContent;
  if (locName && locName !== '—') {
    // attempt to re-fetch using city in locationNameEl (strip country)
    const city = locName.split(',')[0];
    if (city) {
      // Call current weather only (lighter)
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
        .then(r => r.json())
        .then(data => {
          if (unitToggle.checked) displayTempFahrenheit(data.main.temp);
          else displayTempCelsius(data.main.temp);
        })
        .catch(()=>{});
    }
  }
});


renderRecent();
