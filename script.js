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
formInitial.addEventListener('submit', (e) => {
  e.preventDefault();
  const userPrompt = promptInput.value.trim();
  if (!userPrompt) return;
  changeState(bannerLoading).then(() => {
    setTimeout(() => {
      creaBurbuja('user', userPrompt);
      handleAncientResponse(userPrompt);
    }, 500);
  });
  promptInput.value = '';
});

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

function changeState(newEl) {
  return new Promise(resolve => {
    const currentEl = getActiveState();
    // Si ya está activo, no hacemos nada
    if (currentEl === newEl) {
      resolve();
      return;
    }
    // Inicia la animación de fade-in en el nuevo contenedor
    newEl.classList.add("active", "fade-in");
    newEl.addEventListener("animationend", function enterHandler() {
      newEl.classList.remove("fade-in");
      newEl.removeEventListener("animationend", enterHandler);
      resolve();
    });
    // Si existe un estado actual, iniciamos su fade-out de forma concurrente
    if (currentEl) {
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
   9. CERRAR CHAT (RESET)
===========================================================
*/
function resetChat() {
  changeState(bannerInitial).then(() => {
    messagesContainer.innerHTML = '';
  });
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