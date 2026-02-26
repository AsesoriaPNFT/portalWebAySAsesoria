// js/adminData.js
import { db } from './config.js';
import { collection, getDocs, doc, setDoc, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { msg } from './ui.js';

let adminChartInstance = null;

export const updateAdminChart = async (filtroAsesor = window.currentAsesorFilter) => {
    try {
        const snap = await getDocs(collection(db, "registro_usuarios"));
        const roles = { admin: 0, docente: 0 };
        const regiones = {};

        snap.forEach(doc => {
            const u = doc.data();

            if (filtroAsesor !== 'todos') {
                const asesorLower = String(u.asesor_asignado || "").toLowerCase();
                if (!asesorLower.includes(filtroAsesor)) return;
            }

            roles[u.rol] = (roles[u.rol] || 0) + 1;
            const ref = u.regional || "Pendiente";
            regiones[ref] = (regiones[ref] || 0) + 1;
        });

        // Actualizar KPIs Header
        document.getElementById('admin-kpi-total').innerText = roles.admin + roles.docente;
        document.getElementById('admin-kpi-docentes').innerText = roles.docente;

        const ctx = document.getElementById('adminChart');
        if (!ctx) return;

        if (adminChartInstance) adminChartInstance.destroy();

        adminChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(regiones),
                datasets: [{
                    data: Object.values(regiones),
                    backgroundColor: ['#025964', '#048A9A', '#06B6CC', '#00DFFA', '#e2e8f0', '#94a3b8', '#475569'],
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 6, font: { size: 10, family: 'sans-serif' } } }
                }
            }
        });
    } catch (e) {
        console.error("Error al actualizar gráfico admin:", e);
    }
};

export const guardarBitacora = async () => {
    const dDate = document.getElementById('bit-date').value;
    const dType = document.getElementById('bit-type').value;
    const dInst = document.getElementById('bit-inst').value.trim();
    const dNotes = document.getElementById('bit-notes').value.trim();

    if (!dDate || !dInst) return msg("Faltan datos clave de la bitácora", "err");

    const btn = document.getElementById('btn-save-bitacora');
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner-gap animate-spin"></i>';

    try {
        const docId = `bit_${Date.now()}`;
        await setDoc(doc(db, "bitacoras_asesor", docId), {
            fecha: dDate,
            tipo: dType,
            institucion: dInst,
            notas: dNotes,
            creado_por: window.currentUserData?.nombre || "Asesor",
            email_asesor: window.currentUserData?.email || "N/A",
            timestamp: new Date().toISOString()
        });

        msg("✅ Registro guardado en bitácora", "success");
        document.getElementById('form-bitacora').reset();
        window.cargarBitacoras();
    } catch (e) {
        console.error(e);
        msg("⛔ Error al guardar bitácora", "err");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Guardar Registro';
    }
};

export const cargarBitacoras = async () => {
    const list = document.getElementById('bitacora-list');
    if (!list) return;

    list.innerHTML = '<p class="text-[10px] text-slate-400 font-bold p-8 text-center animate-pulse">Cargando registros...</p>';

    try {
        const snap = await getDocs(query(collection(db, "bitacoras_asesor"), orderBy("timestamp", "desc")));
        let html = "";
        snap.forEach(d => {
            const b = d.data();

            // Filtrar si el usuario actual es admin pero no de sede central? 
            // Para "todos" los admin ven todo. Si quisiéramos filtrar por asesor:
            if (window.currentUserData && window.currentUserData.email !== "alberto.bustos.ortega@mep.go.cr" &&
                window.currentUserData.email !== "rodolfo.juarez.perez@mep.go.cr" &&
                window.currentUserData.email !== "yorleny.monge.monge@mep.go.cr") {
                if (b.email_asesor !== window.currentUserData.email) return;
            }

            const iconMap = {
                'visita': 'ph-map-pin',
                'virtual': 'ph-laptop',
                'oficina': 'ph-building-office',
                'incidencia': 'ph-warning'
            };
            const icon = iconMap[b.tipo] || 'ph-file-text';

            html += `
                <div class="p-4 bg-white/50 rounded-2xl border border-slate-100 mb-3 flex gap-4 items-start shadow-sm">
                    <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#025964] shadow-sm shrink-0">
                        <i class="ph-bold ${icon} text-lg"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center mb-1">
                            <h6 class="text-xs font-black text-slate-800 uppercase truncate">${b.institucion}</h6>
                            <span class="text-[9px] font-bold text-slate-400 whitespace-nowrap">${b.fecha}</span>
                        </div>
                        <p class="text-[10px] text-slate-600 font-medium leading-relaxed mb-2">${b.notas}</p>
                        <div class="flex items-center gap-2">
                            <div class="w-4 h-4 rounded-full bg-[#025964] text-white flex items-center justify-center text-[7px] font-bold">${b.creado_por.charAt(0)}</div>
                            <span class="text-[8px] font-black text-slate-400 uppercase">${b.creado_por}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html || '<p class="text-[10px] italic text-slate-400 text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">Aún no hay registros en la bitácora</p>';
    } catch (e) {
        console.error(e);
        list.innerHTML = '<p class="text-rose-500 font-bold p-8 text-center text-[10px] uppercase">Error cargando bitácora</p>';
    }
};

export const analizarBitacoraIA = async () => {
    const btn = document.getElementById('btn-analyze-bitacora');
    const resDiv = document.getElementById('bitacora-ia-result');
    if (!resDiv) return;

    btn.innerHTML = '<i class="ph ph-spinner-gap animate-spin"></i>';
    btn.disabled = true;

    try {
        const snap = await getDocs(query(collection(db, "bitacoras_asesor"), orderBy("timestamp", "desc"), limit(10)));
        let contexto = "";
        snap.forEach(d => {
            const b = d.data();
            contexto += `[${b.fecha} - ${b.tipo}] Inst: ${b.institucion}. Notas: ${b.notas}\n`;
        });

        if (!contexto) {
            resDiv.innerHTML = '<p class="text-[10px] italic text-slate-400 p-4">No hay datos suficientes para analizar.</p>';
            resDiv.classList.remove('hidden');
            return;
        }

        const prompt = `Analiza los siguientes registros recientes de bitácora de asesores pedagógicos:
        ${contexto}
        
        Identifica:
        1. Patrones o incidencias repetitivas.
        2. Instituciones críticas que requieren seguimiento.
        3. Recomendación estratégica breve.`;

        const { llamarGemini } = await import('./ia.js');
        const respuesta = await llamarGemini(prompt, 'reporte');
        const htmlRes = respuesta.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

        resDiv.innerHTML = `
            <div class="flex items-center justify-between mb-3 border-b border-teal-500/10 pb-2">
                <span class="text-[10px] font-black text-teal-600 uppercase tracking-widest"><i class="ph-bold ph-cpu"></i> Análisis Estratégico AI</span>
                <button onclick="this.parentElement.parentElement.classList.add('hidden')" class="text-slate-400 hover:text-slate-600"><i class="ph-bold ph-x"></i></button>
            </div>
            <div class="text-[10px] text-slate-600 font-medium leading-relaxed">
                ${htmlRes}
            </div>
        `;
        resDiv.classList.remove('hidden');

    } catch (e) {
        console.error(e);
        msg("Error al analizar bitácora", "err");
    } finally {
        btn.innerHTML = '<i class="ph-bold ph-sparkle"></i>';
        btn.disabled = false;
    }
};
