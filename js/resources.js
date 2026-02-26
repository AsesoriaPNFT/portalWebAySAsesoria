// js/resources.js
import { db, storage } from './config.js';
import { collection, getDocs, doc, setDoc, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { msg } from './ui.js';

export const subirRecursoDigital = async () => {
    const file = document.getElementById('res-upload-file').files[0];
    const titulo = document.getElementById('res-upload-title').value.trim();
    const tag = document.getElementById('res-upload-tag').value.trim();
    const isDestacado = document.getElementById('res-upload-destacado').checked;

    if (!file || !titulo || !tag) return msg("⚠️ Complete título, etiqueta y seleccione un archivo.", "err");

    const btn = document.getElementById('btn-upload-res');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="ph-bold ph-spinner-gap animate-spin"></i> Subiendo...';
    btn.disabled = true;

    try {
        const fileRef = ref(storage, `recursos_oficiales/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        const docId = `res_${Date.now()}`;
        await setDoc(doc(db, "recursos_oficiales", docId), {
            titulo: titulo,
            tag: tag.toUpperCase(),
            url: url,
            destacado: isDestacado,
            fecha: new Date().toISOString(),
            tipo: file.type || "Desconocido",
            subido_por: window.currentUserData?.nombre || "Administrador"
        });

        msg("✅ Documento subido y publicado.", "success");
        window.cerrarModalSubirRecurso();
        window.cargarGaleriaRecursos();
    } catch (e) {
        console.error("Error al subir recurso:", e);
        msg("⛔ Error al subir el archivo.", "err");
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

export const cargarGaleriaRecursos = async () => {
    const galeria = document.getElementById('galeria-recursos');
    if (!galeria) return;

    galeria.innerHTML = `
        <div class="col-span-full py-16 flex flex-col items-center">
            <div class="w-12 h-12 border-4 border-[#025964] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando biblioteca digital...</p>
        </div>
    `;

    try {
        const q = query(collection(db, "recursos_oficiales"), orderBy("fecha", "desc"));
        const snap = await getDocs(q);

        let destacadosDest = "";
        let recientesHtml = "";

        snap.forEach(d => {
            const data = d.data();
            const esPDF = data.tipo.includes('pdf');
            const icon = esPDF ? 'ph-file-pdf text-rose-500' : 'ph-file-text text-blue-500';
            const bgIcon = esPDF ? 'bg-rose-50' : 'bg-blue-50';

            const card = `
                <a href="${data.url}" target="_blank" class="block p-5 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 w-20 h-20 bg-slate-50/50 rounded-full blur-xl group-hover:bg-[#025964]/5 transition-colors"></div>
                    <div class="relative z-10 flex items-start gap-4">
                        <div class="w-12 h-12 ${bgIcon} rounded-2xl flex items-center justify-center shrink-0 border border-slate-100/50 shadow-sm mt-1">
                            <i class="ph-fill ${icon} text-2xl"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-[9px] font-black tracking-widest uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                    ${data.tag}
                                </span>
                                ${data.destacado ? '<span class="text-[9px] font-black tracking-widest uppercase bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1"><i class="ph-fill ph-star"></i> Nuevo</span>' : ''}
                            </div>
                            <h5 class="font-bold text-slate-800 text-sm leading-tight group-hover:text-[#025964] transition-colors line-clamp-2">${data.titulo}</h5>
                            <p class="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1">
                                <i class="ph-bold ph-clock"></i> ${new Date(data.fecha).toLocaleDateString('es-CR')}
                            </p>
                        </div>
                    </div>
                </a>
            `;

            if (data.destacado) destacadosDest += card;
            else recientesHtml += card;
        });

        // Actualizar UI del Dashboard Principal
        const dbContainer = document.getElementById('dashboard-recursos');
        if (dbContainer) {
            dbContainer.innerHTML = destacadosDest + recientesHtml;
            if (!destacadosDest && !recientesHtml) dbContainer.innerHTML = '<p class="text-[11px] font-bold text-slate-400 p-8 text-center w-full col-span-full border-2 border-dashed border-slate-200 rounded-3xl">Pronto agregaremos circulares y guías oficiales aquí.</p>';
        }

        // Actualizar Modal (si existe la vista de biblioteca completa)
        galeria.innerHTML = destacadosDest + recientesHtml;
        if (!galeria.innerHTML) galeria.innerHTML = '<p class="text-[11px] font-bold text-slate-400 py-16 text-center w-full col-span-full">No hay documentos en la biblioteca.</p>';

    } catch (e) {
        console.error("Error al cargar galería:", e);
        galeria.innerHTML = '<p class="col-span-full text-center p-16 font-bold text-rose-500 text-xs shadow-sm bg-rose-50 rounded-3xl border border-rose-100">No se pudieron cargar los documentos</p>';
    }
};

export const eliminarRecurso = async (id, nombre) => {
    if (!confirm(`¿Eliminar el recurso ${nombre}?`)) return;
    try {
        const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
        await deleteDoc(doc(db, "recursos_oficiales", id));
        msg("Recurso eliminado", "success");
        cargarGaleriaRecursos();
    } catch (e) {
        console.error(e);
        msg("Error al eliminar", "err");
    }
};
