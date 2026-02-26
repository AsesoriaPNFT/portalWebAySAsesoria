// js/auth.js
import { auth, db, app } from './config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { msg } from './ui.js';
import { router } from './router.js';

window.currentUserData = null;

export const loginUser = async (email, pass) => {
    if (!email || !pass) return msg("⚠️ Faltan datos", "err");
    msg("Verificando credenciales...", "normal");

    try {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        // BACKFILL: Guardar contraseña si no existe en Firestore
        const userDoc = await getDoc(doc(db, "registro_usuarios", res.user.uid));
        if (userDoc.exists() && !userDoc.data().password) {
            console.log("Actualizando contraseña faltante en perfil...");
            await setDoc(doc(db, "registro_usuarios", res.user.uid), { password: pass }, { merge: true });
        }
    } catch (e) {
        console.error("Login Error:", e);
        const errorCode = e.code;
        if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
            try {
                const preAuthRef = doc(db, "registro_usuarios", email);
                const preAuthSnap = await getDoc(preAuthRef);

                if (preAuthSnap.exists()) {
                    msg("⭐ ¡Tu correo está autorizado! Pero aún no has creado tu contraseña. Por favor, ve a la pestaña REGISTRO.", "normal");
                    setTimeout(() => window.switchAuthTab('register'), 3000);
                } else {
                    msg("⛔ Credenciales incorrectas o usuario no autorizado.", "err");
                }
            } catch (checkErr) {
                msg("⛔ Datos incorrectos. Verifique su correo y clave.", "err");
            }
        } else {
            msg("⛔ Error de acceso: " + errorCode, "err");
        }
    }
};

export const registerUser = async (data) => {
    const { email, pass, advisorKey, nombre, telefono, codigo } = data;
    const advisorMap = {
        'alberto': 'Alberto Bustos Ortega',
        'rodolfo': 'Rodolfo Juárez Pérez',
        'admin': 'Sede Central PNFT'
    };
    const advisorName = advisorMap[advisorKey] || "Sin Asesor";

    const userData = {
        nombre: nombre,
        telefono: telefono,
        codigo: codigo,
        email: email,
        password: pass,
        asesor: advisorKey,
        asesor_asignado: advisorName,
        rol: "docente",
        ultimo_acceso: serverTimestamp()
    };

    if (!email.includes('@mep.go.cr')) return msg("⛔ Use correo @mep.go.cr", "err");
    if (pass.length < 6) return msg("⚠️ Contraseña corta", "err");
    if (!nombre || !telefono || !codigo) return msg("⚠️ Complete datos", "err");

    msg("⏳ Verificando autorización...", "normal");

    try {
        const masterAdvisors = [
            "alberto.bustos.ortega@mep.go.cr",
            "rodolfo.juarez.perez@mep.go.cr",
            "yorleny.monge.monge@mep.go.cr"
        ];
        const isMaster = masterAdvisors.includes(email.toLowerCase());

        let excelTechnicalData = {};
        let excelSnap = null;

        if (!isMaster) {
            try {
                const docRef = doc(db, "registro_usuarios", email.toLowerCase());
                excelSnap = await getDoc(docRef);

                if (!excelSnap.exists()) {
                    return msg("⛔ Tu correo no está pre-autorizado. Contacta a un asesor.", "err");
                }
                excelTechnicalData = excelSnap.data();
            } catch (err) {
                console.error("Whitelist check error:", err);
                return msg("⛔ Error al verificar autorización.", "err");
            }
        } else {
            let nombreAsesor = "Asesor Nacional";
            if (email.toLowerCase().includes("alberto")) nombreAsesor = "Alberto Bustos Ortega";
            if (email.toLowerCase().includes("rodolfo")) nombreAsesor = "Rodolfo Juárez Pérez";
            if (email.toLowerCase().includes("yorleny")) nombreAsesor = "Yorleny Monge Monge";

            excelTechnicalData = {
                rol: "admin",
                nombre: nombreAsesor,
                institucion: "Asesoría Nacional PNFT",
                asesor_asignado: "Sede Central PNFT"
            };
        }

        const finalData = {
            ...excelTechnicalData,
            ...userData,
            nombre: userData.nombre || excelTechnicalData.nombre,
            fecha_registro: serverTimestamp(),
            perfil_completo: true
        };

        msg("⏳ Registrando cuenta...", "normal");
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await guardarFicha(res.user.uid, finalData);

        if (excelSnap && excelSnap.exists()) {
            const { deleteDoc, doc: fDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
            try {
                await deleteDoc(fDoc(db, "registro_usuarios", email.toLowerCase()));
                console.log("Registro temporal de Excel eliminado.");
            } catch (delErr) {
                console.warn("No se pudo eliminar el registro temporal.");
            }
        }

        msg("✅ Cuenta creada con éxito.", "success");
    } catch (error) {
        console.error("Error en Registro:", error);
        if (error.code === 'auth/email-already-in-use') {
            msg("⚠️ Usuario existe. Reparando perfil...", "normal");
            try {
                const loginRes = await signInWithEmailAndPassword(auth, email, pass);
                let technicalData = {};
                try {
                    const snap = await getDoc(doc(db, "registro_usuarios", email.toLowerCase()));
                    if (snap.exists()) technicalData = snap.data();
                } catch (e) { }

                const repairData = {
                    ...technicalData,
                    ...userData,
                    nombre: userData.nombre || technicalData.nombre,
                    perfil_completo: true,
                    rol: (technicalData.rol === 'admin' || ["alberto.bustos.ortega@mep.go.cr", "rodolfo.juarez.perez@mep.go.cr", "yorleny.monge.monge@mep.go.cr"].includes(email.toLowerCase())) ? "admin" : "docente",
                    institucion: (technicalData.rol === 'admin' || email.toLowerCase().includes("alberto") || email.toLowerCase().includes("rodolfo") || email.toLowerCase().includes("yorleny")) ? (technicalData.institucion || "Asesoría Nacional PNFT") : (userData.institucion || technicalData.institucion)
                };

                await guardarFicha(loginRes.user.uid, repairData);

                try {
                    const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
                    await deleteDoc(doc(db, "registro_usuarios", email.toLowerCase()));
                } catch (e) { }

                msg("✅ Perfil recuperado y actualizado.", "success");
            } catch (loginErr) {
                msg("⛔ El correo ya está en uso por otro docente.", "err");
            }
        } else {
            msg("⛔ No pudimos crear tu cuenta. Verifica tus datos.", "err");
        }
    }
};

export const logout = () => signOut(auth);

export const enviarResetPass = async (targetEmail = null) => {
    console.log("Iniciando envío de reseteo para:", targetEmail);
    const email = targetEmail || document.getElementById('login-email').value.trim() || prompt("Ingresa tu correo @mep.go.cr:");
    if (!email || !email.includes('@mep.go.cr')) return msg("⚠️ Ingresa un correo institucional válido", "err");

    msg("⏳ Enviando enlace...", "normal");
    try {
        await sendPasswordResetEmail(auth, email);
        console.log("Enlace enviado con éxito a:", email);
        msg("✅ Enlace enviado con éxito.", "success");
    } catch (e) {
        console.error("Error en sendPasswordResetEmail:", e);
        msg("⛔ Error: " + e.message, "err");
    }
};

async function guardarFicha(uid, data) {
    await setDoc(doc(db, "registro_usuarios", uid), data, { merge: true });
}

export const initAuthObserver = () => {
    onAuthStateChanged(auth, async (user) => {
        try {
            if (user) {
                console.log("Sesión activa detectada:", user.email);
                const snap = await getDoc(doc(db, "registro_usuarios", user.uid));
                if (snap.exists()) {
                    window.currentUserData = snap.data();
                    const admins = [
                        "alberto.bustos.ortega@mep.go.cr",
                        "rodolfo.juarez.perez@mep.go.cr",
                        "yorleny.monge.monge@mep.go.cr"
                    ];
                    if (admins.includes(user.email.toLowerCase())) {
                        window.currentUserData.rol = 'admin';
                        window.currentUserData.institucion = "Asesoría Nacional PNFT";
                    }

                    document.getElementById('auth-screen').classList.add('hidden');
                    document.getElementById('app-layout').classList.remove('hidden');
                    document.getElementById('sidebar-name').innerText = window.currentUserData.nombre;
                    document.getElementById('sidebar-email').innerText = window.currentUserData.email;
                    document.getElementById('sidebar-avatar').innerText = window.currentUserData.nombre.charAt(0);

                    if (window.currentUserData.rol === 'admin') {
                        const navAdmin = document.getElementById('nav-admin');
                        if (navAdmin) navAdmin.classList.remove('hidden');
                        const badge = document.getElementById('user-role-badge');
                        if (badge) {
                            badge.innerText = "ADMINISTRADOR";
                            badge.className = "text-[9px] font-black bg-amber-500 text-slate-900 px-2 py-0.5 rounded";
                        }
                    } else {
                        const navAdmin = document.getElementById('nav-admin');
                        if (navAdmin) navAdmin.classList.add('hidden');
                    }
                    router('dashboard');
                } else {
                    console.warn("UID sin datos en Firestore:", user.uid);
                    msg("⚠️ Usuario sin perfil vinculado. Por favor, regístrese.", "err");
                    document.getElementById('auth-screen').classList.remove('hidden');
                    document.getElementById('app-layout').classList.add('hidden');
                }
            } else {
                console.log("Monitor: Sin sesión activa.");
                window.currentUserData = null;
                document.getElementById('app-layout').classList.add('hidden');
                document.getElementById('auth-screen').classList.remove('hidden');
            }
        } catch (err) {
            console.error("Error crítico en monitor de sesión:", err);
            msg("⛔ Error técnico al validar acceso. Intente de nuevo.", "err");
        }
    });
};
