// js/main.js
import { initAuthObserver, loginUser, registerUser, enviarResetPass, logout } from './auth.js';
import { msg, switchAuthTab } from './ui.js';
import { router } from './router.js';
import {
    llamarGemini,
    ejecutarHerramientaIA,
    askOrientIA,
    generarSituacion,
    planificarSesion,
    enviarChatIA
} from './ia.js';
import {
    mostrarInstituciones,
    listarUsuarios,
    procesarExcel
} from './admin.js';
import {
    updateAdminChart,
    guardarBitacora,
    cargarBitacoras,
    analizarBitacoraIA
} from './adminData.js';
import {
    subirRecursoDigital,
    cargarGaleriaRecursos,
    eliminarRecurso
} from './resources.js';

// Exponer funciones globales (window) para que onClick y onsubmit sigan funcionando
window.msg = msg;
window.switchAuthTab = switchAuthTab;
window.router = router;

// Auth
window.loginUser = loginUser;
window.registerUser = registerUser;
window.enviarResetPass = enviarResetPass;
window.logout = logout;

// Admin UI - Listas
window.mostrarInstituciones = mostrarInstituciones;
window.listarUsuarios = listarUsuarios;
window.procesarExcel = procesarExcel;

// Admin Data - Gráficos y Bitácora
window.updateAdminChart = updateAdminChart;
window.guardarBitacora = guardarBitacora;
window.cargarBitacoras = cargarBitacoras;
window.analizarBitacoraIA = analizarBitacoraIA;

// Recursos
window.subirRecursoDigital = subirRecursoDigital;
window.cargarGaleriaRecursos = cargarGaleriaRecursos;
window.eliminarRecurso = eliminarRecurso;

// IA
window.llamarGemini = llamarGemini;
window.ejecutarHerramientaIA = ejecutarHerramientaIA;
window.askOrientIA = askOrientIA;
window.generarSituacion = generarSituacion;
window.planificarSesion = planificarSesion;
window.enviarChatIA = enviarChatIA;

// Modales UI (las definimos aquí porque son cortas y manipulan directamente el DOM)
window.abrirModalSubirRecurso = () => document.getElementById('modal-subir-recurso').classList.remove('hidden');
window.cerrarModalSubirRecurso = () => {
    document.getElementById('modal-subir-recurso').classList.add('hidden');
    document.getElementById('form-subir-recurso').reset();
};
window.abrirModalPreRegistro = () => document.getElementById('modal-pre-registro').classList.remove('hidden');
window.cerrarModalPreRegistro = () => {
    document.getElementById('modal-pre-registro').classList.add('hidden');
    document.getElementById('form-pre-registro').reset();
};
window.cerrarModalEditarUsuario = () => document.getElementById('modal-editar-usuario').classList.add('hidden');
window.cerrarModalEditarInstitucion = () => document.getElementById('modal-editar-institucion').classList.add('hidden');
window.cerrarModalActividad = () => document.getElementById('modal-actividad-docente').classList.add('hidden');

// Manejo de UI general
window.switchOrientTab = (t) => {
    document.querySelectorAll('.orient-tab').forEach(b => b.classList.remove('active', 'bg-[#025964]', 'text-white'));
    document.querySelectorAll('.orient-tab').forEach(b => b.classList.add('bg-slate-100', 'text-slate-600'));
    const btnNav = document.getElementById(`otab-${t}`);
    if (btnNav) {
        btnNav.classList.add('active', 'bg-[#025964]', 'text-white');
        btnNav.classList.remove('bg-slate-100', 'text-slate-600');
    }

    document.querySelectorAll('.orient-content').forEach(c => c.classList.add('hidden'));
    const contentTab = document.getElementById(`ocontent-${t}`);
    if (contentTab) contentTab.classList.remove('hidden');
};
window.router = (viewName) => {
    // Si no está logueado, forzar a 'auth' (seguridad en el cliente)
    if (!window.currentUserData && viewName !== 'auth') {
        viewName = 'auth';
    }

    // Ocultar Auth Container si no es auth
    const authContainer = document.getElementById('auth-container');
    const appLayout = document.getElementById('app-layout');

    if (viewName === 'auth') {
        authContainer.classList.remove('hidden');
        appLayout.classList.add('hidden');
        return; // No cargar vistas en el content-area si estamos en auth
    } else {
        authContainer.classList.add('hidden');
        appLayout.classList.remove('hidden');
    }

    const contentArea = document.getElementById('content-area');

    // --- Inyección Dinámica de Vistas ---
    const viewsHtml = {
        'dashboard': `
            <div id="view-dashboard" class="view section-active space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <!-- Hero Section con Prompt IA -->
                <div class="relative rounded-[2.5rem] bg-[#025964] text-white overflow-hidden p-8 md:p-12 shadow-2xl shadow-teal-900/20 group">
                    <div class="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div class="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
                    
                    <div class="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 font-bold text-xs uppercase tracking-widest text-teal-100 shadow-sm">
                                <i class="ph-fill ph-sparkle text-teal-300"></i> Asistente de Planificación 2026
                            </div>
                            <h2 class="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight">Diseña mediaciones <span class="text-teal-300">extraordinarias</span></h2>
                            <p class="text-teal-50 text-base md:text-lg mb-8 font-medium max-w-xl leading-relaxed opacity-90">Describe el contexto de tu grupo o el reto técnico que quieres abordar. La IA estructurará una situación de aprendizaje basada en Design Thinking.</p>
                            
                            <div class="bg-white/10 backdrop-blur-xl p-2 rounded-3xl border border-white/20 shadow-inner flex flex-col sm:flex-row gap-2 transition-all focus-within:bg-white/15 focus-within:border-white/30">
                                <input type="text" id="quick-ia-prompt" placeholder="Ej: Mis estudiantes de 10° necesitan entender redes inalámbricas..." class="w-full bg-transparent text-white placeholder-teal-100 px-6 py-4 outline-none font-medium text-sm">
                                <button onclick="window.generarSituacionRapida()" class="bg-white text-[#025964] hover:bg-teal-50 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap">
                                    <i class="ph-bold ph-magic-wand"></i> Generar
                                </button>
                            </div>
                        </div>
                        <div class="hidden lg:flex justify-end relative">
                            <!-- Visual Decorativo IA -->
                            <div class="relative w-72 h-72">
                                <div class="absolute inset-0 border-2 border-dashed border-white/20 rounded-full animate-[spin_60s_linear_infinite]"></div>
                                <div class="absolute inset-4 border border-white/10 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div class="w-32 h-32 bg-gradient-to-tr from-teal-400 to-emerald-300 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-teal-500/50 backdrop-blur-md border border-white/40 group-hover:rotate-0 transition-all duration-700 ease-out">
                                        <i class="ph-fill ph-brain text-6xl text-white drop-shadow-md"></i>
                                    </div>
                                </div>
                                <!-- Flotantes -->
                                <div class="absolute top-10 right-10 w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 animate-bounce shadow-lg" style="animation-duration: 3s;"><i class="ph-bold ph-lightbulb text-xl text-teal-200"></i></div>
                                <div class="absolute bottom-10 left-10 w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 animate-bounce shadow-lg" style="animation-duration: 4s; animation-delay: 1s;"><i class="ph-bold ph-code text-lg text-emerald-200"></i></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Grid de Accesos Rápidos (Rediseñado) -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Tarjeta 1 -->
                    <button onclick="window.router('orientaciones')" class="group text-left p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-white to-slate-50 border border-slate-100 hover:border-teal-200 transition-all shadow-sm hover:shadow-xl hover:shadow-teal-900/5 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                        <div class="relative z-10 flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 group-hover:bg-[#025964] group-hover:text-white transition-colors duration-300 shadow-inner">
                                <i class="ph-fill ph-book-open-text text-2xl"></i>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-teal-600 transition-colors">
                                <i class="ph-bold ph-arrow-up-right"></i>
                            </div>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-1 group-hover:text-[#025964] transition-colors">Orientaciones</h3>
                            <p class="text-xs text-slate-500 font-medium">Lineamientos 2026</p>
                        </div>
                    </button>

                    <!-- Tarjeta 2 -->
                    <button onclick="window.router('guia')" class="group text-left p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-white to-slate-50 border border-slate-100 hover:border-amber-200 transition-all shadow-sm hover:shadow-xl hover:shadow-amber-900/5 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                        <div class="relative z-10 flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                                <i class="ph-fill ph-map-trifold text-2xl"></i>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-amber-500 transition-colors">
                                <i class="ph-bold ph-arrow-up-right"></i>
                            </div>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-1 group-hover:text-amber-600 transition-colors">Guía Docente</h3>
                            <p class="text-xs text-slate-500 font-medium">Ruta didáctica</p>
                        </div>
                    </button>

                    <!-- Tarjeta 3 -->
                    <button onclick="window.router('foro')" class="group text-left p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-white to-slate-50 border border-slate-100 hover:border-rose-200 transition-all shadow-sm hover:shadow-xl hover:shadow-rose-900/5 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                        <div class="relative z-10 flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                                <i class="ph-fill ph-users-three text-2xl"></i>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-rose-500 transition-colors">
                                <i class="ph-bold ph-arrow-up-right"></i>
                            </div>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-1 group-hover:text-rose-600 transition-colors">Comunidad</h3>
                            <p class="text-xs text-slate-500 font-medium">Comparte saberes</p>
                        </div>
                    </button>

                    <!-- Tarjeta 4 -->
                    <button onclick="window.router('ia')" class="group text-left p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-white to-slate-50 border border-slate-100 hover:border-emerald-200 transition-all shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                        <div class="relative z-10 flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                                <i class="ph-fill ph-robot text-2xl"></i>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-colors">
                                <i class="ph-bold ph-arrow-up-right"></i>
                            </div>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-1 group-hover:text-emerald-600 transition-colors">Cerebro IA</h3>
                            <p class="text-xs text-slate-500 font-medium">Asesor virtual 24/7</p>
                        </div>
                    </button>
                </div>

                <!-- Sección: Nube de Producciones Digitales (NUEVA) -->
                <div class="mt-12 bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
                    <!-- Elementos decorativos de fondo -->
                    <div class="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <i class="ph-fill ph-cloud-arrow-up text-[15rem] text-[#025964]"></i>
                    </div>

                    <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10 gap-6">
                        <div>
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 mb-4 text-[10px] font-black uppercase tracking-widest text-[#025964]">
                                <span class="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span> Construcción Colectiva
                            </div>
                            <h3 class="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">Ecosistema Digital 2026</h3>
                            <p class="text-sm text-slate-500 font-medium">Comparte tus producciones y explora los recursos de otros docentes a nivel nacional.</p>
                        </div>
                        <button onclick="window.abrirModalSubir()" class="bg-[#025964] hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-teal-900/20 hover:-translate-y-1 flex items-center gap-2 shrink-0">
                            <i class="ph-bold ph-upload-simple text-lg"></i> Compartir Recurso
                        </button>
                    </div>

                    <!-- Pestañas de niveles para galería -->
                    <div class="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2">
                        <button onclick="window.filtrarRecursos('todos')" class="filter-btn active px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-teal-50 text-[#025964] border border-teal-100">Todos</button>
                        <button onclick="window.filtrarRecursos('7° Año')" class="filter-btn px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-white text-slate-400 border border-slate-100 hover:bg-slate-50">Sétimo (7°)</button>
                        <button onclick="window.filtrarRecursos('8° Año')" class="filter-btn px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-white text-slate-400 border border-slate-100 hover:bg-slate-50">Octavo (8°)</button>
                        <button onclick="window.filtrarRecursos('9° Año')" class="filter-btn px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-white text-slate-400 border border-slate-100 hover:bg-slate-50">Noveno (9°)</button>
                        <button onclick="window.filtrarRecursos('10° Año')" class="filter-btn px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-white text-slate-400 border border-slate-100 hover:bg-slate-50">Décimo (10°)</button>
                        <button onclick="window.filtrarRecursos('11° Año')" class="filter-btn px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-white text-slate-400 border border-slate-100 hover:bg-slate-50">Undécimo (11°)</button>
                    </div>

                    <!-- Contenedor Galería: Grid 3 columnas -->
                    <div id="galeria-recursos" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        <!-- El JS llenará esto. Mostrar placeholder de carga inicial: -->
                        <div class="col-span-full py-20 flex flex-col items-center justify-center">
                            <div class="w-12 h-12 border-4 border-[#025964]/20 border-t-[#025964] rounded-full animate-spin mb-4"></div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando ecosistema vivo...</p>
                        </div>
                    </div>
                </div>
            </div>
        `,
        'orientaciones': `
            <div id="view-orientaciones" class="view hidden space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div class="text-center mb-10">
                    <h2 class="text-3xl font-black text-slate-800 mb-2 tracking-tight">Orientaciones 2026</h2>
                    <p class="text-sm font-medium text-slate-500">Consulta los lineamientos oficiales para la Formación Tecnológica.</p>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-2">
                    <button onclick="window.switchOrientTab('admin')" class="orient-tab active px-4 py-2 text-xs font-bold uppercase tracking-wide text-teal-600 border-b-2 border-teal-600">Administrativas</button>
                    <button onclick="window.switchOrientTab('pedag')" class="orient-tab px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 border-b-2 border-transparent hover:text-slate-600">Pedagógicas</button>
                    <button onclick="window.switchOrientTab('planif')" class="orient-tab px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 border-b-2 border-transparent hover:text-slate-600">Planificación</button>
                    <button onclick="window.switchOrientTab('eval')" class="orient-tab px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 border-b-2 border-transparent hover:text-slate-600">Evaluación</button>
                    <button onclick="window.switchOrientTab('pobs')" class="orient-tab px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 border-b-2 border-transparent hover:text-slate-600">Poblaciones</button>
                </div>
                
                <div id="orient-main-content" class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
                    <!-- Contenido dinámico tab -->
                </div>
            </div>
        `,
        'guia': `
            <div id="view-guia" class="view hidden space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div class="text-center mb-10">
                    <h2 class="text-3xl font-black text-slate-800 mb-2 tracking-tight">Guía Docente Modular</h2>
                    <p class="text-sm font-medium text-slate-500">Selecciona el nivel para ver la estructura, módulos y saberes.</p>
                </div>
                
                <div class="flex flex-wrap gap-2 justify-center mb-6">
                    <button onclick="window.switchLevelTab('7')" class="level-tab active bg-[#025964] text-white px-6 py-2 rounded-full text-xs font-bold shadow-md">Sétimo (7°)</button>
                    <button onclick="window.switchLevelTab('8')" class="level-tab bg-slate-100 text-slate-600 px-6 py-2 rounded-full text-xs font-bold hover:bg-slate-200">Octavo (8°)</button>
                    <button onclick="window.switchLevelTab('9')" class="level-tab bg-slate-100 text-slate-600 px-6 py-2 rounded-full text-xs font-bold hover:bg-slate-200">Noveno (9°)</button>
                    <button onclick="window.switchLevelTab('10')" class="level-tab bg-slate-100 text-slate-600 px-6 py-2 rounded-full text-xs font-bold hover:bg-slate-200">Décimo (10°)</button>
                    <button onclick="window.switchLevelTab('11')" class="level-tab bg-slate-100 text-slate-600 px-6 py-2 rounded-full text-xs font-bold hover:bg-slate-200">Undécimo (11°)</button>
                </div>
                
                <div id="level-content-area" class="space-y-6">
                    <!-- Contenido dinámico niveles -->
                </div>
            </div>
        `,
        'foro': `
            <div id="view-foro" class="view hidden space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto">
                <div class="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100" id="foro-publicar-container">
                    <h3 class="font-black text-slate-800 mb-4 text-lg">Publicar en Comunidad</h3>
                    <div class="flex gap-4 mb-4">
                        <select id="foro-categoria" class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:border-[#025964]">
                            <option>Duda Pedagógica</option>
                            <option>Recurso Didáctico</option>
                            <option>Experiencia de Aula</option>
                            <option>Reflexión Docente</option>
                            <option>Aviso Administrativo</option>
                        </select>
                    </div>
                    <textarea id="foro-msg" class="w-full h-24 bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm outline-none focus:border-[#025964] focus:bg-white transition-all resize-none mb-4" placeholder="¿Qué deseas compartir con la red docente?"></textarea>
                    <div class="flex justify-end">
                        <button onclick="guardarForoPost()" class="bg-[#025964] text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-700 transition-colors shadow-md">
                            Publicar
                        </button>
                    </div>
                </div>
                
                <div id="foro-feed" class="space-y-4">
                    <div class="p-10 text-center"><div class="w-8 h-8 border-4 border-[#025964] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p class="text-xs text-slate-400 font-bold uppercase">Cargando comunidad...</p></div>
                </div>
            </div>
        `,
        'ia': `
            <div id="view-ia" class="view hidden max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 h-[calc(100vh-120px)] flex flex-col">
                <div class="bg-[#025964] text-white p-6 rounded-t-3xl shadow-md z-10 relative flex justify-between items-center shrink-0">
                    <div>
                        <h2 class="font-black text-xl flex items-center gap-2"><i class="ph-fill ph-robot"></i> Asistente Pedagógico IA</h2>
                        <p class="text-xs text-teal-100 font-medium opacity-90">Basado en las Orientaciones Curriculares 2026</p>
                    </div>
                    <div class="px-3 py-1 bg-white/20 rounded-full border border-white/30 text-[10px] font-bold tracking-widest uppercase">
                        Modo RAG Activo
                    </div>
                </div>
                <div id="chat-history" class="flex-1 bg-slate-50 p-6 overflow-y-auto space-y-6">
                    <!-- Intro IA -->
                    <div class="flex gap-4">
                        <div class="w-10 h-10 rounded-full bg-[#025964] flex-shrink-0 flex items-center justify-center text-white shadow-md"><i class="ph-fill ph-robot text-xl"></i></div>
                        <div class="bg-white p-6 rounded-[2rem] rounded-tl-none max-w-[85%] text-sm font-medium text-slate-600 leading-relaxed shadow-sm border border-slate-200">
                            ¡Hola! Soy tu asistente pedagógico especializado en las directrices 2026 de Formación Tecnológica. <br><br>
                            Conozco a fondo el perfil de salida, los componentes de evaluación, las fases de un proyecto tecnológico y la ruta metodológica. ¿En qué te puedo asesorar hoy?
                        </div>
                    </div>
                </div>
                <div class="p-4 bg-white border-t border-slate-100 rounded-b-3xl shadow-sm shrink-0">
                    <div class="flex gap-2">
                        <input type="text" id="chat-input" placeholder="Pregunta sobre evaluación, metodología, saberes..." class="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium outline-none focus:border-[#025964] focus:bg-white transition-all">
                        <button onclick="window.enviarChatIA()" class="w-12 h-12 bg-[#025964] rounded-2xl text-white flex items-center justify-center hover:bg-teal-700 transition-colors shadow-md shrink-0">
                            <i class="ph-bold ph-paper-plane-tilt text-lg"></i>
                        </button>
                    </div>
                    <p class="text-[9px] text-center text-slate-400 font-bold uppercase tracking-wide mt-2">La IA puede cometer errores. Verifica la información importante con documentos oficiales.</p>
                </div>
            </div>
        `,
        'admin': `
            <div id="view-admin" class="view hidden space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 class="text-3xl font-black text-slate-800 tracking-tight">Panel de Control Regional</h2>
                        <h3 class="text-sm font-bold text-[#025964] uppercase tracking-widest mt-1">Sede Central PNFT</h3>
                    </div>
                    <div class="flex gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar">
                        <button onclick="window.mostrarInstituciones()" class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:border-[#025964] hover:text-[#025964] transition-all whitespace-nowrap shadow-sm">Instituciones</button>
                        <button onclick="window.listarUsuarios()" class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:border-[#025964] hover:text-[#025964] transition-all whitespace-nowrap shadow-sm">Usuarios</button>
                        <button onclick="window.mostrarBitacora()" class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:border-[#025964] hover:text-[#025964] transition-all whitespace-nowrap shadow-sm">Bitácora Asesoría</button>
                        <button onclick="window.mostrarCerebroIA()" class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-emerald-100 transition-all whitespace-nowrap shadow-sm flex items-center gap-1"><i class="ph-bold ph-brain"></i> Cerebro IA</button>
                        <button onclick="window.mostrarMonitorIA()" class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-blue-100 transition-all whitespace-nowrap shadow-sm flex items-center gap-1"><i class="ph-bold ph-chart-line-up"></i> Monitor IA</button>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/50 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                     <div class="flex items-center gap-3 w-full sm:w-auto">
                        <div class="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-[#025964]">
                            <i class="ph-bold ph-magnifying-glass text-xl"></i>
                        </div>
                        <input type="text" id="admin-search-input" onkeyup="window.ejecutarBusquedaAdmin()" placeholder="Buscar docente, correo o centro..." class="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder-slate-400 min-w-[200px]">
                    </div>
                </div>

                <div id="admin-instituciones-container" class="space-y-6">
                    <div class="flex justify-between items-center">
                        <h4 class="font-black text-slate-800 uppercase text-xs tracking-widest">Lista de Centros Educativos</h4>
                    </div>
                    <div id="admin-instituciones-list" class="grid grid-cols-1 xl:grid-cols-2 gap-4"></div>
                </div>

                <div id="admin-usuarios-list" class="hidden grid grid-cols-1 gap-4"></div>
                
                <div id="admin-bitacora-section" class="hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                         <div class="relative z-10 flex flex-col h-full">
                            <h4 class="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Nuevo Registro</h4>
                            <div class="space-y-4 flex-grow">
                                <input type="date" id="bitacora-fecha" class="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-medium outline-none text-slate-600">
                                <input type="text" id="bitacora-inst" placeholder="Institución visitada/atendida" class="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-medium outline-none">
                                <textarea id="bitacora-detalle" placeholder="Detalle pedagógico o técnico tratado..." class="w-full h-24 bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-medium outline-none resize-none"></textarea>
                                <input type="url" id="bitacora-reporte" placeholder="Link al reporte en SharePoint (opcional)" class="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-medium outline-none">
                            </div>
                            <button onclick="window.guardarAporteBitacora()" class="w-full mt-4 bg-[#025964] text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-md">Registrar Aporte</button>
                        </div>
                    </div>
                    <div class="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                        <h4 class="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Historial Reciente</h4>
                        <div id="bitacora-historial-list" class="flex-grow overflow-y-auto space-y-3 pr-2 min-h-[300px]"></div>
                        <div class="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                            <button id="btn-analizar-bitacora" onclick="window.analizarBitacoraIA()" class="flex items-center gap-2 bg-amber-50 text-amber-600 hover:bg-amber-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                <i class="ph-fill ph-sparkle"></i> IA: Analizar y Actualizar Categorías
                            </button>
                        </div>
                        <div id="bitacora-ia-output" class="mt-4 text-xs font-medium text-slate-600 p-4 bg-slate-50 rounded-xl hidden"></div>
                    </div>
                </div>

                <div id="admin-cerebro-section" class="hidden space-y-6">
                    <div class="flex justify-between items-center">
                        <h4 class="font-black text-slate-800 uppercase text-xs tracking-widest">Base de Conocimiento IA (Reglas 2026)</h4>
                        <button onclick="window.abrirModalReglaIA()" class="bg-[#025964] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-2"><i class="ph-bold ph-plus"></i> Añadir Regla</button>
                    </div>
                    <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-medium mb-4">
                        <i class="ph-fill ph-info text-emerald-600"></i> Los textos añadidos aquí serán inyectados como contexto al modelo Gemini para asegurar que las respuestas se alineen con la normativa 2026.
                    </div>
                    <div id="admin-cerebro-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Lista de Reglas IA cargadas desde Firestore -->
                    </div>
                </div>

                <div id="admin-monitor-section" class="hidden space-y-6">
                    <div class="flex justify-between items-center">
                        <h4 class="font-black text-slate-800 uppercase text-xs tracking-widest">Monitor de Consultas IA (Docentes)</h4>
                        <button onclick="window.exportarConsultasIA()" class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-slate-50"><i class="ph-bold ph-download-simple"></i> Exportar</button>
                    </div>
                    <div id="admin-monitor-list" class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <!-- Tabla o lista de consultas de logs desde Firestore -->
                    </div>
                </div>
            </div>
        `
    };

    // Si la vista existe en nuestros templates inyectados, lo inyectamos si no está ya (o forzamos refresco si queremos)
    if (viewsHtml[viewName]) {
        // En una implementación más robusta evaluaríamos si ya existe para no re-renderizar todo
        // Pero dado que los ocultamos/mostramos por clases, la primera vez inyectamos todo el pool
        if (contentArea.innerHTML.trim() === '') {
            contentArea.innerHTML = Object.values(viewsHtml).join('');
        }
    }

    // Ocultar todas las views generadas dinámicamente o ya existentes
    document.querySelectorAll('.view').forEach(v => {
        v.classList.add('hidden');
        v.classList.remove('section-active');
    });

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('section-active');
    }

    // Actualizar active state de sidebar
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active', 'bg-white', 'shadow-sm');
        if (b.dataset.view === viewName) b.classList.add('active', 'bg-white', 'shadow-sm');
    });

    // Scripts específicos por vista
    if (viewName === 'admin' && window.currentUserData && window.currentUserData.rol === 'admin') {
        if (window.initAdminCharts) window.initAdminCharts();
        if (window.mostrarInstituciones) window.mostrarInstituciones();
    }
    if (viewName === 'foro' && window.cargarForo) window.cargarForo();
    if (viewName === 'dashboard' && window.cargarGaleriaRecursos) window.cargarGaleriaRecursos();
    if (viewName === 'orientaciones' && window.switchOrientTab) window.switchOrientTab('admin');
    if (viewName === 'guia' && window.switchLevelTab) window.switchLevelTab('7');

    // Auto-scroll to top para UX móvil
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el observer de Firebase Auth (dependiendo de cómo se importa, lo omitimos si auth.js lo controla o lo llamamos si existe)
    if (typeof initAuthObserver === 'function') initAuthObserver();

    // Interceptar form submissions para auth
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim().toLowerCase();
            const pass = document.getElementById('login-pass').value;
            window.loginUser(email, pass);
        });
    }
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            window.registerUser({
                email: document.getElementById('reg-email').value.trim().toLowerCase(),
                pass: document.getElementById('reg-pass').value,
                advisorKey: document.getElementById('reg-advisor').value,
                nombre: document.getElementById('reg-name').value.trim(),
                telefono: document.getElementById('reg-phone').value.trim(),
                codigo: document.getElementById('reg-codigo').value.trim()
            });
        });
    }

    // Funciones que faltaron de admin (se pueden refactorizar a admin.js después si se quiere)
    window.updateIASelectors = () => {
        const n = document.getElementById('ia-nivel').value;
        const sel = document.getElementById('ia-modulo');
        const cont = document.getElementById('ia-saberes-container');
        sel.innerHTML = ''; cont.innerHTML = '';
        import('./config.js').then(({ SABERES_DATA }) => {
            if (!SABERES_DATA[n]) return;
            SABERES_DATA[n].modulos.forEach((m, i) => sel.innerHTML += `<option value="${i}">${m.n}</option>`);
            window.updateSaberesChecks();
        });
    };

    window.updateSaberesChecks = () => {
        const n = document.getElementById('ia-nivel').value;
        const mIdx = document.getElementById('ia-modulo').value;
        const cont = document.getElementById('ia-saberes-container');
        cont.innerHTML = '';
        import('./config.js').then(({ SABERES_DATA }) => {
            SABERES_DATA[n].modulos[mIdx].s.forEach((s, idx) => {
                cont.innerHTML += `<label class="flex items-center gap-2 text-xs"><input type="checkbox" name="ia-saber" value="${s.n}" class="w-3 h-3 text-teal-600 rounded"> ${s.n}</label>`;
            });
        });
    };

    const iaNivelSel = document.getElementById('ia-nivel');
    if (iaNivelSel) iaNivelSel.addEventListener('change', window.updateIASelectors);
    const iaModSel = document.getElementById('ia-modulo');
    if (iaModSel) iaModSel.addEventListener('change', window.updateSaberesChecks);
});
