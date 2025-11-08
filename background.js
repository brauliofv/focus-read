// --- COMENTARIO GENERAL ---
// Este script no tiene acceso directo a la página web (al DOM).
// Su trabajo es coordinar acciones a nivel del navegador.

// Evento que se dispara cuando la extensión se instala o actualiza por primera vez.
chrome.runtime.onInstalled.addListener(() => {
  // Creamos una entrada en el menú contextual (clic derecho).
  chrome.contextMenus.create({
    id: "startFocusRead", // Un identificador único para nuestra opción de menú.
    title: "Iniciar lectura con FocusRead", // El texto que verá el usuario.
    contexts: ["selection"] // Esta opción solo aparecerá cuando el usuario haya seleccionado texto.
  });
});

// Evento que se dispara cuando se hace clic en una opción del menú contextual.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Verificamos que el clic se hizo en nuestra opción del menú.
  if (info.menuItemId === "startFocusRead") {
    // 'info.selectionText' contiene el texto que el usuario seleccionó.
    const selectedText = info.selectionText;

    // Enviamos un mensaje a nuestro 'content_script.js' que se está ejecutando en la pestaña activa.
    // El mensaje es un objeto que contiene el texto seleccionado.
    chrome.tabs.sendMessage(tab.id, {
      action: "startReading",
      text: selectedText
    });
  }
});