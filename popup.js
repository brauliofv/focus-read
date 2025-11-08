const ppmSlider = document.getElementById('ppmSlider');
const ppmValueSpan = document.getElementById('ppmValue');

// --- CARGAR EL VALOR GUARDADO ---
// Cuando el popup se abre, pedimos a Chrome el valor de 'ppm' que tenemos guardado.
chrome.storage.sync.get(['ppm'], (result) => {
  // Si hay un valor guardado, lo usamos. Si no, usamos 250 por defecto.
  const savedPpm = result.ppm || 250;
  ppmSlider.value = savedPpm;
  ppmValueSpan.textContent = savedPpm;
});

// --- GUARDAR EL VALOR AL CAMBIAR ---
// Añadimos un 'escuchador' que se activa cada vez que el usuario mueve el deslizador.
ppmSlider.addEventListener('input', () => {
  const newPpm = ppmSlider.value;
  ppmValueSpan.textContent = newPpm;
  
  // Guardamos el nuevo valor en el almacenamiento de Chrome.
  // 'chrome.storage.sync' lo sincronizará entre los dispositivos del usuario.
  chrome.storage.sync.set({ ppm: newPpm });
});