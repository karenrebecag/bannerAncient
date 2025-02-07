/* 
===========================================================
   1. CONSTANTES Y VARIABLES
===========================================================
*/
const ANCIENT_ENDPOINT_URL = 'https://ancient.app.n8n.cloud/webhook/84e653aa-65b2-49c0-9a12-4a86256b4744';
const GPT_FALLBACK_URL = 'https://hook.us2.make.com/pdfv8gwculdpuw3pyl82x33mput2gj73'; // Fallback a GPT

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
   2. SELECCIONAMOS ELEMENTOS DE CADA SECCION
===========================================================
*/
const bannerInitial = document.getElementById('banner-initial');
const bannerLoading = document.getElementById('banner-loading');
const bannerSecondary = document.getElementById('banner-secondary');

// Formularios e inputs
const formInitial = document.querySelector('#chat-form');
const promptInput = document.querySelector('#prompt');
const formSecondary = document.getElementById('chat-form-secondary');
const promptInputSecondary = document.getElementById('prompt-secondary');

// Contenedor de mensajes en el estado secundario
const messagesContainer = document.getElementById('messages');

// Botón para cerrar el chat
const closeChatBtn = document.getElementById('close-chat-btn');

/* 
===========================================================
   3. FUNCIONES: BURBUJAS DE CHAT Y TYPEWRITER
===========================================================
*/
function creaBurbuja(role, message) {
  // Crea una burbuja normal (user o ai)
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble', role);
  bubble.textContent = message; 
  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function creaBurbujaConTypewriter(text) {
  // Burbujas AI con animación "máquina de escribir"
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble', 'ai');
  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  typeWriter(bubble, text);
}

function typeWriter(element, text) {
  const speed = 15; // ms por caracter
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
   4. BURBUJA "LOADER" (3 PUNTOS) PARA EL ASSISTANT
===========================================================
*/
function creaLoaderBubble() {
  const loaderBubble = document.createElement('div');
  loaderBubble.classList.add('chat-bubble', 'ai', 'loader-bubble');

  // Tres puntitos con animación
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
   5. FETCH A ANCIENT (N8N) + FALLBACK A GPT
===========================================================
*/
async function handleAncientResponse(prompt) {
  // Añadimos la burbuja "loader"
  const loader = creaLoaderBubble();

  try {
    const response = await fetch(ANCIENT_ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt })
    });
    const result = await response.json();

    // Quitamos el loader
    removeLoaderBubble(loader);

    if (result && result.answer) {
      showSecondaryState();
      creaBurbujaConTypewriter(result.answer);
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
  // Añadimos loader otra vez, si falla Ancient
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
    showSecondaryState();
    creaBurbujaConTypewriter(result.trim());
  } catch (error) {
    console.error('Error en GPT:', error);
    removeLoaderBubble(loader);
    showSecondaryState();
    creaBurbuja('ai', translations.responseError[selectedLanguage]);
  }
}

/* 
===========================================================
   6. EVENTOS DE SUBMIT
===========================================================
*/
formInitial.addEventListener('submit', (e) => {
  e.preventDefault();
  const userPrompt = promptInput.value.trim();
  if (!userPrompt) return;

  showLoadingState();
  // Simular un breve delay para mostrar la pantalla "loading"
  setTimeout(() => {
    showSecondaryState();
    creaBurbuja('user', userPrompt);
    handleAncientResponse(userPrompt);
  }, 500);

  promptInput.value = '';
});

if (formSecondary) {
  formSecondary.addEventListener('submit', (e) => {
    e.preventDefault();
    const userPrompt = promptInputSecondary.value.trim();
    if (!userPrompt) return;

    // Burbuja del usuario
    creaBurbuja('user', userPrompt);
    // Llamamos a la IA
    handleAncientResponse(userPrompt);

    promptInputSecondary.value = '';
  });
}

/* 
===========================================================
   7. FUNCIONES PARA MOSTRAR U OCULTAR ESTADOS
===========================================================
*/
function showInitialState() {
  bannerInitial.classList.add('active');
  bannerLoading.classList.remove('active');
  bannerSecondary.classList.remove('active');
}

function showLoadingState() {
  bannerInitial.classList.remove('active');
  bannerLoading.classList.add('active');
  bannerSecondary.classList.remove('active');
}

function showSecondaryState() {
  bannerInitial.classList.remove('active');
  bannerLoading.classList.remove('active');
  bannerSecondary.classList.add('active');
}

/* 
===========================================================
   8. CERRAR CHAT (RESET)
===========================================================
*/
function resetChat() {
  showInitialState();
  messagesContainer.innerHTML = '';
}

if (closeChatBtn) {
  closeChatBtn.addEventListener('click', () => {
    resetChat();
  });
}

/* 
===========================================================
   9. TRADUCCIÓN AUTOMÁTICA
===========================================================
*/
function updateContent() {
  for (let key in translations) {
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
   10. AL CARGAR, MOSTRAR INICIAL
===========================================================
*/
showInitialState();
