// localManager.js - Gestión exclusiva de archivos JSON locales (Modo Anónimo)

import { startQuiz, showModal } from "./quizEngine.js";

// Exportamos la función de inicialización para llamarla desde app.js
export function initLocalManager() {
  const fileInput = document.getElementById("file-input");

  if (!fileInput) return;

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const quiz = JSON.parse(e.target.result);
        validateQuiz(quiz);
        
        // Si todo es correcto, le pasamos el objeto JSON al motor
        startQuiz(quiz);
      } catch (error) {
        console.error(error);
        showModal(
          "Archivo no válido",
          "<p>El archivo JSON no tiene el formato esperado o contiene errores. Revisa la estructura</p>"
        );
      }
    };

    reader.readAsText(file);
    
    // Reseteamos el input por si el usuario quiere volver a cargar el mismo archivo
    fileInput.value = "";
  });
}

// Función estricta de validación para el formato JSON original
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