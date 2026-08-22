// quizEngine.js - Motor independiente de ejecución de tests

import { registrarRespuestaEnFirebase } from "./cloudManager.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
const auth = getAuth();

// ==========================================
// ESTADO
// ==========================================
const state = {
  originalQuiz: null,
  quiz: null,
  currentIndex: 0,
  answers: [],
  isReviewMode: false
};

// ==========================================
// INICIALIZACIÓN SEGURA DE EVENTOS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("prev-btn")?.addEventListener("click", goToPreviousQuestion);
  document.getElementById("next-btn")?.addEventListener("click", goToNextQuestion);
  
  document.getElementById("review-btn")?.addEventListener("click", () => {
    state.currentIndex = 0;
    state.isReviewMode = true;
    showScreen("quiz");
    renderQuestion();
  });

  document.getElementById("repeat-failed-btn")?.addEventListener("click", repeatFailedQuestions);
  document.getElementById("repeat-btn")?.addEventListener("click", () => startQuizAttempt(state.originalQuiz.questions));

  document.getElementById("question-map-btn")?.addEventListener("click", openQuestionMap);
  document.getElementById("modal-close-btn")?.addEventListener("click", closeModal);
  
  const appModal = document.getElementById("app-modal");
  appModal?.addEventListener("click", (event) => {
    if (event.target === appModal) closeModal();
  });

  document.addEventListener("keydown", handleKeyboardNavigation);
  document.addEventListener("pointermove", () => document.body.classList.remove("using-keyboard"));
  document.addEventListener("mousedown", () => document.body.classList.remove("using-keyboard"));
});

// ==========================================
// UTILIDADES EXPORTABLES (UI)
// ==========================================
export function showScreen(screenName) {
  const screens = {
    start: document.getElementById("start-screen"),
    cloudDashboard: document.getElementById("cloud-dashboard-screen"),
    quiz: document.getElementById("quiz-screen"),
    summary: document.getElementById("summary-screen")
  };

  Object.values(screens).forEach((screen) => {
    if (screen) screen.classList.add("hidden");
  });
  if (screens[screenName]) {
    screens[screenName].classList.remove("hidden");
  }
}

export function showModal(title, content) {
  const appModal = document.getElementById("app-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalContent = document.getElementById("modal-content");
  
  if (!appModal || !modalTitle || !modalContent) return;
  
  modalTitle.textContent = title;
  modalContent.innerHTML = content;
  appModal.classList.remove("hidden");
}

export function closeModal() {
  const appModal = document.getElementById("app-modal");
  if (appModal) appModal.classList.add("hidden");
}

// ==========================================
// LÓGICA CORE DEL CUESTIONARIO
// ==========================================
export function startQuiz(quiz) {
  state.originalQuiz = quiz;
  startQuizAttempt(quiz.questions);
}

function startQuizAttempt(questions) {
  state.quiz = { ...state.originalQuiz, questions };
  state.currentIndex = 0;
  state.answers = [];
  state.isReviewMode = false;
  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = state.quiz.questions[state.currentIndex];
  const savedAnswer = state.answers.find(a => a.questionId === question.id);

  const quizTitle = document.getElementById("quiz-title");
  const questionCounter = document.getElementById("question-counter");
  const questionStatement = document.getElementById("question-statement");
  const optionsContainer = document.getElementById("options-container");
  const questionMapBtn = document.getElementById("question-map-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  if (quizTitle) quizTitle.textContent = state.quiz.title || "Cuestionario";
  if (questionCounter) questionCounter.textContent = `${state.currentIndex + 1} / ${state.quiz.questions.length}`;
  if (questionStatement) questionStatement.textContent = question.statement || question.enunciado;

  if (questionMapBtn) questionMapBtn.classList.toggle("hidden", !state.isReviewMode);

  if (optionsContainer) {
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

        if (isCorrectOption) button.classList.add("correct");
        if (wasSelected && !isCorrectOption) button.classList.add("incorrect");
      } else {
        button.addEventListener("click", () => answerQuestion(option.id));
      }
      optionsContainer.appendChild(button);
    });
  }

  if (prevBtn) prevBtn.disabled = state.currentIndex === 0;
  if (nextBtn) {
    nextBtn.disabled = !savedAnswer;
    nextBtn.textContent = (state.currentIndex === state.quiz.questions.length - 1) ? "Ver resumen" : "Siguiente";
  }
}

function answerQuestion(optionId) {
  const question = state.quiz.questions[state.currentIndex];
  const isCorrect = question.correct.includes(optionId);
  
  state.answers.push({ questionId: question.id, selected: [optionId], isCorrect });
  
  registrarRespuestaEnFirebase(question.id, isCorrect);

  renderQuestion();
}

function goToPreviousQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
  }
}

function goToNextQuestion() {
  const savedAnswer = state.answers.find(a => a.questionId === state.quiz.questions[state.currentIndex].id);
  if (!savedAnswer) return;

  if (state.currentIndex === state.quiz.questions.length - 1) {
    showSummary();
  } else {
    state.currentIndex++;
    renderQuestion();
  }
}

// ==========================================
// RESUMEN Y MAPA
// ==========================================
function showSummary() {
  const correct = state.answers.filter((answer) => answer.isCorrect).length;
  const incorrect = state.answers.length - correct;
  const total = state.quiz.questions.length;
  const percent = Math.round((correct / total) * 100);

  const correctCount = document.getElementById("correct-count");
  const incorrectCount = document.getElementById("incorrect-count");
  const totalCount = document.getElementById("total-count");
  const scorePercent = document.getElementById("score-percent");
  const scoreMain = document.getElementById("score-main");
  const scoreRing = document.getElementById("score-ring");
  const repeatFailedBtn = document.getElementById("repeat-failed-btn");
  const repeatBtn = document.getElementById("repeat-btn");
  const newQuizBtn = document.getElementById("new-quiz-btn");

  if (correctCount) correctCount.textContent = correct;
  if (incorrectCount) incorrectCount.textContent = incorrect;
  if (totalCount) totalCount.textContent = total;
  if (scoreMain) scoreMain.textContent = `${correct}/${total}`;
  if (scorePercent) scorePercent.textContent = `${percent}%`;
  if (scoreRing) scoreRing.style.setProperty("--score", percent);
  if (repeatFailedBtn) repeatFailedBtn.classList.toggle("hidden", incorrect === 0);

  // 1. Configurar el botón de repetir cuestionario (siempre disponible para repetir el cuestionario actual)
  if (repeatBtn) {
    repeatBtn.textContent = "Repetir cuestionario";
    const newRepeatBtn = repeatBtn.cloneNode(true);
    repeatBtn.parentNode.replaceChild(newRepeatBtn, repeatBtn);

    newRepeatBtn.addEventListener("click", () => {
      startQuizAttempt(state.originalQuiz.questions);
    });
  }

  // 2. Configurar el botón inferior según el estado de la sesión (Cloud vs Anónimo)
  const isCloudUser = auth.currentUser !== null;

  if (newQuizBtn) {
    newQuizBtn.textContent = isCloudUser ? "Crear nuevo cuestionario" : "Abrir nuevo cuestionario";
    
    const freshNewQuizBtn = newQuizBtn.cloneNode(true);
    newQuizBtn.parentNode.replaceChild(freshNewQuizBtn, newQuizBtn);

    const fileInput = document.getElementById("file-input");

    freshNewQuizBtn.addEventListener("click", () => {
      const configModal = document.getElementById("config-modal");
      if (isCloudUser && configModal) {
        // Si está logueado, abre el modal de filtros de la nube
        configModal.classList.remove("hidden");
      } else {
        // Si es anónimo, abre el explorador para cargar un JSON local
        if (fileInput) fileInput.click();
      }
    });
  }

  showScreen("summary");
}

function repeatFailedQuestions() {
  const failedQuestionIds = state.answers.filter(a => !a.isCorrect).map(a => a.questionId);
  if (failedQuestionIds.length === 0) return;
  const failedQuestions = state.quiz.questions.filter(q => failedQuestionIds.includes(q.id));
  startQuizAttempt(failedQuestions);
}

function openQuestionMap() {
  const mapHtml = `
    <p class="question-map-intro">Selecciona una pregunta para revisarla directamente.</p>
    <div class="question-map-grid">
      ${state.quiz.questions.map((question, index) => {
        const answer = state.answers.find(a => a.questionId === question.id);
        const resultClass = answer && answer.isCorrect ? "question-map-correct" : (answer ? "question-map-incorrect" : "");
        const currentClass = index === state.currentIndex ? "question-map-current" : "";
        return `<button type="button" class="question-map-btn ${resultClass} ${currentClass}" data-index="${index}">${index + 1}</button>`;
      }).join("")}
    </div>
  `;
  showModal("Mapa de preguntas", mapHtml);
  
  const modalContent = document.getElementById("modal-content");
  if (modalContent) {
    modalContent.querySelectorAll(".question-map-btn").forEach((button) => {
      button.addEventListener("click", () => {
        state.currentIndex = Number(button.dataset.index);
        closeModal();
        showScreen("quiz");
        renderQuestion();
      });
    });
  }
}

// ==========================================
// NAVEGACIÓN POR TECLADO
// ==========================================
function handleKeyboardNavigation(event) {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(event.key)) {
    document.body.classList.add("using-keyboard");
  }

  const appModal = document.getElementById("app-modal");
  const quizScreen = document.getElementById("quiz-screen");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  if (event.key === "Escape") { closeModal(); return; }
  if (appModal && !appModal.classList.contains("hidden")) return;
  if (quizScreen && quizScreen.classList.contains("hidden")) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;

  if (event.key === "ArrowUp") { event.preventDefault(); focusOption("previous"); return; }
  if (event.key === "ArrowDown") { event.preventDefault(); focusOption("next"); return; }
  if (event.key === "Enter") {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.classList.contains("option-btn") && !activeEl.disabled) {
      event.preventDefault();
      activeEl.click();
    }
    return;
  }
  if (event.key === "ArrowLeft") { event.preventDefault(); if (prevBtn && !prevBtn.disabled) goToPreviousQuestion(); return; }
  if (event.key === "ArrowRight") { event.preventDefault(); if (nextBtn && !nextBtn.disabled) goToNextQuestion(); }
}

function focusOption(direction) {
  const savedAnswer = state.answers.find(a => a.questionId === state.quiz.questions[state.currentIndex].id);
  if (savedAnswer) return;

  const optionsContainer = document.getElementById("options-container");
  if (!optionsContainer) return;

  const optionButtons = Array.from(optionsContainer.querySelectorAll(".option-btn:not(:disabled)"));
  if (optionButtons.length === 0) return;

  const activeIndex = optionButtons.findIndex((button) => button === document.activeElement);
  let nextIndex;

  if (activeIndex === -1) {
    nextIndex = direction === "previous" ? optionButtons.length - 1 : 0;
  } else if (direction === "previous") {
    nextIndex = activeIndex === 0 ? optionButtons.length - 1 : activeIndex - 1;
  } else {
    nextIndex = activeIndex === optionButtons.length - 1 ? 0 : activeIndex + 1;
  }
  optionButtons[nextIndex].focus();
}