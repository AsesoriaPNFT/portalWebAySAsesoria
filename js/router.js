// js/router.js
export const router = (view) => {
    // Definimos qué vistas son exclusivas de admin
    const protectedViews = ['mantenimiento', 'admin'];

    // Si la vista solicitada está protegida y el usuario NO es admin
    if (protectedViews.includes(view)) {
        if (!window.currentUserData || window.currentUserData.rol !== 'admin') {
            msg("⛔ Acceso denegado. Función exclusiva para administradores.", "err");
            return; // Bloquea la navegación
        }
    }

    // Ocultar todas las vistas
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

    // Remover clase active de todos los links del menú
    document.querySelectorAll('#main-menu a, #menu-movil a').forEach(el => {
        el.classList.remove('bg-white/10', 'text-white', 'shadow-inner');
        el.classList.add('text-teal-100', 'hover:bg-white/5');
    });

    const currentSection = document.getElementById(view);
    if (currentSection) {
        currentSection.classList.remove('hidden');

        // Activar link(s) correspondiente(s)
        document.querySelectorAll(`[onclick="router('${view}')"]`).forEach(el => {
            el.classList.add('bg-white/10', 'text-white', 'shadow-inner');
            el.classList.remove('text-teal-100', 'hover:bg-white/5');
        });

        // Lógica específica por vista
        if (view === 'dashboard') {
            window.cargarGaleriaRecursos();
        } else if (view === 'orientaciones') {
            window.switchOrientTab('admin');
            const nt = localStorage.getItem('pnft_orient_notes');
            if (nt && document.getElementById('orient-notes')) document.getElementById('orient-notes').value = nt;
        } else if (view === 'foro') {
            window.cargarForoGlobal();
        } else if (view === 'iaHub') {
            window.updateIASelectors();
            window.updateUploadSelectors();
        } else if (view === 'admin') {
            window.mostrarInstituciones();
            window.updateAdminChart();
        }

        // Si estamos en móvil, cerrar el menú tras navegar
        const menuMovil = document.getElementById('menu-movil');
        if (menuMovil && !menuMovil.classList.contains('hidden')) {
            window.toggleMenu();
        }
    }
};

window.toggleMenu = () => {
    const m = document.getElementById('menu-movil');
    m.classList.toggle('hidden');
};
