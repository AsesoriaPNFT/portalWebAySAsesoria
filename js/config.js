// js/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

// Decodificar Base64 de la configuración embebida
const _k = atob("QUl6YVN5RDRkRnhXN3cxWFRvRkhlWUVtSUo0Q2hGNDhJb09yQ0Fj");

const firebaseConfig = {
    apiKey: _k,
    authDomain: "pnft-7af7f.firebaseapp.com",
    projectId: "pnft-7af7f",
    storageBucket: "pnft-7af7f.firebasestorage.app",
    messagingSenderId: "597792610260",
    appId: "1:597792610260:web:d2acbc466542ec9dc21b5e"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Data structure para UI (Saberes) adaptado a 2026
export const SABERES_DATA = {
    "7": {
        title: "Apropiación Tecnológica y Entornos Digitales",
        modulos: [
            {
                n: "Desarrollo de Aplicaciones en la Nube", s: [
                    { n: "Gestión de herramientas ofimáticas online", a: "Productividad" },
                    { n: "Trabajo Colaborativo", a: "Apropiación" },
                    { n: "Identidad Digital y Privacidad", a: "Ciudadanía" }
                ]
            },
            {
                n: "Design Thinking: Empatizar y Definir", s: [
                    { n: "Identificación de necesidades", a: "Resolución" },
                    { n: "Planteamiento de problemas del entorno", a: "Resolución" },
                    { n: "Investigación digital segura", a: "Apropiación" }
                ]
            }
        ]
    },
    "8": {
        title: "Computación Física y Robótica (Básico)",
        modulos: [
            {
                n: "Lógica Computacional e Interacción", s: [
                    { n: "Sensores y Actuadores Básico", a: "Programación" },
                    { n: "Secuencias y Bucles", a: "Programación" },
                    { n: "Estructuras Condicionales", a: "Programación" }
                ]
            },
            {
                n: "Design Thinking: Idear y Prototipar", s: [
                    { n: "Brainstorming tecnológico", a: "Resolución" },
                    { n: "Prototipado en papel o digital", a: "Resolución" },
                    { n: "Evaluación de prototipos iniciales", a: "Resolución" }
                ]
            }
        ]
    },
    "9": {
        title: "Inteligencia Artificial y Desarrollo Avanzado",
        modulos: [
            {
                n: "Interacción con IA Sensitiva", s: [
                    { n: "Uso ético de Modelos de Lenguaje", a: "IA" },
                    { n: "Generación guiada de Prompts", a: "IA" },
                    { n: "Análisis de Datos con IA Básico", a: "Data" }
                ]
            },
            {
                n: "Design Thinking: Proyecto Final (Probar y Evaluar)", s: [
                    { n: "Implementación del prototipo funcional", a: "Resolución" },
                    { n: "Pruebas de usuario e Iteración", a: "Resolución" },
                    { n: "Presentación y sustentación del proyecto", a: "Transversal" }
                ]
            }
        ]
    },
    "10": {
        title: "Diversificada Formación Tecnológica I",
        modulos: [
            {
                n: "Tecnologías Emergentes", s: [
                    { n: "Internet de las Cosas (IoT)", a: "IA" },
                    { n: "Análisis de Datos Avanzado", a: "Data" }
                ]
            }
        ]
    },
    "11": {
        title: "Diversificada Formación Tecnológica II",
        modulos: [
            {
                n: "Gestión de Proyectos Sociotecnológicos", s: [
                    { n: "Metodologías Ágiles", a: "Resolución" },
                    { n: "Emprendedurismo Digital", a: "Transversal" }
                ]
            }
        ]
    }
};

export { app, auth, db, storage };
