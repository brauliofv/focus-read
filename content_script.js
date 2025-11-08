// --- ESTADO GLOBAL ---
let readingInterval = null;
let originalRangeContent = null;
let cleanupRange = null; 
let wordsElements = [];
let currentWordIndex = 0;
let isPaused = false;

// --- CONSTANTES DE CLASES CSS ---
const HIGHLIGHT_CLASS_LIGHT = 'focus-read-highlight-light';
const HIGHLIGHT_CLASS_DARK = 'focus-read-highlight-dark';
const HIGHLIGHT_CLASS_PAUSED = 'focus-read-highlight-paused'; // --- NUEVA CONSTANTE ---
let highlightClassToUse = HIGHLIGHT_CLASS_LIGHT;

const togglePauseResume = () => {
  if (isPaused) {
    resumeReading();
  } else {
    pauseReading();
  }
};

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .${HIGHLIGHT_CLASS_LIGHT} { background-color: yellow !important; color: black !important; box-shadow: 0 0 5px rgba(0,0,0,0.5) !important; border-radius: 3px; transition: background-color 0.2s; }
    .${HIGHLIGHT_CLASS_DARK} { background-color: #0d94e4 !important; color: white !important; box-shadow: 0 0 5px rgba(255,255,255,0.5) !important; border-radius: 3px; transition: background-color 0.2s; }
    
    /* --- NUEVO ESTILO PARA LA PAUSA --- */
    .${HIGHLIGHT_CLASS_PAUSED} {
      background-color: #FFA500 !important; /* Color Naranja */
      color: black !important;
      box-shadow: 0 0 5px rgba(0,0,0,0.5) !important;
      border-radius: 3px;
      transition: background-color 0.2s;
    }
  `;
  document.head.appendChild(style);
}

function stopReading() {
  if (readingInterval) clearInterval(readingInterval);
  document.removeEventListener('click', togglePauseResume); 

  if (cleanupRange && originalRangeContent) {
    cleanupRange.deleteContents();
    cleanupRange.insertNode(originalRangeContent);
  }
  readingInterval = null;
  wordsElements = [];
  currentWordIndex = 0;
  originalRangeContent = null;
  cleanupRange = null;
  isPaused = false;
}

function pauseReading() {
  if (!readingInterval) return; 
  
  isPaused = true;
  clearInterval(readingInterval);
  readingInterval = null; 
  
  // --- LÓGICA DE CAMBIO DE COLOR ---
  // La palabra actualmente visible es la anterior al 'currentWordIndex'
  if (currentWordIndex > 0) {
    const pausedElement = wordsElements[currentWordIndex - 1];
    // Le quitamos las clases de resaltado normales.
    pausedElement.classList.remove(HIGHLIGHT_CLASS_LIGHT, HIGHLIGHT_CLASS_DARK);
    // Le añadimos la clase de pausa.
    pausedElement.classList.add(HIGHLIGHT_CLASS_PAUSED);
  }
  
  console.log("FocusRead: Pausado.");
}

async function resumeReading() {
  if (!isPaused) return;
  
  isPaused = false;
  console.log("FocusRead: Reanudando...");

  const settings = await chrome.storage.sync.get({ ppm: 250 });
  const PPM = settings.ppm;
  const intervalTime = (60 / PPM) * 1000;

  // Al reanudar, no cambiamos el color aquí.
  // La función highlightNextWord se encargará de limpiar el naranja
  // y poner el color correcto a la siguiente palabra.
  
  readingInterval = setInterval(highlightNextWord, intervalTime);
}

async function startFocusReading() {
  stopReading();

  const settings = await chrome.storage.sync.get({ ppm: 250 });
  const PPM = settings.ppm;

  const selection = window.getSelection();
  if (!selection.rangeCount || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString();
  
  originalRangeContent = range.cloneContents();

  let parentElement = range.commonAncestorContainer;
  if (parentElement.nodeType === Node.TEXT_NODE) parentElement = parentElement.parentNode;
  const bgColor = window.getComputedStyle(parentElement).backgroundColor;
  const rgb = bgColor.match(/\d+/g);
  if (rgb) {
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]);
    highlightClassToUse = luminance < 128 ? HIGHLIGHT_CLASS_DARK : HIGHLIGHT_CLASS_LIGHT;
  }

  const words = selectedText.trim().split(/\s+/).filter(word => word.length > 0);
  if (words.length === 0) return;

  range.deleteContents();

  words.forEach((word, index) => {
    const span = document.createElement('span');
    span.textContent = word;
    wordsElements.push(span);
    range.insertNode(span);
    if (index < words.length - 1) {
      const space = document.createTextNode(' ');
      range.insertNode(space);
    }
    range.collapse(false);
  });
  
  selection.removeAllRanges();

  cleanupRange = document.createRange();
  cleanupRange.setStartBefore(wordsElements[0]);
  cleanupRange.setEndAfter(wordsElements[wordsElements.length - 1]);

  const intervalTime = (60 / PPM) * 1000;
  // Llamamos a highlightNextWord una vez de inmediato para resaltar la primera palabra sin demora.
  highlightNextWord(); 
  readingInterval = setInterval(highlightNextWord, intervalTime);

  document.addEventListener('click', togglePauseResume);
}

function highlightNextWord() {
  // --- LÓGICA DE LIMPIEZA ACTUALIZADA ---
  // Nos aseguramos de quitar CUALQUIER clase de resaltado (normal o de pausa) de la palabra anterior.
  if (currentWordIndex > 0) {
    wordsElements[currentWordIndex - 1].classList.remove(HIGHLIGHT_CLASS_LIGHT, HIGHLIGHT_CLASS_DARK, HIGHLIGHT_CLASS_PAUSED);
  }

  if (currentWordIndex >= wordsElements.length) {
    stopReading();
    return;
  }
  
  const currentWordElement = wordsElements[currentWordIndex];
  currentWordElement.classList.add(highlightClassToUse);
  currentWordElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  currentWordIndex++;
}

injectStyles();
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "startReading") {
    startFocusReading();
  }
});