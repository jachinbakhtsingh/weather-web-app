const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locBtn = document.getElementById('loc-btn');
const recentBtn = document.getElementById('recent-btn');
const recentDropdown = document.getElementById('recent-dropdown');
const messageEl = document.getElementById('message');



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

