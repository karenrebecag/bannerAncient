/* 
===========================================================
   1. CONSTANTES Y VARIABLES
===========================================================
*/
const ANCIENT_ENDPOINT_URL = 'https://ancient.app.n8n.cloud/webhook/84e653aa-65b2-49c0-9a12-4a86256b4744';
const GPT_FALLBACK_URL = 'https://hook.us2.make.com/pdfv8gwculdpuw3pyl82x33mput2gj73';

let selectedLanguage = window.location.pathname.includes("/en") ? "en" : "es";

const translations = {
  titlePart1: {
    es: "Soluciones impulsadas por IA para ",
    en: "AI-Powered Solutions for a "
  },
  titlePart2: {
    es: "un futuro más inteligente",
    en: "Smarter Future"
  },
  descriptionMainBanner: {
    es: "Desplegando software de vanguardia que transforma industrias, impulsa el progreso y redefine el mañana.",
    en: "Deploying cutting-edge software that reshapes industries, fuels progress, and redefines tomorrow."
  },
  promptPlaceholder: {
    es: "¡Hola! ¿Cómo puedo ayudarte?",
    en: "Hello! How can I help you?"
  },
  responseError: {
    es: "Ocurrió un error. Por favor, intenta nuevamente.",
    en: "An error occurred. Please try again."
  }
};

/* 
===========================================================
   2. SELECCIÓN DE ELEMENTOS DEL DOM
===========================================================
*/
const bannerInitial = document.getElementById('banner-initial');
const bannerLoading = document.getElementById('banner-loading');
const bannerSecondary = document.getElementById('banner-secondary');

const formInitial = document.getElementById('chat-form');
const promptInput = document.getElementById('prompt');

const formSecondary = document.getElementById('chat-form-secondary');
const promptInputSecondary = document.getElementById('prompt-secondary');

const messagesContainer = document.getElementById('messages');
const closeChatBtn = document.getElementById('close-chat-btn');

/* 
===========================================================
   3. FUNCIONES AUXILIARES: SONIDO DE MENSAJE (DESHABILITADO)
===========================================================
*/
function playMessageSound() {
  // Sonido deshabilitado.
  // const audio = new Audio('https://static.wixstatic.com/mp3/bc0394_f09c7b0a29174d308f1aef45b8c09a26.mp3');
  // audio.volume = 0.1;
  // audio.play();
}

/* 
===========================================================
   4. FUNCIONES PARA LAS BURBUJAS DE CHAT Y TYPEWRITER
===========================================================
*/
function creaBurbuja(role, message) {
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble', role);
  bubble.textContent = message;
  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  playMessageSound();
}

function creaBurbujaConTypewriter(text) {
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble', 'ai');
  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  playMessageSound();
  typeWriter(bubble, text);
}

function typeWriter(element, text) {
  const speed = 15; // milisegundos por carácter
  let i = 0;
  element.textContent = '';
  function typing() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }
  typing();
}

/* 
===========================================================
   5. FUNCIONES PARA LA BURBUJA LOADER (3 PUNTITOS)
===========================================================
*/
function creaLoaderBubble() {
  const loaderBubble = document.createElement('div');
  loaderBubble.classList.add('chat-bubble', 'ai', 'loader-bubble');
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.classList.add('dot-typing');
    loaderBubble.appendChild(dot);
  }
  messagesContainer.appendChild(loaderBubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return loaderBubble;
}

function removeLoaderBubble(bubble) {
  if (bubble && bubble.parentNode) {
    bubble.parentNode.removeChild(bubble);
  }
}

/* 
===========================================================
   6. FETCH A ANCIENT (N8N) + FALLBACK A GPT
===========================================================
*/
async function handleAncientResponse(prompt) {
  const loader = creaLoaderBubble();
  try {
    const response = await fetch(ANCIENT_ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt })
    });
    const result = await response.json();
    removeLoaderBubble(loader);
    if (result && result.answer) {
      changeState(bannerSecondary).then(() => {
        creaBurbujaConTypewriter(result.answer);
      });
    } else {
      fetchGPTResponse(prompt);
    }
  } catch (error) {
    console.error('Error consultando Ancient:', error);
    removeLoaderBubble(loader);
    fetchGPTResponse(prompt);
  }
}

async function fetchGPTResponse(prompt) {
  const loader = creaLoaderBubble();
  const data = { prompt, max_tokens: 256 };
  try {
    const response = await fetch(GPT_FALLBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.text();
    removeLoaderBubble(loader);
    changeState(bannerSecondary).then(() => {
      creaBurbujaConTypewriter(result.trim());
    });
  } catch (error) {
    console.error('Error en GPT:', error);
    removeLoaderBubble(loader);
    changeState(bannerSecondary).then(() => {
      creaBurbuja('ai', translations.responseError[selectedLanguage]);
    });
  }
}

/* 
===========================================================
   7. EVENTOS DE SUBMIT
===========================================================
*/
// --- SUBMIT DEL INITIAL STATE ---
// Al hacer submit en el initial state se dispara una animación específica de salida (submit-fade-out)
// que es un 50% más rápida (1s) con un pequeño delay para que la animación finalice antes de cambiar al estado loading.
formInitial.addEventListener('submit', (e) => {
  e.preventDefault();
  const userPrompt = promptInput.value.trim();
  if (!userPrompt) return;
  
  // Inicia la animación específica de salida para submit
  animateSubmitExit();
  
  // Espera la duración de la animación (1s) más un delay extra (200ms) antes de cambiar el estado.
  setTimeout(() => {
    changeState(bannerLoading).then(() => {
      setTimeout(() => {
        creaBurbuja('user', userPrompt);
        handleAncientResponse(userPrompt);
      }, 500);
    });
  }, 1200);
  
  promptInput.value = '';
});

// --- SUBMIT DEL SECONDARY STATE ---
if (formSecondary) {
  formSecondary.addEventListener('submit', (e) => {
    e.preventDefault();
    const userPrompt = promptInputSecondary.value.trim();
    if (!userPrompt) return;
    creaBurbuja('user', userPrompt);
    handleAncientResponse(userPrompt);
    promptInputSecondary.value = '';
  });
}

/* 
===========================================================
   8. TRANSICIONES CON ANIMACIONES (DOBLE ESTADO)
===========================================================
Se mantiene el contenedor actual visible mientras el nuevo aparece.
===========================================================
*/
function getActiveState() {
  if (bannerInitial.classList.contains("active")) return bannerInitial;
  if (bannerLoading.classList.contains("active")) return bannerLoading;
  if (bannerSecondary.classList.contains("active")) return bannerSecondary;
  return null;
}

/**
 * Función para animar la entrada interna de los elementos del estado SECONDARY.
 * NOTA: Esta animación se ejecutará solo si se cambia de otro estado a secondary.
 */
function animateSecondaryEntry() {
  const secondaryContainer = document.querySelector('.secondary-container');
  const secondaryOverlay = document.querySelector('.secondary-overlay');

  if (secondaryContainer) {
    secondaryContainer.classList.add('internal-fade-in');
    secondaryContainer.addEventListener('animationend', function handler() {
      secondaryContainer.classList.remove('internal-fade-in');
      secondaryContainer.removeEventListener('animationend', handler);
    });
  }
  if (secondaryOverlay) {
    secondaryOverlay.classList.add('internal-fade-in');
    secondaryOverlay.addEventListener('animationend', function handler() {
      secondaryOverlay.classList.remove('internal-fade-in');
      secondaryOverlay.removeEventListener('animationend', handler);
    });
  }
}

/**
 * Función para animar la entrada interna de los elementos del estado INITIAL.
 */
function animateInitialEntry() {
  const initialContent = document.querySelector('#banner-initial .content_mainHomeBanner');
  if (initialContent) {
    initialContent.classList.add('internal-fade-in');
    initialContent.addEventListener('animationend', function handler() {
      initialContent.classList.remove('internal-fade-in');
      initialContent.removeEventListener('animationend', handler);
    });
  }
}

/**
 * Función para animar la salida interna de los elementos del estado INITIAL (usada en transiciones generales).
 */
function animateInitialExit() {
  const initialContent = document.querySelector('#banner-initial .content_mainHomeBanner');
  if (initialContent) {
    initialContent.classList.add('internal-fade-out');
    initialContent.addEventListener('animationend', function handler() {
      initialContent.classList.remove('internal-fade-out');
      initialContent.removeEventListener('animationend', handler);
    });
  }
}

/**
 * Función específica para la animación de salida al hacer submit en el initial state.
 * Esta animación es un 50% más rápida (1s) que la animación general de salida.
 */
function animateSubmitExit() {
  const initialContent = document.querySelector('#banner-initial .content_mainHomeBanner');
  if (initialContent) {
    initialContent.classList.add('submit-fade-out');
    initialContent.addEventListener('animationend', function handler() {
      initialContent.classList.remove('submit-fade-out');
      initialContent.removeEventListener('animationend', handler);
    });
  }
}

/**
 * changeState: Cambia de estado entre secciones (initial, loading, secondary).
 * Aplica animación fade-in al nuevo contenedor y fade-out al actual.
 * 
 * Nota importante:
 * - Si el nuevo estado es el mismo que el actual y es "banner-secondary", no se dispara la animación
 *   de entrada interna (para evitar que se repita en cada submit).
 */
function changeState(newEl) {
  return new Promise(resolve => {
    const currentEl = getActiveState();
    if (currentEl === newEl) {
      // Si ya está activo y es secondary, no animamos de nuevo.
      // Para el initial state podemos seguir animando si lo deseas.
      if (newEl.id === "banner-initial") {
        animateInitialEntry();
      }
      resolve();
      return;
    }
    // Inicia la animación de fade-in en el nuevo contenedor.
    newEl.classList.add("active", "fade-in");
    newEl.addEventListener("animationend", function enterHandler() {
      newEl.classList.remove("fade-in");
      newEl.removeEventListener("animationend", enterHandler);
      if (newEl.id === "banner-secondary") {
        // Al cambiar de estado a secondary (desde otro estado), se dispara la animación.
        animateSecondaryEntry();
      }
      if (newEl.id === "banner-initial") {
        animateInitialEntry();
      }
      resolve();
    });
    // Si existe un estado actual, iniciamos su fade-out (y la animación interna en caso de ser initial).
    if (currentEl) {
      if (currentEl.id === "banner-initial") {
        animateInitialExit();
      }
      currentEl.classList.add("fade-out");
      currentEl.addEventListener("animationend", function exitHandler() {
        currentEl.classList.remove("active", "fade-out");
        currentEl.removeEventListener("animationend", exitHandler);
      });
    }
  });
}

/* 
===========================================================
   9. CERRAR CHAT (RESET) CON FADE OUT INTERNO
===========================================================
Se aplica fade-out a los elementos internos del estado secondary y se espera
a que finalice la animación antes de cambiar el estado.
===========================================================
*/
function resetChat() {
  const secondaryContainer = document.querySelector('.secondary-container');
  const secondaryOverlay = document.querySelector('.secondary-overlay');

  if (secondaryContainer) {
    secondaryContainer.classList.add('fade-out');
  }
  if (secondaryOverlay) {
    secondaryOverlay.classList.add('fade-out');
  }

  setTimeout(() => {
    changeState(bannerInitial).then(() => {
      messagesContainer.innerHTML = '';
      if (secondaryContainer) {
        secondaryContainer.classList.remove('fade-out');
      }
      if (secondaryOverlay) {
        secondaryOverlay.classList.remove('fade-out');
      }
    });
  }, 1500); // 1500ms = 1.5s (duración de la animación)
}

if (closeChatBtn) {
  closeChatBtn.addEventListener('click', resetChat);
}

/* 
===========================================================
   10. TRADUCCIÓN AUTOMÁTICA
===========================================================
*/
function updateContent() {
  for (const key in translations) {
    const dataKeyElements = document.querySelectorAll(`[data-key="${key}"]`);
    dataKeyElements.forEach(el => {
      el.textContent = translations[key][selectedLanguage];
    });
    if (key === "promptPlaceholder") {
      if (promptInput) {
        promptInput.placeholder = translations.promptPlaceholder[selectedLanguage];
      }
      if (promptInputSecondary) {
        promptInputSecondary.placeholder = translations.promptPlaceholder[selectedLanguage];
      }
    }
  }
}
updateContent();

/* 
===========================================================
   11. AL CARGAR, MOSTRAR EL ESTADO INICIAL
===========================================================
Se llama a changeState para activar y animar el estado initial.
*/
changeState(bannerInitial);