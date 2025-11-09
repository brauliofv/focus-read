// --- ESTADO GLOBAL ---
let timeoutId = null;
let originalRangeContent = null, cleanupRange = null; 
let wordsElements = [], currentWordIndex = 0, isPaused = false;

// --- MAPA DE COLORES y CONFIGURACIÓN ---
const COLOR_MAP = {
  'amarillo': { bg: '#ffd966', text: '#000000' }, 'celeste':  { bg: '#0d94e4', text: '#ffffff' },
  'verde':    { bg: '#93c47d', text: '#000000' }, 'magenta':  { bg: '#e06666', text: '#ffffff' }
};
const PAUSED_COLOR = { bg: '#FFA500', text: '#000000' };
let userSettings = { ppm: 250, color: 'amarillo' }; // Se elimina fontSize

// --- CONSTANTES DE PAUSA INTELIGENTE ---
const COMMA_DELAY_MS = 150;
const SENTENCE_END_DELAY_MS = 300;
const PARAGRAPH_BREAK_DELAY_MS = 450;

const togglePauseResume = () => isPaused ? resumeReading() : pauseReading();

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `.focus-read-word-base { transition: all 0.1s ease-in-out; border-radius: 3px; padding: 0 2px; }`;
  document.head.appendChild(style);
}

function stopReading() {
  if (timeoutId) clearTimeout(timeoutId);
  document.removeEventListener('click', togglePauseResume); 
  if (cleanupRange && originalRangeContent) {
    cleanupRange.deleteContents();
    cleanupRange.insertNode(originalRangeContent);
  }
  timeoutId = null, wordsElements = [], currentWordIndex = 0;
  originalRangeContent = null, cleanupRange = null, isPaused = false;
}

function pauseReading() {
  if (!timeoutId || isPaused) return; 
  isPaused = true;
  clearTimeout(timeoutId);
  timeoutId = null; 
  if (currentWordIndex > 0) {
    const pausedElement = wordsElements[currentWordIndex - 1];
    if (pausedElement.dataset.type !== 'paragraph_break') {
      pausedElement.style.backgroundColor = PAUSED_COLOR.bg;
      pausedElement.style.color = PAUSED_COLOR.text;
    }
  }
}

async function resumeReading() {
  if (!isPaused) return;
  isPaused = false;
  await loadSettings();
  highlightNextWord();
}

async function loadSettings() {
  userSettings = await chrome.storage.sync.get({ ppm: 250, color: 'amarillo' });
}

async function startFocusReading() {
  stopReading();
  await loadSettings();

  const selection = window.getSelection();
  if (!selection.rangeCount || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  originalRangeContent = range.cloneContents();

  const words = [];
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNodes = node.textContent.trim().split(/\s+/).filter(w => w.length > 0);
      textNodes.forEach(text => words.push({ text, type: 'word' }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toUpperCase();
      if (['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'BR'].includes(tagName)) {
        if (words.length > 0 && words[words.length - 1].type !== 'paragraph_break') {
          words.push({ text: '', type: 'paragraph_break' });
        }
      }
      node.childNodes.forEach(processNode);
    }
  }
  const fragment = range.cloneContents();
  fragment.childNodes.forEach(processNode);
  if (words.length > 0 && words[0].type === 'paragraph_break') words.shift();
  if (words.length === 0) return;

  range.deleteContents();
  words.forEach(wordObj => {
    const span = document.createElement('span');
    span.textContent = wordObj.text;
    span.dataset.type = wordObj.type;
    span.classList.add('focus-read-word-base');
    if (wordObj.type === 'paragraph_break') {
      span.style.display = 'block';
      span.style.width = '100%';
      span.style.height = '0.7em';
    }
    wordsElements.push(span);
    range.insertNode(span);
    if (wordObj.type === 'word') range.insertNode(document.createTextNode(' '));
    range.collapse(false);
  });
  selection.removeAllRanges();

  cleanupRange = document.createRange();
  cleanupRange.setStartBefore(wordsElements[0]);
  cleanupRange.setEndAfter(wordsElements[wordsElements.length - 1]);
  
  highlightNextWord();
  document.addEventListener('click', togglePauseResume);
}

function highlightNextWord() {
  if (currentWordIndex > 0) {
    const prevElement = wordsElements[currentWordIndex - 1];
    prevElement.style.backgroundColor = '';
    prevElement.style.color = '';
    // Se elimina la limpieza del fontSize
  }

  if (currentWordIndex >= wordsElements.length) {
    stopReading();
    return;
  }
  
  const currentWordElement = wordsElements[currentWordIndex];
  const wordText = currentWordElement.textContent;
  const wordType = currentWordElement.dataset.type;

  if (wordType === 'word') {
    const highlightColor = COLOR_MAP[userSettings.color] || COLOR_MAP.amarillo;
    currentWordElement.style.backgroundColor = highlightColor.bg;
    currentWordElement.style.color = highlightColor.text;
    // Se elimina la aplicación del fontSize
    currentWordElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }

  let nextDelay = (60 / userSettings.ppm) * 1000;
  if (wordType === 'paragraph_break') {
    nextDelay += PARAGRAPH_BREAK_DELAY_MS;
  } else if (/[.,;?!]$/.test(wordText)) {
    nextDelay += SENTENCE_END_DELAY_MS;
  } else if (/,$/.test(wordText)) {
    nextDelay += COMMA_DELAY_MS;
  }

  currentWordIndex++;
  timeoutId = setTimeout(highlightNextWord, nextDelay);
}

// --- PUNTO DE ENTRADA ---
injectStyles();
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "startReading") {
    startFocusReading();
  }
});