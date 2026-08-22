// app.js - Controlador Principal de Autenticación e Interfaz

// 1. IMPORTACIONES
import { showScreen, showModal } from "./quizEngine.js";
import { initLocalManager } from "./localManager.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initCloudManager } from "./cloudManager.js";

// 2. CONFIGURACIÓN FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBNOjN2U44ULI326x__0RMMnadcPJy5kkA",
  authDomain: "test-reader-2bbcd.firebaseapp.com",
  projectId: "test-reader-2bbcd",
  storageBucket: "test-reader-2bbcd.firebasestorage.app",
  messagingSenderId: "113341387725",
  appId: "1:113341387725:web:49ce90718587f889a6ea84"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 3. GESTIÓN DE AUTENTICACIÓN Y ESTADO DE SESIÓN
onAuthStateChanged(auth, (user) => {
  const btnLogin = document.getElementById("btn-login");
  const userMenuContainer = document.getElementById("user-menu-container");
  const userInfo = document.getElementById("user-info");
  const openFileBtn = document.getElementById("open-file-btn");

  if (user) {
    if (btnLogin) btnLogin.style.display = "none";
    if (userMenuContainer) userMenuContainer.style.display = "inline-block";
    if (userInfo) userInfo.textContent = user.displayName || user.email;
    
    if (openFileBtn) {
      openFileBtn.textContent = "Crear";
      openFileBtn.title = "Crear cuestionario con filtros";
    }

    showScreen("cloudDashboard");
  } else {
    if (btnLogin) btnLogin.style.display = "inline-block";
    if (userMenuContainer) userMenuContainer.style.display = "none";
    if (userInfo) userInfo.textContent = "";
    
    if (openFileBtn) {
      openFileBtn.textContent = "Abrir";
      openFileBtn.title = "Abrir cuestionario JSON local";
    }

    showScreen("start");
  }

  document.body.classList.add("auth-checked");
});

// 4. INICIALIZACIÓN DE EVENTOS DEL DOM
document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.getElementById("btn-login");
  const btnLogout = document.getElementById("btn-logout");

  if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
      try { await signInWithPopup(auth, googleProvider); } 
      catch (error) { alert("Error al iniciar sesión con Google"); }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try { await signOut(auth); showScreen("start"); } 
      catch (error) { console.error("Error cerrando sesión"); }
    });
  }

  // Menú Desplegable Usuario
  const userDropdownBtn = document.getElementById("user-dropdown-btn");
  const userDropdownMenu = document.getElementById("user-dropdown-menu");

  if (userDropdownBtn && userDropdownMenu) {
    userDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdownMenu.style.display = userDropdownMenu.style.display === "none" || userDropdownMenu.style.display === "" ? "block" : "none";
    });
    document.addEventListener("click", () => {
      if (userDropdownMenu.style.display === "block") userDropdownMenu.style.display = "none";
    });
  }

  // Modal Configuración Cloud (Filtros)
  const openConfigBtn = document.getElementById("open-config-modal-btn");
  const configModal = document.getElementById("config-modal");
  const closeConfigBtn = document.getElementById("close-config-btn");

  if (openConfigBtn && configModal) openConfigBtn.addEventListener("click", () => configModal.classList.remove("hidden"));
  if (closeConfigBtn && configModal) closeConfigBtn.addEventListener("click", () => configModal.classList.add("hidden"));

  // Eventos de botones genéricos
  const fileInput = document.getElementById("file-input");
  
  document.getElementById("open-file-btn")?.addEventListener("click", () => {
    if (auth.currentUser) {
      if (configModal) configModal.classList.remove("hidden");
    } else {
      fileInput.click();
    }
  });

  document.getElementById("start-open-file-btn")?.addEventListener("click", () => fileInput.click());
  
  document.getElementById("new-quiz-btn")?.addEventListener("click", () => {
    auth.currentUser ? showScreen("cloudDashboard") : fileInput.click();
  });

  document.getElementById("help-btn")?.addEventListener("click", showHelp);
  document.getElementById("about-btn")?.addEventListener("click", showAbout);

  initLocalManager();
  initCloudManager();
});

// 5. MODALES INFORMATIVOS
function showHelp() {
  showModal(
    "Ayuda",
    `
      <div style="text-align: left;">
        <p>
          Esta aplicación permite abrir un archivo JSON con preguntas tipo test
          y practicar respondiéndolas una a una.
        </p>

        <h3>Formato del archivo JSON</h3>

        <p>El archivo debe tener esta estructura:</p>

        <pre><code>{
  "title": "Demo - Uso de la app",
  "questions": [
    {
      "id": "q1",
      "statement": "¿Qué tipo de archivo abrirá esta app?",
      "type": "single",
      "options": [
        {
          "id": "a",
          "text": "Un archivo JSON"
        },
        {
          "id": "b",
          "text": "Un archivo PDF"
        }
      ],
      "correct": ["a"]
    }
  ]
}</code></pre>

        <h3>Campos obligatorios</h3>

        <ul>
          <li><strong>title</strong>: nombre del cuestionario.</li>
          <li><strong>questions</strong>: lista de preguntas.</li>
          <li><strong>id</strong>: identificador único de la pregunta.</li>
          <li><strong>statement</strong>: enunciado.</li>
          <li><strong>type</strong>: de momento, usa <code>single</code>.</li>
          <li><strong>options</strong>: respuestas posibles.</li>
          <li><strong>correct</strong>: lista con la respuesta correcta.</li>
        </ul>

        <p>
          Aunque ahora solo haya una respuesta correcta, <code>correct</code>
          se guarda como lista para permitir respuestas múltiples en el futuro.
        </p>
      </div>
    `
  );
}

function showAbout() {
  showModal(
    "Acerca de",
    `
      <div style="text-align: left;">
        <div class="about-author-box">
          <p class="about-author-label">Autor</p>
          <p class="about-author-name">Ricardo Díaz Núñez</p>

          <a
            class="about-github-link"
            href="https://github.com/RicardoDiNu"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/RicardoDiNu
          </a>
        </div>

        <p>
          <strong>Multiple-Choice Test Reader</strong> es una aplicación sencilla
          para practicar cuestionarios tipo test a partir de archivos JSON.
        </p>

        <p>
          No usa base de datos, no guarda tus preguntas en ningún servidor y
          funciona como lector local de cuestionarios.
        </p>

        <p>
          Pensada para estudiar de forma rápida, cómoda y visual desde ordenador,
          tablet o móvil.
        </p>
      </div>
    `
  );
}