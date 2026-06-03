const state = {
  quiz: null,
  currentIndex: 0,
  answers: []
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

const quizTitle = document.getElementById("quiz-title");
const questionCounter = document.getElementById("question-counter");
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
const modalMessage = document.getElementById("modal-message");
const modalCloseBtn = document.getElementById("modal-close-btn");

const helpBtn = document.getElementById("help-btn");
const aboutBtn = document.getElementById("about-btn");

const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");

openFileBtn.addEventListener("click", () => fileInput.click());
startOpenFileBtn.addEventListener("click", () => fileInput.click());
newQuizBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", handleFileUpload);

prevBtn.addEventListener("click", goToPreviousQuestion);
nextBtn.addEventListener("click", goToNextQuestion);

reviewBtn.addEventListener("click", () => {
  state.currentIndex = 0;
  showScreen("quiz");
  renderQuestion();
});

repeatBtn.addEventListener("click", () => {
  state.currentIndex = 0;
  state.answers = [];
  showScreen("quiz");
  renderQuestion();
});

modalCloseBtn.addEventListener("click", closeModal);

helpBtn.addEventListener("click", showHelp);
aboutBtn.addEventListener("click", showAbout);

if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", closeModal);
}

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
  console.error(error);
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
  if (!quiz.title || !Array.isArray(quiz.questions)) {
    throw new Error("Formato de cuestionario inválido.");
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
  });
}

function startQuiz(quiz) {
  state.quiz = quiz;
  state.currentIndex = 0;
  state.answers = [];

  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = getCurrentQuestion();
  const savedAnswer = getSavedAnswer(question.id);

  quizTitle.textContent = state.quiz.title;
  questionCounter.textContent = `${state.currentIndex + 1} / ${state.quiz.questions.length}`;
  questionStatement.textContent = question.statement;

  optionsContainer.innerHTML = "";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = `${option.id.toUpperCase()}. ${option.text}`;

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