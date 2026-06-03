const state = {
  quiz: null,
  currentIndex: 0,
  answers: [],
  isReviewMode: false
};

const screens = {
  start: document.getElementById("start-screen"),
  quiz: document.getElementById("quiz-screen"),
  summary: document.getElementById("summary-screen")
};

const fileInput = document.getElementById("file-input");

const openFileBtn = document.getElementById("open-file-btn");
const startOpenFileBtn = document.getElementById("start-open-file-btn");
const newQuizBtn = document.getElementById("new-quiz-btn");

const helpBtn = document.getElementById("help-btn");
const aboutBtn = document.getElementById("about-btn");

const quizTitle = document.getElementById("quiz-title");
const questionCounter = document.getElementById("question-counter");
const questionMapBtn = document.getElementById("question-map-btn");
const questionStatement = document.getElementById("question-statement");
const optionsContainer = document.getElementById("options-container");

const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

const correctCount = document.getElementById("correct-count");
const incorrectCount = document.getElementById("incorrect-count");
const totalCount = document.getElementById("total-count");
const scorePercent = document.getElementById("score-percent");
const scoreMain = document.getElementById("score-main");
const scoreRing = document.getElementById("score-ring");

const reviewBtn = document.getElementById("review-btn");
const repeatBtn = document.getElementById("repeat-btn");

const appModal = document.getElementById("app-modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");
const modalCloseBtn = document.getElementById("modal-close-btn");

/* =========================
   Eventos
========================= */

openFileBtn.addEventListener("click", () => fileInput.click());
startOpenFileBtn.addEventListener("click", () => fileInput.click());
newQuizBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", handleFileUpload);

prevBtn.addEventListener("click", goToPreviousQuestion);
nextBtn.addEventListener("click", goToNextQuestion);

reviewBtn.addEventListener("click", () => {
  state.currentIndex = 0;
  state.isReviewMode = true;
  showScreen("quiz");
  renderQuestion();
});

repeatBtn.addEventListener("click", () => {
  state.currentIndex = 0;
  state.answers = [];
  state.isReviewMode = false;
  showScreen("quiz");
  renderQuestion();
});

helpBtn.addEventListener("click", showHelp);
aboutBtn.addEventListener("click", showAbout);

if (questionMapBtn) {
  questionMapBtn.addEventListener("click", openQuestionMap);
}

modalCloseBtn.addEventListener("click", closeModal);

appModal.addEventListener("click", (event) => {
  if (event.target === appModal) {
    closeModal();
  }
});

document.addEventListener("keydown", handleKeyboardNavigation);

document.addEventListener("pointermove", () => {
  document.body.classList.remove("using-keyboard");
});

document.addEventListener("mousedown", () => {
  document.body.classList.remove("using-keyboard");
});

/* =========================
   Carga de archivo
========================= */

function handleFileUpload(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const quiz = JSON.parse(e.target.result);
      validateQuiz(quiz);
      startQuiz(quiz);
    } catch (error) {
      showModal(
        "Archivo no válido",
        "<p>El archivo JSON no tiene el formato esperado.</p>"
      );
    }
  };

  reader.readAsText(file);
  fileInput.value = "";
}

function validateQuiz(quiz) {
  if (!quiz || !quiz.title || !Array.isArray(quiz.questions)) {
    throw new Error("Formato de cuestionario inválido.");
  }

  if (quiz.questions.length === 0) {
    throw new Error("El cuestionario no tiene preguntas.");
  }

  quiz.questions.forEach((question) => {
    if (
      !question.id ||
      !question.statement ||
      !question.type ||
      !Array.isArray(question.options) ||
      !Array.isArray(question.correct)
    ) {
      throw new Error("Formato de pregunta inválido.");
    }

    if (question.type !== "single") {
      throw new Error("De momento solo se admiten preguntas single.");
    }

    if (question.options.length < 2) {
      throw new Error("Cada pregunta debe tener al menos dos opciones.");
    }

    if (question.correct.length !== 1) {
      throw new Error("Cada pregunta single debe tener una sola respuesta correcta.");
    }

    const optionIds = question.options.map((option) => option.id);

    question.options.forEach((option) => {
      if (!option.id || !option.text) {
        throw new Error("Formato de opción inválido.");
      }
    });

    question.correct.forEach((correctId) => {
      if (!optionIds.includes(correctId)) {
        throw new Error("La respuesta correcta no existe entre las opciones.");
      }
    });
  });
}

/* =========================
   Cuestionario
========================= */

function startQuiz(quiz) {
  state.quiz = quiz;
  state.currentIndex = 0;
  state.answers = [];
  state.isReviewMode = false;

  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = getCurrentQuestion();
  const savedAnswer = getSavedAnswer(question.id);

  quizTitle.textContent = state.quiz.title;
  questionCounter.textContent = `${state.currentIndex + 1} / ${state.quiz.questions.length}`;
  questionStatement.textContent = question.statement;

  if (questionMapBtn) {
    questionMapBtn.classList.toggle("hidden", !state.isReviewMode);
  }

  optionsContainer.innerHTML = "";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = `${option.id.toUpperCase()}. ${option.text}`;
    button.dataset.optionIndex = index;

    if (savedAnswer) {
      button.disabled = true;

      const isCorrectOption = question.correct.includes(option.id);
      const wasSelected = savedAnswer.selected.includes(option.id);

      if (isCorrectOption) {
        button.classList.add("correct");
      }

      if (wasSelected && !isCorrectOption) {
        button.classList.add("incorrect");
      }
    } else {
      button.addEventListener("click", () => answerQuestion(option.id));
    }

    optionsContainer.appendChild(button);
  });

  prevBtn.disabled = state.currentIndex === 0;
  nextBtn.disabled = !savedAnswer;
  nextBtn.textContent = isLastQuestion() ? "Ver resumen" : "Siguiente";
}

function answerQuestion(optionId) {
  const question = getCurrentQuestion();
  const isCorrect = question.correct.includes(optionId);

  state.answers.push({
    questionId: question.id,
    selected: [optionId],
    isCorrect
  });

  renderQuestion();
}

function goToPreviousQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
  }
}

function goToNextQuestion() {
  const question = getCurrentQuestion();
  const savedAnswer = getSavedAnswer(question.id);

  if (!savedAnswer) return;

  if (isLastQuestion()) {
    showSummary();
    return;
  }

  state.currentIndex++;
  renderQuestion();
}

/* =========================
   Resumen
========================= */

function showSummary() {
  const correct = state.answers.filter((answer) => answer.isCorrect).length;
  const incorrect = state.answers.length - correct;
  const total = state.quiz.questions.length;
  const percent = Math.round((correct / total) * 100);

  correctCount.textContent = correct;
  incorrectCount.textContent = incorrect;
  totalCount.textContent = total;

  scoreMain.textContent = `${correct}/${total}`;
  scorePercent.textContent = `${percent}%`;
  scoreRing.style.setProperty("--score", percent);

  showScreen("summary");
}

/* =========================
   Mapa de preguntas
========================= */

function openQuestionMap() {
  const mapHtml = `
    <p class="question-map-intro">
      Selecciona una pregunta para revisarla directamente.
    </p>

    <div class="question-map-grid">
      ${state.quiz.questions
        .map((question, index) => {
          const answer = getSavedAnswer(question.id);

          const resultClass = answer && answer.isCorrect
            ? "question-map-correct"
            : "question-map-incorrect";

          const currentClass = index === state.currentIndex
            ? "question-map-current"
            : "";

          return `
            <button
              type="button"
              class="question-map-btn ${resultClass} ${currentClass}"
              data-index="${index}"
              aria-label="Ir a la pregunta ${index + 1}"
            >
              ${index + 1}
            </button>
          `;
        })
        .join("")}
    </div>

    <div class="question-map-legend">
      <span><i class="legend-dot legend-correct"></i> Acertada</span>
      <span><i class="legend-dot legend-incorrect"></i> Fallada</span>
    </div>
  `;

  showModal("Mapa de preguntas", mapHtml);

  modalContent.querySelectorAll(".question-map-btn").forEach((button) => {
    button.addEventListener("click", () => {
      goToQuestion(Number(button.dataset.index));
    });
  });
}

function goToQuestion(index) {
  state.currentIndex = index;
  closeModal();
  showScreen("quiz");
  renderQuestion();
}

/* =========================
   Navegación con teclado
========================= */

function handleKeyboardNavigation(event) {
  const keyboardKeys = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Enter"
  ];

  if (keyboardKeys.includes(event.key)) {
    document.body.classList.add("using-keyboard");
  }

  if (event.key === "Escape") {
    if (isModalOpen()) {
      closeModal();
    }

    return;
  }

  if (isModalOpen() || !isQuizVisible()) {
    return;
  }

  if (shouldIgnoreKeyboardEvent(event)) {
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    focusOption("previous");
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    focusOption("next");
    return;
  }

  if (event.key === "Enter") {
    const activeElement = document.activeElement;

    if (
      activeElement &&
      activeElement.classList.contains("option-btn") &&
      !activeElement.disabled
    ) {
      event.preventDefault();
      activeElement.click();
    }

    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();

    if (!prevBtn.disabled) {
      goToPreviousQuestion();
    }

    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();

    if (!nextBtn.disabled) {
      goToNextQuestion();
    }
  }
}

function focusOption(direction) {
  const question = getCurrentQuestion();
  const savedAnswer = getSavedAnswer(question.id);

  if (savedAnswer) {
    return;
  }

  const optionButtons = Array.from(
    optionsContainer.querySelectorAll(".option-btn:not(:disabled)")
  );

  if (optionButtons.length === 0) {
    return;
  }

  const activeIndex = optionButtons.findIndex(
    (button) => button === document.activeElement
  );

  let nextIndex;

  if (activeIndex === -1) {
    nextIndex = direction === "previous"
      ? optionButtons.length - 1
      : 0;
  } else if (direction === "previous") {
    nextIndex = activeIndex === 0
      ? optionButtons.length - 1
      : activeIndex - 1;
  } else {
    nextIndex = activeIndex === optionButtons.length - 1
      ? 0
      : activeIndex + 1;
  }

  optionButtons[nextIndex].focus();
}

function shouldIgnoreKeyboardEvent(event) {
  const tagName = event.target.tagName;

  return ["INPUT", "TEXTAREA", "SELECT"].includes(tagName);
}

function isQuizVisible() {
  return screens.quiz && !screens.quiz.classList.contains("hidden");
}

function isModalOpen() {
  return appModal && !appModal.classList.contains("hidden");
}

/* =========================
   Modal
========================= */

function showModal(title, content) {
  if (!appModal || !modalTitle || !modalContent) {
    alert(`${title}\n\n${content.replace(/<[^>]*>/g, "")}`);
    return;
  }

  modalTitle.textContent = title;
  modalContent.innerHTML = content;
  appModal.classList.remove("hidden");
}

function closeModal() {
  if (appModal) {
    appModal.classList.add("hidden");
  }
}

/* =========================
   Ayuda / Acerca de
========================= */

function showHelp() {
  showModal(
    "Ayuda",
    `
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
    `
  );
}

function showAbout() {
  showModal(
    "Acerca de",
    `
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
    `
  );
}

/* =========================
   Utilidades
========================= */

function showScreen(screenName) {
  Object.values(screens).forEach((screen) => screen.classList.add("hidden"));
  screens[screenName].classList.remove("hidden");
}

function getCurrentQuestion() {
  return state.quiz.questions[state.currentIndex];
}

function getSavedAnswer(questionId) {
  return state.answers.find((answer) => answer.questionId === questionId);
}

function isLastQuestion() {
  return state.currentIndex === state.quiz.questions.length - 1;
}