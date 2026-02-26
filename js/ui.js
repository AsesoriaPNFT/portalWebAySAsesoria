// js/ui.js
export const msg = (text, type) => {
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-2xl font-bold shadow-2xl transition-all duration-300 transform translate-y-20 opacity-0';
        document.body.appendChild(toast);
    }

    if (!text) {
        toast.classList.add('translate-y-20', 'opacity-0');
        // also clear the old status msg if it exists inside auth block
        const authMsg = document.getElementById('status-msg');
        if (authMsg) {
            authMsg.innerText = "";
            authMsg.className = "mt-6 text-xs text-center font-bold min-h-[1.5em]";
        }
        return;
    }

    const colors = {
        err: 'bg-rose-500 text-white',
        success: 'bg-teal-500 text-white',
        normal: 'bg-slate-800 text-white'
    };

    toast.innerText = text;
    toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-2xl font-bold shadow-2xl transition-all duration-300 transform ${colors[type] || colors.normal}`;

    // also update auth block msg
    const authMsg = document.getElementById('status-msg');
    if (authMsg) {
        authMsg.innerText = text;
        authMsg.className = `mt-6 text-xs text-center font-bold min-h-[1.5em] ${type === 'err' ? 'text-red-400' : 'text-green-400'}`;
    }

    setTimeout(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    }, 10);

    if (type !== 'normal') {
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 4000);
    }
};

export const switchAuthTab = (t) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const loginBtn = document.getElementById('tab-login');
    const regBtn = document.getElementById('tab-register');
    if (loginBtn) loginBtn.classList.toggle('active', t === 'login');
    if (regBtn) regBtn.classList.toggle('active', t === 'register');

    document.getElementById('form-login').classList.toggle('hidden', t !== 'login');
    document.getElementById('form-register').classList.toggle('hidden', t !== 'register');
    msg("", "");
};
