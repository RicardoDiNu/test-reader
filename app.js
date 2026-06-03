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

const reviewBtn = document.getElementById("review-btn");
const repeatBtn = document.getElementById("repeat-btn");

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
      alert("El archivo JSON no tiene el formato esperado.");
      console.error(error);
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
  scorePercent.textContent = `${percent}%`;

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