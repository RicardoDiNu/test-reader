// cloudManager.js - Gestión dinámica de Colecciones Firebase

import { startQuiz, showModal, closeModal } from "./quizEngine.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, updateDoc, increment, getDocs, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBNOjN2U44ULI326x__0RMMnadcPJy5kkA",
  authDomain: "test-reader-2bbcd.firebaseapp.com",
  projectId: "test-reader-2bbcd",
  storageBucket: "test-reader-2bbcd.firebasestorage.app",
  messagingSenderId: "113341387725",
  appId: "1:113341387725:web:49ce90718587f889a6ea84"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función auxiliar para obtener la colección activa seleccionada por el usuario
function getActiveCollectionName() {
  const selector = document.getElementById("collection-selector");
  if (selector) {
    const selected = selector.value;
    localStorage.setItem("active_firebase_collection", selected); // Lo guardamos en memoria
    return selected;
  }
  return localStorage.getItem("active_firebase_collection") || "preguntas_optimizadas";
}

// ==========================================
// INICIALIZACIÓN DE EVENTOS DEL PANEL CLOUD
// ==========================================
export function initCloudManager() {
  const syncCsvBtn = document.getElementById("sync-csv-btn");
  const csvFileInput = document.getElementById("csv-file-input");
  const collectionSelector = document.getElementById("collection-selector");

  // Recuperar última colección seleccionada si existe
  if (collectionSelector) {
    const savedCollection = localStorage.getItem("active_firebase_collection");
    if (savedCollection) {
      collectionSelector.value = savedCollection;
    }

    collectionSelector.addEventListener("change", () => {
      const activeCol = getActiveCollectionName();
      console.log(`Colección activa cambiada a: ${activeCol}`);
    });
  }

  if (syncCsvBtn && csvFileInput) {
    syncCsvBtn.addEventListener("click", () => csvFileInput.click());
    
    csvFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        processCsvFile(file);
      }
      csvFileInput.value = "";
    });
  }

  const filtersForm = document.getElementById("quiz-filters-form");
  if (filtersForm) {
    filtersForm.addEventListener("submit", (e) => {
      e.preventDefault();
      fetchFilteredQuizFromFirebase();
    });
  }
}

// ==========================================
// LECTOR ROBUSTO DE CSV
// ==========================================
function parseCSV(strData) {
  const strDelimiter = strData.indexOf(";") > -1 ? ";" : ",";
  const objPattern = new RegExp(
    ("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
    "([^\"\\" + strDelimiter + "\\r\\n]*))"),
    "gi"
  );
  let arrData = [[]];
  let arrMatches = null;
  while (arrMatches = objPattern.exec(strData)) {
    let strMatchedDelimiter = arrMatches[1];
    if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
      arrData.push([]);
    }
    let strMatchedValue;
    if (arrMatches[2]) {
      strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
    } else {
      strMatchedValue = arrMatches[3];
    }
    arrData[arrData.length - 1].push(strMatchedValue);
  }
  if (arrData.length > 0 && arrData[arrData.length - 1].length === 1 && arrData[arrData.length - 1][0] === "") {
    arrData.pop();
  }
  return arrData;
}

// ==========================================
// PROCESAMIENTO Y SUBIDA A LA COLECCIÓN ACTIVA
// ==========================================
async function processCsvFile(file) {
  const activeCollection = getActiveCollectionName();
  const reader = new FileReader();

  reader.onload = async function (e) {
    const text = e.target.result;
    const rows = parseCSV(text);

    if (rows.length < 2) {
      showModal("Error en CSV", "<p>El archivo CSV está vacío o no tiene el formato correcto</p>");
      return;
    }

    let contadorSubidas = 0;

    try {
      showModal("Sincronizando...", `<p>Subiendo preguntas a <strong>${activeCollection}</strong>...</p>`);

      let batch = writeBatch(db);
      let operationsInBatch = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 6) continue;

        const questionId = row[0] ? row[0].trim() : `q_${i}`;
        const origenVal = row[1] ? row[1].trim().toLowerCase() : "";
        const bloqueNum = Number(row[2]) || 0;
        const temaNum = Number(row[3]) || 0;
        const enunciadoText = row[4] ? row[4].trim() : "";
        const opcionA = row[5] ? row[5].trim() : "";
        const opcionB = row[6] ? row[6].trim() : "";
        const opcionC = row[7] ? row[7].trim() : "";
        const opcionD = row[8] ? row[8].trim() : "";
        const opcionCorrectaVal = row[9] ? row[9].trim().toLowerCase() : "a";

        const questionRef = doc(db, activeCollection, questionId);

        batch.set(questionRef, {
          id: questionId,
          origen: origenVal,
          bloque: bloqueNum,
          tema: temaNum,
          enunciado: enunciadoText,
          opcion_a: opcionA,
          opcion_b: opcionB,
          opcion_c: opcionC,
          opcion_d: opcionD,
          opcion_correcta: opcionCorrectaVal
        }, { merge: true });

        operationsInBatch++;
        contadorSubidas++;

        if (operationsInBatch === 450) {
          await batch.commit();
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      }

      if (operationsInBatch > 0) {
        await batch.commit();
      }

      showModal("¡Sincronización Exitosa!", `<p>Se han subido correctamente <strong>${contadorSubidas}</strong> preguntas a <strong>${activeCollection}</strong></p>`);
    } catch (error) {
      console.error("Error al subir CSV:", error);
      showModal("Error", `<p>Hubo un problema al volcar los datos: ${error.message}</p>`);
    }
  };

  reader.readAsText(file);
}

// ==========================================
// CONSULTA FILTRADA DESDE LA COLECCIÓN ACTIVA
// ==========================================
async function fetchFilteredQuizFromFirebase() {
  const activeCollection = getActiveCollectionName();
  const bloqueVal = document.getElementById("filter-bloque").value;
  const temaVal = document.getElementById("filter-tema").value;
  const origenVal = document.getElementById("filter-origen").value;
  const porcentajeMaxVal = document.getElementById("filter-porcentaje").value;

  try {
    showModal("Generando Test", `<p>Buscando preguntas en <strong>${activeCollection}</strong></p>`);

    let qRef = collection(db, activeCollection);
    let condiciones = [];

    if (bloqueVal !== "") condiciones.push(where("bloque", "==", Number(bloqueVal)));
    if (temaVal !== "") condiciones.push(where("tema", "==", Number(temaVal)));
    if (origenVal !== "") condiciones.push(where("origen", "==", origenVal));

    let consultaFinal = condiciones.length > 0 ? query(qRef, ...condiciones) : qRef;
    const querySnapshot = await getDocs(consultaFinal);

    let preguntasArray = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      if (porcentajeMaxVal !== "") {
        const aciertos = data.aciertos || 0;
        const fallos = data.fallos || 0;
        const total = aciertos + fallos;
        
        const porcentajeAcierto = total > 0 ? Math.round((aciertos / total) * 100) : 100;
        if (porcentajeAcierto > Number(porcentajeMaxVal)) return;
      }

      let opcionesFormateadas = [];
      if (data.opcion_a) opcionesFormateadas.push({ id: "a", text: data.opcion_a });
      if (data.opcion_b) opcionesFormateadas.push({ id: "b", text: data.opcion_b });
      if (data.opcion_c) opcionesFormateadas.push({ id: "c", text: data.opcion_c });
      if (data.opcion_d) opcionesFormateadas.push({ id: "d", text: data.opcion_d });

      let correctaLetra = data.opcion_correcta ? data.opcion_correcta.toLowerCase() : "a";

      preguntasArray.push({
        id: data.id,
        statement: data.enunciado,
        options: opcionesFormateadas,
        correct: [correctaLetra]
      });
    });

    if (preguntasArray.length === 0) {
      showModal("Sin resultados", `<p>No hay preguntas en <strong>${activeCollection}</strong> que coincidan con los filtros</p>`);
      return;
    }

    preguntasArray.sort(() => Math.random() - 0.5);

    const cuestionarioPersonalizado = {
      title: `Test (${activeCollection}) - Bloque: ${bloqueVal || 'Todos'}, Tema: ${temaVal || 'Todos'}`,
      questions: preguntasArray
    };

    closeModal();
    const configModal = document.getElementById("config-modal");
    if (configModal) configModal.classList.add("hidden");

    startQuiz(cuestionarioPersonalizado);

  } catch (error) {
    console.error("Error al generar test:", error);
    showModal("Error", `<p>No se pudieron recuperar las preguntas: ${error.message}</p>`);
  }
}

// ==========================================
// REGISTRAR RESPUESTA EN LA COLECCIÓN ACTIVA
// ==========================================
export async function registrarRespuestaEnFirebase(questionId, isCorrect) {
  if (!questionId) return;
  
  const activeCollection = getActiveCollectionName();
  const questionRef = doc(db, activeCollection, questionId);

  try {
    if (isCorrect) {
      await updateDoc(questionRef, {
        aciertos: increment(1),
        ultima_respuesta: "acertada"
      });
    } else {
      await updateDoc(questionRef, {
        fallos: increment(1),
        ultima_respuesta: "fallada"
      });
    }
  } catch (error) {
    console.error("Error al actualizar la estadística en Firebase:", error);
  }
}