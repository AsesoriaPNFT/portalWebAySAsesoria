// js/admin.js
import { db, auth } from './config.js';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    serverTimestamp,
    addDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { msg } from './ui.js';

window.currentAsesorFilter = 'todos';
window.userCache = {};
window.instCache = {};

export const mostrarInstituciones = async (filtroAsesor = window.currentAsesorFilter) => {
    document.getElementById('admin-search-input').value = ""; // Limpiar búsqueda
    window.currentAsesorFilter = filtroAsesor;
    const listInstituciones = document.getElementById('admin-instituciones-list');
    const listUsuarios = document.getElementById('admin-usuarios-list');
    const sectionBitacora = document.getElementById('admin-bitacora-section');
    const title = document.querySelector('#admin h3') || { innerText: "" };

    listInstituciones.classList.remove('hidden');
    listUsuarios.classList.add('hidden');
    sectionBitacora.classList.add('hidden');
    document.getElementById('admin-diagnostico-section').classList.add('hidden');
    document.getElementById('admin-instituciones-container').classList.remove('hidden');
    title.innerText = "Gestión de Instituciones";

    listInstituciones.innerHTML = `
        <div class="flex flex-col items-center p-20">
            <div class="w-10 h-10 border-4 border-[#025964] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando centros...</p>
        </div>
    `;

    try {
        const instSnap = await getDocs(collection(db, "status_instituciones"));
        const userSnap = await getDocs(collection(db, "registro_usuarios"));

        const usuariosPorInst = {};
        userSnap.forEach(uDoc => {
            const u = uDoc.data();
            if (u.institucion) {
                if (!usuariosPorInst[u.institucion]) usuariosPorInst[u.institucion] = [];
                usuariosPorInst[u.institucion].push(u);
            }
        });

        let html = "";
        window.instCache = {};
        instSnap.forEach(iDoc => {
            const inst = iDoc.data();
            const instId = iDoc.id;
            window.instCache[instId] = inst;

            if (window.currentAsesorFilter !== 'todos') {
                const nameLower = (inst.asesor || "").toLowerCase();
                if (!nameLower.includes(window.currentAsesorFilter)) return;
            }

            const docentes = usuariosPorInst[inst.nombre] || [];
            const categoria = inst.categoria || 'CONTINUIDAD';
            const catColor = categoria === 'URGENTE' ? 'text-rose-500 bg-rose-50 border-rose-100' :
                categoria === 'PRIORITARIO' ? 'text-amber-500 bg-amber-50 border-amber-100' :
                    'text-teal-600 bg-teal-50 border-teal-100';

            html += `
                <div class="p-4 sm:p-6 bg-white rounded-3xl border border-slate-100 hover:border-[#025964]/20 transition-all group shadow-sm searchable-item" 
                     data-search="${(inst.nombre + " " + (inst.asesor || "") + " " + (inst.regional || "") + " " + (inst.circuito || "")).toLowerCase()}">
                    <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div class="flex items-center gap-4">
                            <div class="hidden xs:flex w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center text-[#025964] shadow-sm font-black text-[10px] border border-slate-100 uppercase tracking-tighter shrink-0">000${instId.length}</div>
                            <div class="min-w-0">
                                <div class="flex flex-wrap items-center gap-2 mb-1">
                                    <h5 class="font-black text-slate-800 uppercase text-sm truncate">${inst.nombre}</h5>
                                    <span class="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">${inst.asesor || 'Sin Asesor'}</span>
                                </div>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <span class="text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${catColor}">${categoria}</span>
                                    <span class="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-widest">DR: ${inst.regional || 'N/A'}</span>
                                    <span class="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-widest">Circuito: ${inst.circuito || 'N/A'}</span>
                                    <span class="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 uppercase tracking-widest">Presup: ${inst.codigo_presupuestario || 'N/A'}</span>
                                    <span class="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-widest">Asesor: ${inst.asesor || 'No asignado'}</span>
                                </div>
                                <div class="flex gap-4 mt-3">
                                    <div class="flex items-center gap-1.5 opacity-60">
                                        <i class="ph ph-laptop text-[10px] text-slate-400"></i>
                                        <span class="text-[8px] font-black text-slate-400 uppercase">FOD: ${inst.equipo_pronie || 'Pendiente'}</span>
                                    </div>
                                    <div class="flex items-center gap-1.5 opacity-60">
                                        <i class="ph ph-broadcast text-[10px] text-slate-400"></i>
                                        <span class="text-[8px] font-black text-slate-400 uppercase">SUTEL: ${inst.programa_3_sutel || 'Pendiente'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="window.editarInstitucion('${instId}')" class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#025964] transition-colors"><i class="ph-bold ph-pencil-simple"></i></button>
                            <button onclick="window.eliminarInstitucion('${instId}', '${inst.nombre.replace(/'/g, "\\'")}')" class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><i class="ph-bold ph-trash"></i></button>
                            <button class="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><i class="ph-bold ph-bell"></i></button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div class="space-y-3">
                            <p class="text-[10px] font-black text-teal-600 uppercase tracking-widest">Docentes Asociados (${docentes.length})</p>
                            <div class="flex -space-x-3 overflow-hidden">
                                ${docentes.map(d => `<div class="w-10 h-10 rounded-full bg-[#025964] border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm" title="${d.nombre}">${d.nombre.charAt(0)}</div>`).join('')}
                                ${docentes.length === 0 ? '<p class="text-[10px] text-slate-400 italic">No hay docentes vinculados</p>' : ''}
                            </div>
                        </div>
                        <div class="bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200">
                            <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Nota de Seguimiento</p>
                            <p class="text-[11px] text-slate-600 font-bold flex items-center gap-2"><i class="ph-fill ph-chat-centered-text text-teal-500"></i> ${inst.nota_seguimiento || 'Sin registros'}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        listInstituciones.innerHTML = html || '<p class="text-center text-slate-400 py-20 font-bold italic">No hay instituciones registradas.</p>';
    } catch (e) {
        console.error(e);
        listInstituciones.innerHTML = `<p class="col-span-full text-center text-rose-500 font-bold py-10">Error: ${e.message}</p>`;
    }
};

export const listarUsuarios = async (filtroAsesor = window.currentAsesorFilter) => {
    document.getElementById('admin-search-input').value = "";
    window.currentAsesorFilter = filtroAsesor;
    const listInstituciones = document.getElementById('admin-instituciones-list');
    const listUsuarios = document.getElementById('admin-usuarios-list');
    const sectionBitacora = document.getElementById('admin-bitacora-section');
    const sectionDiag = document.getElementById('admin-diagnostico-section');
    const title = document.querySelector('#admin h3') || { innerText: "" };

    listInstituciones.classList.add('hidden');
    document.getElementById('admin-instituciones-container').classList.add('hidden');
    listUsuarios.classList.remove('hidden');
    sectionBitacora.classList.add('hidden');
    sectionDiag.classList.add('hidden');
    document.getElementById('admin-usuario-actividad').classList.add('hidden');
    title.innerText = "Lista de Usuarios";
    listUsuarios.innerHTML = '<div class="flex flex-col items-center p-10"><div class="w-8 h-8 border-4 border-[#025964] border-t-transparent rounded-full animate-spin mb-4"></div><p class="text-xs font-black text-slate-400 uppercase">Consultando base de datos...</p></div>';

    try {
        const snap = await getDocs(collection(db, "registro_usuarios"));
        let html = "";
        window.userCache = {};
        snap.forEach(doc => {
            const u = doc.data();
            window.userCache[doc.id] = u;

            if (window.currentAsesorFilter !== 'todos') {
                const asesorLower = String(u.asesor_asignado || "").toLowerCase();
                if (!asesorLower.includes(window.currentAsesorFilter)) return;
            }

            const rolColor = u.rol === 'admin' ? 'bg-amber-500 text-white' : 'bg-teal-50 text-teal-600';
            const esCompleto = u.perfil_completo || u.rol === 'admin';

            html += `
                <div class="p-4 sm:p-6 bg-white rounded-3xl border border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center hover:shadow-md transition-all gap-4 searchable-item"
                     data-search="${(u.nombre + " " + (u.email || doc.id) + " " + (u.institucion || "") + " " + (u.regional || "")).toLowerCase()}">
                    <div class="flex items-center gap-4 min-w-0">
                        <div class="hidden xs:flex w-12 h-12 ${esCompleto ? 'bg-slate-100 text-slate-400' : 'bg-rose-50 text-rose-400'} rounded-2xl items-center justify-center font-black text-lg shrink-0">${(u.nombre || "?").charAt(0)}</div>
                        <div class="min-w-0">
                            <h5 class="font-black text-slate-800 text-sm uppercase flex flex-wrap items-center gap-2 truncate">
                                ${u.nombre || "Sin Nombre"}
                                ${!esCompleto ? '<span class="text-[7px] bg-rose-500 text-white px-1.5 py-0.5 rounded-md animate-pulse">PENDIENTE</span>' : ''}
                            </h5>
                            <p class="text-[10px] text-slate-500 font-medium truncate">
                                <i class="ph ph-shield-check"></i> <span class="text-[#025964] font-bold">Autorizado:</span> ${doc.id} 
                                ${u.cedula ? `| ID: ${u.cedula}` : ''}
                            </p>
                            <div class="flex gap-2 mt-1 flex-wrap">
                                <span class="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 uppercase tracking-widest">${u.institucion || 'Sin Inst.'}</span>
                                <span class="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-widest">Saber: ${u.codigo_saber || 'N/A'}</span>
                                <span class="text-[9px] font-black ${String(u.asesor_asignado || "").toLowerCase().includes('alberto') ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'} px-2 py-0.5 rounded-full border uppercase tracking-widest">Asesor: ${u.asesor_asignado || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-transparent ${rolColor}">${u.rol || 'docente'}</span>
                        <div class="flex items-center gap-1">
                            <button onclick="window.verActividadDocente('${doc.id}')" title="Ver Historial de Actividad" class="w-8 h-8 bg-[#025964]/10 rounded-lg flex items-center justify-center text-[#025964] hover:bg-[#025964] hover:text-white transition-all"><i class="ph-bold ph-calendar-check"></i></button>
                            <button onclick="window.enviarResetPass('${u.email || doc.id}')" title="Enviar Enlace de Reseteo" class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><i class="ph ph-paper-plane-tilt"></i></button>
                            <button onclick="window.copiarDatosUsuario('${doc.id}')" title="Copiar Datos" class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-teal-600 transition-colors"><i class="ph ph-copy"></i></button>
                            <button onclick="window.editarUsuario('${doc.id}')" title="Editar" class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#025964] transition-colors"><i class="ph ph-note-pencil"></i></button>
                            <button onclick="window.eliminarUsuario('${doc.id}')" title="Eliminar" class="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"><i class="ph ph-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        });
        listUsuarios.innerHTML = html || '<p class="text-center text-slate-400 py-10">No hay usuarios registrados aún.</p>';
    } catch (e) {
        console.error("Error al listar usuarios:", e);
        listUsuarios.innerHTML = `<p class="text-center text-rose-500 font-bold p-10">Error: ${e.message}</p>`;
    }
};

// Excel upload processing
window.abortarCargaExcel = false;
export const procesarExcel = (input) => {
    const file = input.files[0];
    if (!file) return;

    const progressContainer = document.getElementById('excel-progress-container');
    const progressBar = document.getElementById('excel-progress-bar');
    const progressText = document.getElementById('excel-progress-text');
    const detailText = document.getElementById('excel-detail-text');

    progressContainer.classList.remove('hidden');
    window.abortarCargaExcel = false;
    progressBar.style.width = '0%';
    progressText.innerText = "Iniciando proceso...";
    detailText.innerText = "Leyendo archivo Excel...";

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (rows.length === 0) throw new Error("El archivo está vacío");

            const headerRowIndex = rows.findIndex(row =>
                row.some(cell => String(cell || "").toLowerCase().includes("correo"))
            );

            if (headerRowIndex === -1) throw new Error("No se detectó la columna 'Correo del docente'. Verifique los encabezados.");

            const rawHeaders = rows[headerRowIndex];
            const headers = rawHeaders.map(h => String(h || "").toLowerCase().trim());
            const json = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });

            let creados = 0, errores = 0, total = json.length;

            for (let i = 0; i < total; i++) {
                if (window.abortarCargaExcel) {
                    detailText.innerText = "🛑 DETENIDO: Se han guardado los registros procesados hasta ahora.";
                    setTimeout(() => progressContainer.classList.add('hidden'), 5000);
                    return;
                }

                const row = json[i];
                try {
                    const getVal = (r, searchKeys, excludeKeys = []) => {
                        for (const sk of searchKeys) {
                            const searchLower = sk.toLowerCase().trim();
                            const foundKey = Object.keys(r).find(k => {
                                const keyLower = k.toLowerCase().trim();
                                const matchesSearch = keyLower === searchLower || keyLower.includes(searchLower);
                                const matchesExclude = excludeKeys.some(ex => keyLower.includes(ex.toLowerCase().trim()));
                                return matchesSearch && !matchesExclude;
                            });
                            if (foundKey && r[foundKey] !== undefined && r[foundKey] !== null) return r[foundKey];
                        }
                        return "";
                    };

                    const emailValue = String(getVal(row, ["Correo1", "correo docente", "correo del docente", "email docente", "correo personal", "personal", "docente", "funcionario", "correo mep", "email", "contacto", "correo"], ["institucional", "centro"])).toLowerCase().trim();
                    if (!emailValue || emailValue === "undefined") { errores++; continue; }

                    const userData = {
                        nombre: getVal(row, ["NombreDocente", "docents de ie", "nombre del docente", "docente", "nombre", "funcionario", "nombre completo"]) || "Sin Nombre",
                        cedula: String(getVal(row, ["Cedula", "cédula", "cedula", "id", "identificacion", "identificación", "cédula de identidad"]) || ""),
                        email: emailValue,
                        celular: String(getVal(row, ["Celular", "celular", "teléfono", "telefono", "móvil", "movil", "contacto teléfono"]) || ""),
                        institucion: getVal(row, ["CENTRO_EDUCATIVO", "centro educativo", "institución", "institucion", "centro", "nombre de la institución", "escuela", "colegio"]) || "Sin Institución",
                        codigo_saber: String(getVal(row, ["CODSABER", "saber", "código de saber", "codigo saber"]) || ""),
                        codigo_presupuestario: String(getVal(row, ["codiPres", "código presupuestario", "codigo presupuestario", "presupuestario", "código centro", "codigo centro"]) || ""),
                        correo_institucional: String(getVal(row, ["Correo2", "correo institucional", "email institucional", "correo centro"], ["correo1"])).toLowerCase().trim(),
                        regional: getVal(row, ["REGIONAL", "regional", "dirección regional", "dre", "region", "región"]),
                        circuito: getVal(row, ["CIRCUITO", "circuito", "p_circuito", "circ", "número de circuito"]),
                        dimension_2025: getVal(row, ["Dimension", "dimensión 2025", "dimension 2025"]),
                        equipo_pronie: getVal(row, ["equipopronie", "equipo pronie"]),
                        sutel_p3: getVal(row, ["programa3", "sutel", "p3"]),
                        formacion_tecno: getVal(row, ["formaciontecno", "formación tecnológica", "formacion"]),
                        plan_nacional: getVal(row, ["planacional", "plan nacional"]),
                        asesor_asignado: getVal(row, ["Asesor", "asesor", "nombre del asesor"]),
                        rol: "docente",
                        perfil_completo: false,
                        registradoVia: "excel_v2026_final",
                        actualizadoEn: serverTimestamp()
                    };

                    await setDoc(doc(db, "registro_usuarios", emailValue), userData, { merge: true });

                    if (userData.institucion !== "Sin Institución") {
                        const instSlug = userData.institucion.toLowerCase().replace(/[^a-z0-9]/g, '_');
                        await setDoc(doc(db, "status_instituciones", instSlug), {
                            nombre: userData.institucion,
                            regional: userData.regional,
                            circuito: userData.circuito,
                            correo_institucional: userData.correo_institucional,
                            codigo_presupuestario: userData.codigo_presupuestario,
                            asesor: userData.asesor_asignado,
                            actualizado: new Date().toLocaleDateString('es-CR'),
                            categoria: row["Prioridad"] || "CONTINUIDAD"
                        }, { merge: true });
                    }
                    creados++;
                } catch (err) {
                    errores++;
                }

                const p = Math.round(((i + 1) / total) * 100);
                progressBar.style.width = `${p}%`;
                progressText.innerText = `Procesando: ${p}%`;
                detailText.innerText = `Fila ${i + 1} de ${total} | Éxitos: ${creados} | Errores: ${errores}`;

                if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
            }

            progressText.innerText = "✅ PROCESO COMPLETADO";
            detailText.innerText = `Finalizado. Éxitos: ${creados} | Errores: ${errores}`;
            setTimeout(() => progressContainer.classList.add('hidden'), 6000);

            input.value = "";
            if (window.listarUsuarios && !document.getElementById('admin-usuarios-list').classList.contains('hidden')) listarUsuarios();
            if (window.mostrarInstituciones) mostrarInstituciones();
            if (window.updateAdminChart) window.updateAdminChart();

        } catch (err) {
            console.error("Error en Excel:", err);
            progressText.innerText = "❌ ERROR EN EL ARCHIVO";
            detailText.innerText = err.message;
            input.value = "";
            setTimeout(() => progressContainer.classList.add('hidden'), 8000);
        }
    };
    reader.readAsArrayBuffer(file);
};

// --- Cerebro IA (Base de Conocimiento) ---

export const mostrarCerebroIA = () => {
    document.getElementById('admin-search-input').value = "";
    document.getElementById('admin-instituciones-list').classList.add('hidden');
    document.getElementById('admin-instituciones-container').classList.add('hidden');
    document.getElementById('admin-usuarios-list').classList.add('hidden');
    document.getElementById('admin-bitacora-section').classList.add('hidden');
    document.getElementById('admin-diagnostico-section')?.classList.add('hidden');
    document.getElementById('admin-monitor-section').classList.add('hidden');
    document.getElementById('admin-cerebro-section').classList.remove('hidden');

    const title = document.querySelector('#admin h3') || { innerText: "" };
    title.innerText = "Cerebro IA";

    cargarReglasIA();
};

const cargarReglasIA = async () => {
    const list = document.getElementById('admin-cerebro-list');
    list.innerHTML = '<div class="col-span-full text-center p-10"><i class="ph ph-spinner-gap animate-spin text-2xl text-slate-300"></i></div>';

    try {
        const q = query(collection(db, "ia_knowledge_base"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);

        if (snap.empty) {
            list.innerHTML = '<p class="col-span-full text-center text-slate-400 italic py-10">No hay reglas en la base de conocimiento.</p>';
            return;
        }

        let html = '';
        snap.forEach(d => {
            const data = d.data();
            html += `
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div class="absolute top-0 right-0 p-3 bg-red-50 text-red-500 rounded-bl-2xl cursor-pointer hover:bg-red-100 transition-colors" onclick="window.eliminarReglaIA('${d.id}')" title="Eliminar regla">
                        <i class="ph-bold ph-trash"></i>
                    </div>
                    <div class="mb-2">
                        <span class="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">${data.categoria || 'Concepto'}</span>
                        <span class="text-[9px] text-slate-400 ml-2">${new Date(data.timestamp?.toMillis() || Date.now()).toLocaleDateString('es-CR')}</span>
                    </div>
                    <p class="text-sm text-slate-700 font-medium leading-relaxed">${data.texto}</p>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (e) {
        console.error("Error cargando reglas IA:", e);
        list.innerHTML = '<p class="col-span-full text-center text-rose-500 font-bold p-10">Error al cargar la base de conocimiento.</p>';
    }
};

window.abrirModalReglaIA = () => {
    const texto = prompt("Ingresa el texto de la normativa 2026 para que la IA lo aprenda:\nEj: 'Los proyectos tecnológicos deben tener 5 fases según Design Thinking.'");
    if (!texto) return;

    const categoria = prompt("Categoría de la regla:\n(Ej: Evaluación, Metodología, Saberes, General)", "General");
    if (!categoria) return;

    window.guardarReglaIA({ texto, categoria });
};

window.guardarReglaIA = async (data) => {
    msg("⏳ Guardando conocimiento en la IA...", "normal");
    try {
        await addDoc(collection(db, "ia_knowledge_base"), {
            texto: data.texto,
            categoria: data.categoria,
            creadoPor: auth.currentUser?.email || 'admin',
            timestamp: serverTimestamp()
        });
        msg("✅ Base de conocimiento actualizada", "success");
        cargarReglasIA();
    } catch (e) {
        console.error(e);
        msg("⛔ Error al guardar la regla", "err");
    }
};

window.eliminarReglaIA = async (id) => {
    if (!confirm("¿Seguro que deseas olvidar esta regla en la IA?")) return;
    try {
        await deleteDoc(doc(db, "ia_knowledge_base", id));
        msg("✅ Regla eliminada", "success");
        cargarReglasIA();
    } catch (e) {
        console.error(e);
        msg("⛔ Error al eliminar", "err");
    }
};

// --- Monitor Consultas IA ---

export const mostrarMonitorIA = () => {
    document.getElementById('admin-search-input').value = "";
    document.getElementById('admin-instituciones-list').classList.add('hidden');
    document.getElementById('admin-instituciones-container').classList.add('hidden');
    document.getElementById('admin-usuarios-list').classList.add('hidden');
    document.getElementById('admin-bitacora-section').classList.add('hidden');
    document.getElementById('admin-diagnostico-section')?.classList.add('hidden');
    document.getElementById('admin-cerebro-section').classList.add('hidden');
    document.getElementById('admin-monitor-section').classList.remove('hidden');

    const title = document.querySelector('#admin h3') || { innerText: "" };
    title.innerText = "Monitor IA";

    cargarLogsIA();
};

const cargarLogsIA = async () => {
    const list = document.getElementById('admin-monitor-list');
    list.innerHTML = '<div class="p-10 text-center"><i class="ph ph-spinner-gap animate-spin text-2xl text-slate-300"></i><p class="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando consultas docentes...</p></div>';

    try {
        const q = query(collection(db, "ia_queries_log"), orderBy("timestamp", "desc"), limit(50));
        const snap = await getDocs(q);

        if (snap.empty) {
            list.innerHTML = '<div class="p-10 text-center text-slate-400 italic">No hay registros de consultas a la IA aún.</div>';
            return;
        }

        let html = `
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        <th class="p-4">Fecha</th>
                        <th class="p-4">Docente</th>
                        <th class="p-4">Tipo</th>
                        <th class="p-4">Consulta (Prompt)</th>
                    </tr>
                </thead>
                <tbody class="text-sm">
        `;

        snap.forEach(d => {
            const data = d.data();
            const dateStr = data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString('es-CR') : 'N/A';
            const contextType = data.tipoConsulta === 'situacion' ? 'Situación de Aprendizaje' : 'Chat General';
            const contextBadge = data.tipoConsulta === 'situacion'
                ? '<span class="px-2 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-[9px] font-bold uppercase">Situación</span>'
                : '<span class="px-2 py-1 bg-sky-50 text-sky-600 border border-sky-100 rounded-full text-[9px] font-bold uppercase">Chat</span>';

            html += `
                <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td class="p-4 text-[11px] text-slate-500 whitespace-nowrap">${dateStr}</td>
                    <td class="p-4 text-slate-800 font-medium whitespace-nowrap">${data.userEmail || data.userId || 'Docente'}</td>
                    <td class="p-4">${contextBadge}</td>
                    <td class="p-4 text-slate-600 italic line-clamp-2 max-w-sm" title="${data.prompt}">"${data.prompt}"</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        list.innerHTML = html;

    } catch (e) {
        console.error("Error cargando logs IA:", e);
        list.innerHTML = '<p class="text-center text-rose-500 font-bold p-10">Error al cargar las consultas.</p>';
    }
};

window.exportarConsultasIA = async () => {
    msg("Descarga no implementada en este MVP. Consulta Firebase Console.", "normal");
};

window.mostrarCerebroIA = mostrarCerebroIA;
window.mostrarMonitorIA = mostrarMonitorIA;
