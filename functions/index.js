const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();

exports.callGemini = functions.runWith({
    secrets: ["GEMINI_API_KEY"],
    timeoutSeconds: 60,
    memory: '256MB'
}).https.onCall(async (data, context) => {
    // 1. Verificar autenticación
    if (!context.auth) {
        console.error("Acceso denegado: Usuario no autenticado.");
        throw new functions.https.HttpsError('unauthenticated', 'Solo docentes del MEP autenticados pueden usar la IA.');
    }

    const { prompt, type } = data;
    if (!prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'Falta el contenido del prompt.');
    }

    // 2. Verificar existencia de la clave
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.length < 10) {
        console.error("ERROR: La clave GEMINI_API_KEY no está configurada o es demasiado corta.");
        throw new functions.https.HttpsError('internal', 'Error configurando la IA en el servidor: Falta la clave de acceso.');
    }

    // DEBUG: Log de seguridad (solo muestra inicio y fin para verificar si es la clave correcta)
    const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
    console.log(`Clave detectada: ${maskedKey} (Longitud: ${apiKey.length})`);

    try {
        console.log(`Iniciando consulta para tipo: ${type || 'general'}`);

        // 3. Obtener el conocimiento base desde Firestore (Cerebro IA)
        let knowledgeBaseText = "";
        try {
            const kbSnapshot = await db.collection("ia_knowledge_base").where("activo", "==", true).get();
            if (!kbSnapshot.empty) {
                const kbItems = [];
                kbSnapshot.forEach(doc => {
                    kbItems.push(`- ${doc.data().contenido}`);
                });
                knowledgeBaseText = `\n\nNUEVAS DIRECTRICES Y CONOCIMIENTO BASE 2026 (PRIORIDAD ALTA):\n${kbItems.join('\n')}`;
            }
        } catch (kbError) {
            console.error("Error al obtener la base de conocimiento:", kbError);
            // Si falla, el prompt base interno sigue funcionando.
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: `Eres un Asistente Experto del "Recurso de Asesoría y Seguimiento 2026" para el PNFT (Programa Nacional de Formación Tecnológica) del MEP Costa Rica.
DIDI-DRTE es la dirección técnica. El portal incluye las "Orientaciones Didácticas 2026" y la "Guía Docente 2026".
Asesores clave: Rodolfo Juárez Pérez y Alberto Bustos Ortega.

CONOCIMIENTO TÉCNICO COMPLETO (Normativa 2026):
1. CONCEPTOS BASE: Dimensiones 1 y 2, Áreas de Conocimiento.
2. ADMINISTRACIÓN: Carga horaria, GTP, Bitácora Digital. Cualquier consulta administrativa o técnica adicional debe escalarse ÚNICAMENTE con los Asesores Nacionales PNFT a cargo.
3. PEDAGOGÍA: Saberes, Metodología Design Thinking (obligatoria en Secundaria), Planeamiento Bimestral PIA 2026.
4. EVALUACIÓN: Componente Proyecto vital en Secundaria.

IMPORTANTE: El contenido generado es una GUÍA ORIENTADORA para el docente de SECUNDARIA. El proceso de Design Thinking DEBE ser vivido por el estudiante. NO menciones codocencia, ya que no aplica a secundaria.${knowledgeBaseText}`
        });

        let finalPrompt = prompt;
        if (type === 'orient') {
            finalPrompt = `Consulta específica sobre NORMATIVA Y ORIENTACIONES: ${prompt}`;
        } else if (type === 'situacion') {
            finalPrompt = `Actúa como especialista curricular del PNFT Costa Rica. 
            CREA EXACTAMENTE CUATRO (4) "Situaciones Problema" detalladas para el tema: "${prompt}".
            
            Cada situación debe estar estructurada siguiendo las fases de Design Thinking (Empatía, Definición, Ideación, Prototipado, Testeo).
            Asegúrate de que los retos sean realistas y contextualizados para secundaria en Costa Rica, mencionando saberes digitales específicos.
            Formato: 
            ### Situación 1: [Título]
            [Descripción y Reto]
            [Actividades DT]
            ...Repetir hasta la 4.`;
        }

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7,
            },
        });

        const response = await result.response;
        const text = response.text();

        if (!text) {
            console.error("Gemini devolvió una respuesta vacía.");
            throw new Error("Respuesta vacía de la IA.");
        }

        console.log("Consulta completada exitosamente.");

        // 4. Registrar la consulta en Firestore (Log de Interacciones)
        try {
            await db.collection("ia_queries_log").add({
                userId: context.auth.uid,
                email: context.auth.token.email || "desconocido",
                type: type || 'general',
                prompt_length: prompt.length,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                prompt_preview: prompt.substring(0, 150) // Guardamos un previo de lo que preguntó
            });
        } catch (logError) {
             console.error("Error al guardar el log de IA:", logError);
        }

        return { text: text };

    } catch (error) {
        // Mejoramos el registro de errores para que sea visible en Google Cloud Console / Firebase Logs
        console.error("--- ERROR CRÍTICO EN CLOUD FUNCTION ---");
        console.error("Nombre:", error.name);
        console.error("Mensaje:", error.message);
        console.error("Stack:", error.stack);

        if (error.response) {
            console.error("Metadata de respuesta:", JSON.stringify(error.response, null, 2));
        }

        // Manejar errores específicos de Gemini
        if (error.message && error.message.includes('API key not valid')) {
            throw new functions.https.HttpsError('unauthenticated', 'La clave de API de Gemini no es válida o ha expirado.');
        }

        if (error.message && error.message.includes('quota')) {
            throw new functions.https.HttpsError('resource-exhausted', 'Se ha agotado la cuota de la API de Gemini. Verifique los límites en Google AI Studio.');
        }

        // Devolvemos un mensaje que ayude al usuario pero oculte detalles sensibles del backend
        throw new functions.https.HttpsError('internal', `Error en el Servidor IA: ${error.message || 'Error desconocido'}`);
    }
});
