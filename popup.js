document.addEventListener('DOMContentLoaded', () => {
  const ppmSlider = document.getElementById('ppmSlider');
  const ppmValueSpan = document.getElementById('ppmValue');
  const colorSwatches = document.querySelectorAll('.color-swatch');
  const donateButton = document.getElementById('donateButton');

  const DEFAULTS = {
    ppm: 250,
    color: 'amarillo'
    // Se elimina fontSize
  };

  // Cargar todas las configuraciones guardadas al abrir
  chrome.storage.sync.get(DEFAULTS, (settings) => {
    // Actualizar PPM
    ppmSlider.value = settings.ppm;
    ppmValueSpan.textContent = settings.ppm;

    // Actualizar selección de color
    updateSelectedUI(colorSwatches, 'color', settings.color);
  });

  // Guardar PPM
  ppmSlider.addEventListener('input', () => {
    const newPpm = ppmSlider.value;
    ppmValueSpan.textContent = newPpm;
    chrome.storage.sync.set({ ppm: parseInt(newPpm, 10) });
  });

  // Guardar color
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const newColor = swatch.dataset.color;
      updateSelectedUI(colorSwatches, 'color', newColor);
      chrome.storage.sync.set({ color: newColor });
    });
  });

  // Botón de donar
  donateButton.addEventListener('click', () => {
    window.open('https://www.buymeacoffee.com/TU_USUARIO', '_blank');
  });

  // Función de ayuda para actualizar la UI
  function updateSelectedUI(elements, dataAttribute, value) {
    elements.forEach(el => {
      if (el.dataset[dataAttribute] === value) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }
});