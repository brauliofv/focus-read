const ppmSlider = document.getElementById('ppmSlider');
const ppmValueSpan = document.getElementById('ppmValue');
const resetButton = document.getElementById('resetButton'); // Obtenemos el nuevo botón

const DEFAULT_PPM = 250;

// --- CARGAR EL VALOR GUARDADO ---
chrome.storage.sync.get({ ppm: DEFAULT_PPM }, (result) => {
  ppmSlider.value = result.ppm;
  ppmValueSpan.textContent = result.ppm;
});

// --- GUARDAR EL VALOR AL CAMBIAR EL SLIDER ---
ppmSlider.addEventListener('input', () => {
  const newPpm = ppmSlider.value;
  ppmValueSpan.textContent = newPpm;
  chrome.storage.sync.set({ ppm: parseInt(newPpm, 10) });
});

// --- MANEJAR EL CLIC EN EL BOTÓN DE RESTAURAR ---
resetButton.addEventListener('click', () => {
  ppmSlider.value = DEFAULT_PPM;
  ppmValueSpan.textContent = DEFAULT_PPM;
  chrome.storage.sync.set({ ppm: DEFAULT_PPM });
});