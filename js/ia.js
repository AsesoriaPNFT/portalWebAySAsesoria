// js/ia.js
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";
import { functions } from './config.js'; // Necesitamos exportar functions en config
import { msg } from './ui.js';
import { SABERES_DATA } from './config.js';

export const llamarGemini = async (promptTxt, type = 'general') => {
    try {
        const callGemini = httpsCallable(functions, 'callGemini');
        const result = await callGemini({ prompt: promptTxt, type: type });
        return result.data.text;
    } catch (error) {
        console.error("Error al llamar a Gemini Function:", error);
        const errorMsg = error.message || 'Error desconocido';
        const errorCode = error.code || 'unknown';

        let feedback = `⛔ Error (${errorCode}): ${errorMsg}`;
        if (errorCode === 'unauthenticated') feedback = "⚠️ Debes iniciar sesión para usar la IA.";
        return feedback; // Retorna string de todos modos
    }
};

export const ejecutarHerramientaIA = async () => {
    const input = document.getElementById('admin-ia-input');
    const type = document.getElementById('admin-ia-type').value;
    const txt = input.value.trim();
    if (!txt) return msg("⚠️ Por favor ingrese información o suba un planeamiento", "normal");

    const btn = document.getElementById('btn-ia-admin');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<div class="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div> Procesando...`;
    btn.disabled = true;

    const prompts = {
        reporte: `Genera un REPORTE TÉCNICO FORMAL de visita para el PNFT. Detalles: "${txt}". Formato: 1. Resumen, 2. Acción Sugerida, 3. Clasificación.`,
        circular: `Redacta un OFICIO/CIRCULAR oficial del PNFT dirigido a docentes/directores. Contexto: "${txt}". Tono formal, empoderador y técnico.`,
        pia: `ACTÚA COMO AUDITOR PEDAGÓGICO DE ALTO NIVEL DEL PNFT 2026. 
        Analiza el siguiente PLANEAMIENTO (PIA) y verifica el cumplimiento de:
        
        1. CONGRUENCIA 2026: ¿Se alinea con las Orientaciones Didácticas y la Guía 2026?
        2. TALLERES Y TECNOLOGÍAS: ¿Corresponden la selección de herramientas a los niveles de III Ciclo según la Guía? (Verifica contra: Desarrollo de Aplicaciones, Computación Física e IA).
        3. COMPONENTE PROYECTO: ¿El planeamiento desarrolla la Resolución de Problemas bajo las 5 fases de Design Thinking (Empatizar, Definir, Idear, Prototipar, Probar y Evaluar)?
        4. EVALUACIÓN Y GESTIÓN: ¿Se incluyen los perfiles de salida y evidencias comprobables del proceso técnico y actitudinal?
        
        CONTENIDO DEL PLANEAMIENTO:
        "${txt}"
        
        DA UN DICTAMEN TÉCNICO: 
        - Puntos Fuertes.
        - Omisiones Críticas.
        - Recomendación de Mejora Directa.`,
        agenda: `Crea una AGENDA DE VISITA técnica para una institución. Contexto: "${txt}". Incluye tiempos, objetivos técnicos y pedagógicos.`,
        analisis: `Analiza la siguiente tendencia/situación observada en el campo: "${txt}". Indica posibles riesgos, oportunidades de capacitación y impacto en el programa.`
    };

    try {
        const respuesta = await llamarGemini(prompts[type], 'general');
        const htmlRes = respuesta.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

        const oldRes = document.getElementById('admin-ia-result');
        if (oldRes) oldRes.remove();

        const resDiv = document.createElement('div');
        resDiv.id = 'admin-ia-result';
        resDiv.className = 'mt-6 p-6 bg-white/10 rounded-2xl text-[11px] text-teal-50 border border-white/20 fade-in leading-relaxed max-h-[400px] overflow-y-auto no-scrollbar';
        resDiv.innerHTML = `<div class="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <h5 class="font-black uppercase">Resultado IA Hub</h5>
                                <button onclick="this.parentElement.parentElement.remove()" class="text-teal-300 hover:text-white"><i class="ph ph-x"></i></button>
                            </div>
                            ${htmlRes}
                            <div class="mt-4 pt-4 border-t border-white/10">
                                <button onclick="navigator.clipboard.writeText(this.parentElement.previousSibling.textContent); msg('✅ Copiado', 'success')" class="text-[9px] font-black uppercase text-teal-300 hover:text-white flex items-center gap-2">
                                    <i class="ph ph-copy"></i> Copiar resultado
                                </button>
                            </div>`;
        input.parentElement.appendChild(resDiv);
    } catch (e) {
        console.error(e);
        msg("⛔ Error con la IA", "err");
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

export const askOrientIA = async (preSet) => {
    const input = document.getElementById('orient-ia-input');
    const resDiv = document.getElementById('orient-ia-res');
    const txt = preSet || input.value.trim();
    if (!txt) return;

    resDiv.innerHTML = '<div class="flex items-center gap-3 text-teal-500 font-black uppercase tracking-widest text-[10px] animate-pulse"><i class="ph ph-cpu"></i> Escaneando Normativa 2026...</div>';
    if (!preSet) input.value = "";

    const respuesta = await llamarGemini(txt, 'orient');

    const htmlRes = respuesta.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    resDiv.innerHTML = `<div class="fade-in bg-teal-50/10 border border-teal-500/20 p-5 rounded-2xl text-slate-300 shadow-sm">${htmlRes}</div>`;
};

export const generarSituacion = async () => {
    const tema = document.getElementById('ia-tema').value;
    const nivel = document.getElementById('ia-nivel').value;
    const moduloIdx = document.getElementById('ia-modulo').value;
    const moduloName = SABERES_DATA[nivel].modulos[moduloIdx].n;

    const selectedSaberes = Array.from(document.querySelectorAll('input[name="ia-saber"]:checked')).map(cb => cb.value);
    const resDiv = document.getElementById('ia-result');
    const resContainer = document.getElementById('ia-result-container');

    if (!tema) return alert("Por favor, describe el contexto o problema.");

    resContainer.classList.remove('hidden');
    resDiv.innerHTML = `
        <div class="flex flex-col items-center fade-in py-10">
            <div class="w-16 h-16 border-4 border-[#025964] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-[#025964] font-black uppercase tracking-widest text-[10px] animate-pulse">Diseñando situaciones para ${nivel} / ${moduloName}...</p>
        </div>`;

    resDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const promptFinal = `REQUERIMIENTO: Crea 1 situación de aprendizaje detallada basada en la metodología Design Thinking para PNFT 2026.
    CONTEXTO DOCENTE: "${tema}"
    NIVEL: ${nivel}
    MODULO: ${moduloName}
    SABERES A INTEGRAR: ${selectedSaberes.join(', ') || 'Relacionados al módulo'}
    IMPORTANTE: Estructura la propuesta obligatoriamente en las 5 fases de Design Thinking:
    1. Empatizar
    2. Definir
    3. Idear
    4. Prototipar
    5. Evaluar
    FORMATO: Usa viñetas claras y lenguaje técnico pedagógico formal.`;

    const respuesta = await llamarGemini(promptFinal, 'situacion');

    const paragraphs = respuesta.split(/\n\s*\n/).filter(p => p.trim());
    const formattedHtml = paragraphs.map(p => {
        let text = p.replace(/\*\*(.*?)\*\*/g, '<b class="text-[#025964]">$1</b>').replace(/\n/g, '<br>');
        return `<div class="mb-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">${text}</div>`;
    }).join('');

    resDiv.innerHTML = `
        <div class="fade-in space-y-6">
            <div class="flex items-center justify-between mb-6">
                <span class="text-[10px] font-black text-[#025964] uppercase tracking-widest bg-[#f1f8f9] px-4 py-2 rounded-full border border-[#025964]/10">Guía Orientadora para ${nivel}</span>
                <button onclick="window.print()" class="text-[10px] font-black text-slate-400 hover:text-[#025964] uppercase flex items-center gap-2"><i class="ph ph-printer"></i> Imprimir</button>
            </div>
            ${formattedHtml}
            <div class="mt-8 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p class="text-[11px] text-slate-500 font-medium italic text-center">
                    "Recordatorio: Esta información es un insumo técnico para el diseño de su mediación pedagógica. Asegúrese de que sus estudiantes sean los protagonistas activos del proceso de resolución."
                </p>
            </div>
        </div>`;
};

export const planificarSesion = async () => {
    const input = document.getElementById('plan-input');
    const resDiv = document.getElementById('plan-res');
    const txt = input.value.trim();
    if (!txt) return alert("Describe el objetivo de tu lección.");

    resDiv.innerHTML = '<div class="flex flex-col items-center w-full"><div class="w-10 h-10 border-4 border-[#025964] border-t-transparent rounded-full animate-spin mb-3"></div><p class="text-[#025964] font-black text-xs uppercase tracking-widest">Calculando tiempos y fases...</p></div>';

    const respuesta = await llamarGemini(txt, 'general');
    const htmlRes = respuesta.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    resDiv.innerHTML = `<div class="text-left fade-in font-medium text-slate-600 leading-relaxed max-h-[300px] overflow-y-auto p-2">${htmlRes}</div>`;
    resDiv.className = "bg-white border border-[#025964]/10 rounded-3xl p-8 min-h-[160px] text-sm flex flex-col items-start shadow-sm shadow-[#025964]/5";
};

export const enviarChatIA = async () => {
    const input = document.getElementById('chat-input');
    const txt = input.value.trim();
    if (!txt) return;

    const hist = document.getElementById('chat-history');
    hist.innerHTML += `
        <div class="flex justify-end gap-3 fade-in">
            <div class="bg-teal-600 text-white p-6 rounded-[2rem] rounded-tr-none max-w-[85%] text-sm font-bold shadow-xl shadow-teal-600/10">
                ${txt}
            </div>
        </div>`;
    input.value = "";
    hist.scrollTop = hist.scrollHeight;

    const loadingId = "load-" + Date.now();
    hist.innerHTML += `
        <div id="${loadingId}" class="flex gap-4 fade-in">
            <div class="w-8 h-8 rounded-full bg-teal-100 flex-shrink-0 flex items-center justify-center text-teal-600"><i class="ph-fill ph-check-circle animate-pulse"></i></div>
            <div class="bg-slate-50 p-6 rounded-[2rem] rounded-tl-none text-sm font-black text-teal-600 uppercase tracking-widest animate-pulse">Analizando...</div>
        </div>`;
    hist.scrollTop = hist.scrollHeight;

    const respuesta = await llamarGemini(txt, 'general');

    document.getElementById(loadingId).remove();
    const htmlRes = respuesta.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

    hist.innerHTML += `
        <div class="flex gap-4 fade-in">
            <div class="w-8 h-8 rounded-full bg-teal-100 flex-shrink-0 flex items-center justify-center text-teal-600"><i class="ph-fill ph-check-circle"></i></div>
            <div class="bg-white p-6 rounded-[2rem] rounded-tl-none max-w-[85%] text-sm font-medium text-slate-600 leading-relaxed shadow-sm border border-slate-100">
                ${htmlRes}
            </div>
        </div>`;
    hist.scrollTop = hist.scrollHeight;
};
