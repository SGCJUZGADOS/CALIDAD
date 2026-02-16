// ==========================================
// FIREBASE CONFIGURATION & INIT
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBJcHbcZbPibHlZ_bKtA821szfw-SsA2Sk",
    authDomain: "sgc-envigado.firebaseapp.com",
    projectId: "sgc-envigado",
    storageBucket: "sgc-envigado.firebasestorage.app",
    messagingSenderId: "1038721703997",
    appId: "1:1038721703997:web:e70dab39b1dea4c0124a54"
};

let db = null;
let auth = null;
let currentUser = {}; // Master User object
// DEFAULT MODULE
let currentCollection = "tutelas";

// LISTA MAESTRA DE JUZGADOS ENVIGADO (Fuente de Verdad - Actualizada)
const initialJuzgadosData = [
    // CIVILES MUNICIPALES
    { name: "Juzgado Primero Civil Municipal de Envigado", user: "juz01cmpl" },
    { name: "Juzgado Segundo Civil Municipal de Envigado", user: "juz02cmpl" },
    { name: "Juzgado Tercero Civil Municipal de Envigado", user: "juz03cmpl" },
    { name: "Juzgado Cuarto Civil Municipal de Envigado", user: "juz04cmpl" },
    { name: "Juzgado Quinto Civil Municipal de Envigado", user: "juz05cmpl" }, // (Si existe)

    // CIVILES CIRCUITO
    { name: "Juzgado Primero Civil del Circuito de Envigado", user: "juz01ccto" },
    { name: "Juzgado Segundo Civil del Circuito de Envigado", user: "juz02ccto" },
    { name: "Juzgado Tercero Civil del Circuito de Envigado", user: "juz03ccto" },

    // FAMILIA
    { name: "Juzgado Primero de Familia de Envigado", user: "juz01fam" },
    { name: "Juzgado Segundo de Familia de Envigado", user: "juz02fam" },
    { name: "Juzgado Tercero de Familia de Envigado", user: "juz03fam" },

    // PENALES MUNICIPALES
    { name: "Juzgado Primero Penal Municipal de Envigado", user: "juz01pm" },
    { name: "Juzgado Segundo Penal Municipal de Envigado", user: "juz02pm" },
    { name: "Juzgado Tercero Penal Municipal de Envigado", user: "juz03pm" },
    { name: "Juzgado Cuarto Penal Municipal de Envigado", user: "juz04pm" },

    // PENALES CIRCUITO
    { name: "Juzgado Primero Penal del Circuito de Envigado", user: "juz01pcto" },
    { name: "Juzgado Segundo Penal del Circuito de Envigado", user: "juz02pcto" },
    { name: "Juzgado Tercero Penal del Circuito de Envigado", user: "juz03pcto" },

    // PEQUEÑAS CAUSAS
    { name: "Juzgado Primero de Pequeñas Causas y Competencias Múltiples de Envigado", user: "juz01pccm" },
    { name: "Juzgado Segundo de Pequeñas Causas y Competencias Múltiples de Envigado", user: "juz02pccm" },

    // LABORALES
    { name: "Juzgado Primero Laboral del Circuito de Envigado", user: "juz01lab" },
    { name: "Juzgado Segundo Laboral del Circuito de Envigado", user: "juz02lab" },

    // PROMISCUOS
    { name: "Juzgado Promiscuo Municipal de Envigado", user: "juz01prm" }
];

// MODULE SWITCHING LOGIC
window.switchModule = function (moduleName) {
    // 1. UPDATE SIDEBAR ACTIVE STATE
    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));

    // --- AUTO-EXPAND SIDEBAR ON CLICK ---
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (sidebar) {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('open');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }

    // 2. TOGGLE VIEW CONTAINERS & UPDATE HEADER STYLE
    const mainContainer = document.getElementById('main-dash-container');
    const statsContainer = document.getElementById('statistics-section');
    const dashHeader = document.querySelector('.dash-header');
    const headerTitle = document.querySelector('.dash-header h2');
    const pdfBanner = document.getElementById('pdfImportContainer');
    const formEl = document.getElementById('terminosForm');

    // Reset Header & Banner Classes
    if (dashHeader) dashHeader.classList.remove('header-tutelas', 'header-demandas');
    if (pdfBanner) pdfBanner.classList.remove('pdf-banner-tutelas', 'pdf-banner-demandas');
    // Reset Form Theme
    if (formEl) formEl.classList.remove('theme-tutelas', 'theme-demandas');

    // Button & Badge Selectors
    const submitBtn = formEl ? formEl.querySelector('button[type="submit"]') : null;
    const badgeEl = document.getElementById('totalCount');
    if (badgeEl) badgeEl.classList.remove('total-badge-tutelas', 'total-badge-demandas');

    // Hide ALL containers first
    if (mainContainer) mainContainer.style.display = 'none';
    if (statsContainer) statsContainer.style.display = 'none';
    const matrixContainer = document.getElementById('estadisticas-tutelas-section');
    if (matrixContainer) matrixContainer.style.display = 'none';

    const usersContainer = document.getElementById('user-management-section');
    if (usersContainer) usersContainer.style.display = 'none';

    if (moduleName === 'users') {
        const navItem = document.getElementById('sidebarBtnUsers');
        if (navItem) navItem.classList.add('active');

        if (headerTitle) headerTitle.innerHTML = '<i class="fas fa-users-cog"></i> GESTIÓN DE USUARIOS';

        if (usersContainer) {
            usersContainer.style.display = 'block';
            if (typeof window.renderUserList === 'function') {
                window.renderUserList();
            }
        }
        return;
    }

    if (moduleName === 'estadisticas') {
        const navEst = document.getElementById('nav-estadisticas');
        if (navEst) navEst.classList.add('active');
        if (headerTitle) headerTitle.innerHTML = '<i class="fas fa-chart-pie"></i> ESTADÍSTICAS DE GESTIÓN';

        if (statsContainer) statsContainer.style.display = 'block';
        if (typeof window.updateStatistics === 'function') window.updateStatistics();
        return;
    }

    if (moduleName === 'estadisticas_tutelas') {
        const navItem = document.getElementById('nav-estadisticas-tutelas');
        if (navItem) navItem.classList.add('active');

        if (headerTitle) headerTitle.innerHTML = '<i class="fas fa-table"></i> MATRIZ - ENTRADA TUTELAS';

        const matrixContainer = document.getElementById('estadisticas-tutelas-section');
        if (matrixContainer) {
            matrixContainer.style.display = 'block';
            if (typeof window.updateMatrixStatistics === 'function') {
                window.updateMatrixStatistics();
            }
        }
        return;
    }

    // STANDARD MODULES (TUTELAS / DEMANDAS)
    if (mainContainer) mainContainer.style.display = 'grid'; // Restore grid layout

    if (moduleName === 'tutelas') {
        const navTut = document.getElementById('nav-tutelas');
        if (navTut) navTut.classList.add('active');
        if (headerTitle) {
            headerTitle.innerHTML = '<i class="fas fa-balance-scale"></i> SEGUIMIENTO A TÉRMINOS TUTELAS';
            headerTitle.style.color = '#004884'; // Blue text
        }
        if (dashHeader) dashHeader.classList.add('header-tutelas'); // Apply Blue Border/Shadow
        if (pdfBanner) pdfBanner.classList.add('pdf-banner-tutelas');
        if (formEl) formEl.classList.add('theme-tutelas');

        // Button & Badge
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Guardar Tutela';
            submitBtn.classList.remove('btn-success');
            submitBtn.classList.add('btn-primary');
        }
        if (badgeEl) badgeEl.classList.add('total-badge-tutelas');

    } else if (moduleName === 'demandas') {
        const navDem = document.getElementById('nav-demandas');
        if (navDem) navDem.classList.add('active');
        if (headerTitle) {
            headerTitle.innerHTML = '<i class="fas fa-gavel"></i> SEGUIMIENTO A TÉRMINOS DEMANDAS';
            headerTitle.style.color = '#28a745'; // Green text
        }
        if (dashHeader) dashHeader.classList.add('header-demandas'); // Apply Green Border/Shadow
        if (pdfBanner) pdfBanner.classList.add('pdf-banner-demandas');
        if (formEl) formEl.classList.add('theme-demandas');

        // Button & Badge
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Guardar Demanda';
            submitBtn.classList.remove('btn-primary');
            submitBtn.classList.add('btn-success');
        }
        if (badgeEl) badgeEl.classList.add('total-badge-demandas');
    }

    currentCollection = moduleName;

    // --- ROLE-BASED VISIBILITY FOR RADICADOR ---
    const divJuzgadoDestino = document.getElementById('divJuzgadoDestino');
    const role = (currentUser.role || '').toLowerCase();
    const isRadicador = role.startsWith('radicador');

    // --- VISIBILIDAD FILTRO DESPACHO (Se oculta para Juzgados) ---
    const filterJuzContainer = document.getElementById('group-filter-juzgado');
    if (filterJuzContainer) {
        const canViewFilter = role === 'admin' || isRadicador;
        filterJuzContainer.style.display = canViewFilter ? 'block' : 'none';
    }

    if (isRadicador && (moduleName === 'tutelas' || moduleName === 'demandas')) {
        if (divJuzgadoDestino) {
            divJuzgadoDestino.style.display = 'block';
            const selectJ = divJuzgadoDestino.querySelector('select');
            if (selectJ) selectJ.setAttribute('required', 'true');
        }
        // Hide non-essential fields for Radicador
        const groupsToHide = ['group-fechaFallo', 'group-diaSiete', 'group-diaDiez', 'group-asignadoA', 'group-derecho', 'group-decision', 'group-genero', 'group-impugno'];
        groupsToHide.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // Show grid spacer to keep alignment
        const spacer = document.querySelector('.radicador-only-spacer');
        if (spacer) spacer.style.display = 'block';

        // Only show PDF banner for Tutelas or Demandas if requested
        if (pdfBanner && (moduleName === 'tutelas' || moduleName === 'demandas')) {
            pdfBanner.style.display = 'block';
        } else if (pdfBanner) {
            pdfBanner.style.display = 'none';
        }
    } else {
        if (divJuzgadoDestino) {
            divJuzgadoDestino.style.display = 'none';
            const selectJ = divJuzgadoDestino.querySelector('select');
            if (selectJ) selectJ.removeAttribute('required');
        }
        if (pdfBanner) pdfBanner.style.display = 'none';

        // Show fields for other roles
        const groupsToShow = ['group-fechaFallo', 'group-diaSiete', 'group-diaDiez', 'group-asignadoA', 'group-derecho', 'group-decision', 'group-genero', 'group-impugno'];
        groupsToShow.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'block';
        });

        const spacer = document.querySelector('.radicador-only-spacer');
        if (spacer) spacer.style.display = 'none';
    }

    // Update role class on module switch just in case
    if (isRadicador) {
        document.body.classList.add('role-radicador');
    } else {
        document.body.classList.remove('role-radicador');
    }

    // Reset Form & Table State
    if (typeof resetForm === 'function') resetForm();
    globalTerminos = []; // Clear local cache
    if (typeof renderRealtimeTable === 'function') renderRealtimeTable([]); // clear view immediately

    console.log("Switched to module:", currentCollection);

    // Restart Listener for new collection
    if (typeof setupRealtimeUpdates === 'function') {
        setupRealtimeUpdates();
    }
}

// ==========================================
// STATISTICS LOGIC (CHART.JS)
// ==========================================
let myChart = null;

window.updateStatistics = function () {
    const fechaInicio = document.getElementById('statFilterFechaInicio').value || "2020-01-01"; // Default to 2020 if empty
    const fechaFin = document.getElementById('statFilterFechaFin').value || "2030-12-31"; // Default far future

    // POPULATE SELECT IF EMPTY
    const statSelect = document.getElementById('statFilterJuzgado');
    if (statSelect && statSelect.options.length <= 1 && typeof initialJuzgadosData !== 'undefined') {
        initialJuzgadosData.forEach(j => {
            const opt = document.createElement('option');
            opt.value = j.name;
            opt.textContent = j.name;
            statSelect.appendChild(opt);
        });
    }

    const juzgadoFilter = document.getElementById('statFilterJuzgado').value;

    // Visibility Toggles
    const showTutelas = document.getElementById('checkShowTutelas').checked;
    const showDemandas = document.getElementById('checkShowDemandas').checked;

    console.log("Generando estadísticas (Dual)...");

    // Fetch BOTH collections
    const pTutelas = db.collection("tutelas").get();
    const pDemandas = db.collection("demandas").get();

    Promise.all([pTutelas, pDemandas]).then((snapshots) => {
        const tutelasSnap = snapshots[0];
        const demandasSnap = snapshots[1];

        // Helper to filter and count
        const countFiltered = (snapshot) => {
            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                const juzgado = data.juzgadoDestino || data.juzgadoOwner || data.juzgado || "Sin Asignar";
                const fecha = data.fechaReparto;

                // Date Filter
                if (fechaInicio) { if (!fecha || fecha < fechaInicio) return; }
                if (fechaFin) { if (!fecha || fecha > fechaFin) return; }

                // Juzgado Filter
                if (juzgadoFilter && juzgado !== juzgadoFilter) return;

                count++;
            });
            return count;
        };

        const totalTutelas = countFiltered(tutelasSnap);
        const totalDemandas = countFiltered(demandasSnap);

        // Update Banner Text
        const bannerName = document.getElementById('statsJuzgadoName');
        const elTutelas = document.getElementById('statsTutelasCount');
        const elDemandas = document.getElementById('statsDemandasCount');

        if (elTutelas) elTutelas.textContent = totalTutelas;
        if (elDemandas) elDemandas.textContent = totalDemandas;

        if (bannerName) {
            bannerName.textContent = juzgadoFilter ? juzgadoFilter : "TODOS LOS JUZGADOS";
        }

        renderChart(totalTutelas, totalDemandas, showTutelas, showDemandas);

    }).catch((error) => {
        console.error("Error loading stats:", error);
    });
}

function renderChart(countTutelas, countDemandas, showTutelas, showDemandas) {
    const ctx = document.getElementById('juzgadosChart').getContext('2d');

    // Config Data based on Toggles
    const labels = [];
    const dataValues = [];
    const bgColors = [];
    const borderColors = [];

    if (showTutelas) {
        labels.push('Tutelas');
        dataValues.push(countTutelas);
        bgColors.push('#004884'); // Blue
        borderColors.push('#ffffff');
    }

    if (showDemandas) {
        labels.push('Demandas');
        dataValues.push(countDemandas);
        bgColors.push('#28a745'); // Green
        borderColors.push('#ffffff');
    }

    // Chart Title Logic
    let titleText = 'Volumen de Gestión';
    if (showTutelas && showDemandas) titleText = 'Comparativo: Tutelas vs Demandas';
    else if (showTutelas) titleText = 'Volumen de Tutelas';
    else if (showDemandas) titleText = 'Volumen de Demandas';
    else titleText = 'Sin Datos Seleccionados';


    // Destroy previous chart if exists
    if (myChart) {
        myChart.destroy();
    }

    // Custom Plugin to Draw Text Inside Doughnut
    const doughnutLabel = {
        id: 'doughnutLabel',
        afterDatasetsDraw(chart, args, pluginOptions) {
            const { ctx, data } = chart;
            chart.data.datasets.forEach((dataset, i) => {
                chart.getDatasetMeta(i).data.forEach((datapoint, index) => {
                    const { x, y } = datapoint.tooltipPosition();

                    // Get Value
                    const value = dataset.data[index];
                    if (value > 0) { // Only draw if > 0
                        ctx.save();
                        ctx.font = 'bold 16px "Segoe UI", sans-serif';
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(value, x, y);
                        ctx.restore();
                    }
                });
            });
        }
    };

    myChart = new Chart(ctx, {
        type: 'doughnut', // Modern Doughnut Style
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad',
                data: dataValues,
                backgroundColor: bgColors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 20, // Pop out effect
                borderRadius: 5, // Rounded edges on segments
                offset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%', // Thicker ring
            layout: {
                padding: 20
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14,
                            family: "'Segoe UI', sans-serif",
                            weight: 'bold'
                        },
                        usePointStyle: true,
                        padding: 20,
                        color: '#666'
                    }
                },
                title: {
                    display: true,
                    text: titleText,
                    font: {
                        size: 18,
                        weight: 'bold',
                        family: "'Segoe UI', sans-serif"
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    },
                    color: '#333'
                },
                tooltip: {
                    backgroundColor: 'rgba(50, 50, 50, 0.9)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 14 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        },
        plugins: [doughnutLabel] // Register Plugin
    });
}

// Initialize Firebase SAFE MODE
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        console.log("Firebase initialized successfully");
    } else {
        console.error("Firebase SDK not loaded");
        // alert("Error: No se pudo conectar a la Nube (Faltan librerías). Se usará modo local limitado.");
    }
} catch (error) {
    console.error("Firebase Init Error:", error);
}

// (Duplicado eliminado - Versión maestra al inicio)

// AUTO-REPAIR USERS ON STARTUP
window.ensureUsersExist = function () {
    console.log("Verifying User Integrity...");
    const admins = ['admin', 'radicador', 'radicador1'];

    // 1. Ensure Admins
    admins.forEach(adm => {
        let role = 'user';
        let jName = 'Usuario';
        if (adm === 'admin') { role = 'admin'; jName = 'Administrador'; }
        else { role = 'radicador'; jName = 'Oficina de Reparto'; }

        const userRef = db.collection("users").doc(adm);

        userRef.get().then((doc) => {
            if (!doc.exists) {
                // Create new if not exists
                userRef.set({
                    username: adm,
                    password: '123', // Default only for new
                    role: role,
                    juzgado: jName,
                    email: "" // Initialize email field for new users
                });
            } else {
                // Determine what to update (ONLY critical metadata, NOT password)
                // We use merge:true to be safe. We REMOVED the email: "" line that was erasing data.
                userRef.set({
                    role: role, // Enforce role correctness
                    juzgado: jName
                    // NO email reset here
                }, { merge: true });
            }
        });
    });

    // 2. Ensure ALL Juzgados from Master List exist
    if (typeof initialJuzgadosData !== 'undefined') {
        initialJuzgadosData.forEach(juz => {
            const userRef = db.collection("users").doc(juz.user);

            userRef.get().then((doc) => {
                if (!doc.exists) {
                    const userData = {
                        username: juz.user,
                        password: '123',
                        juzgado: juz.name,
                        email: "", // Initial empty email
                        role: 'user'
                    };
                    if (juz.code) userData.code = juz.code;
                    userRef.set(userData);
                } else {
                    // Update only non-destructive fields
                    const updateData = {
                        juzgado: juz.name,
                        role: 'user'
                    };
                    if (juz.code) updateData.code = juz.code;
                    userRef.set(updateData, { merge: true });
                }
            });
        });
        console.log("User Integrity Check Completed: Metadata Synced.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize UI FIRST
    initUI();

    // 3. CHECK SESSION
    try {
        const savedUser = localStorage.getItem('sgc_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);

            // AUTO-CORRECT JUZGADO NAME ON RESTORE
            if (typeof initialJuzgadosData !== 'undefined') {
                const masterEntry = initialJuzgadosData.find(j => j.user === currentUser.username);
                if (masterEntry && currentUser.juzgado !== masterEntry.name) {
                    console.log("Auto-correcting Juzgado Name on Restore for:", currentUser.username);
                    currentUser.juzgado = masterEntry.name;
                    localStorage.setItem('sgc_user', JSON.stringify(currentUser));
                }
            }

            // Patch for old sessions
            if (!currentUser.role) currentUser.role = 'user';

            console.log("Sesión restaurada desde LocalStorage:", currentUser.username);

            try {
                // UNIFIED ENTRY POINT
                if (typeof enterDashboard === 'function') {
                    enterDashboard();
                } else {
                    console.error("enterDashboard function not found!");
                }
            } catch (e) {
                console.error("DEBUG: enterDashboard crashed:", e);
            }
        }
    } catch (e) {
        console.error("Error restaurando sesión", e);
        localStorage.removeItem('sgc_user');
    }

    // 2. Initialize Data Listeners (Moved AFTER session check to avoid race condition)
    if (db) {
        setupRealtimeUpdates();
        if (typeof window.ensureUsersExist === 'function') window.ensureUsersExist();
    }

    // SEGUIMIENTO DE CAMBIO EN FILTRO DE JUZGADO (TABLA)
    const filterJuzgadoEl = document.getElementById('filterJuzgadoTabla');
    if (filterJuzgadoEl) {
        filterJuzgadoEl.addEventListener('change', () => {
            filterAndRender(); // Re-render immediately on change
        });
    }

    // CARGAR SELECTS DE JUZGADOS (Formulario Radicación y Filtro Tabla)
    if (typeof window.loadJuzgadosIntoSelect === 'function') {
        window.loadJuzgadosIntoSelect();
    }
});

// SEED TEST DATA (TEMPORARY)
function seedTestUsers() {
    const users = [
        { id: 'radicador1', data: { username: 'radicador1', password: '123', role: 'radicador', juzgado: 'Oficina Reparto' } },
        { id: 'juzgado01', data: { username: 'juzgado01', password: '123', role: 'user', juzgado: 'Juzgado 01 Civil' } },
        { id: 'juzgado02', data: { username: 'juzgado02', password: '123', role: 'user', juzgado: 'Juzgado 02 Penal' } }
    ];

    users.forEach(u => {
        // ALWAYS update/set to ensure roles are correct (Fixes "wrong role" bug)
        db.collection('users').doc(u.id).set(u.data, { merge: true })
            .then(() => console.log(`Usuario verificado/actualizado: ${u.id}`))
            .catch(e => console.error(e));
    });
}

function initUI() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                // Close mobile menu if open
                const navLinks = document.querySelector('.nav-links');
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Sidebar Toggle Function
    window.toggleSidebar = function () {
        const sidebar = document.querySelector('.dashboard-sidebar');
        if (sidebar) {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        }
    }

    // Scroll Animations (Fade In)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Animates only once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-section').forEach(section => {
        observer.observe(section);
    });

    // Visitor Counter Logic (Simulated for Demo)
    const counterElement = document.getElementById('counter-value');
    if (counterElement) {
        // Retrieve existing count or start from a base number to look impressive
        let visits = localStorage.getItem('siteVisits');

        // Base number + random increments to simulate traffic if it's the first time for this user
        if (!visits) {
            visits = 12540; // Starting fake number
        } else {
            visits = parseInt(visits) + 1; // Increment on each load
        }

        localStorage.setItem('siteVisits', visits);

        // Animate counter
        const targetCount = visits;
        let p = 0;
        const duration = 2000; // 2 seconds
        const startTimestamp = performance.now();

        function step(timestamp) {
            if (!p) p = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Logarithmic-like easing or just simple progress
            const currentCount = Math.floor(progress * (targetCount - (targetCount - 100)) + (targetCount - 100));

            // Just show the final number nicely formatted if animation is too complex for simple text
            // Simple approach:
            if (progress < 1) {
                counterElement.innerText = Math.floor(targetCount * progress).toLocaleString();
                window.requestAnimationFrame(step);
            } else {
                counterElement.innerText = targetCount.toLocaleString();
            }
        };
        window.requestAnimationFrame(step);
    }

    console.log("Sistema de Gestión de Calidad - Loaded");
}

// Modal Logic
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const captionText = document.getElementById("caption");
const span = document.getElementsByClassName("close-modal")[0];

// Function to open modal (callable from HTML)
window.openModal = function (imageSrc, caption) {
    modal.style.display = "block";
    modalImg.src = imageSrc;
    if (caption) {
        captionText.innerHTML = caption;
    } else {
        captionText.innerHTML = "";
    }
}

// Video Modal Logic
// Video Modal Logic
// (No global constants here to avoid init issues if elements are missing)
// Video functions removed to fix console errors



// Login & Dashboard Logic
const loginModal = document.getElementById("loginModal");
const dashboard = document.getElementById("dashboard"); // Re-declaring safe


window.openLoginModal = function () {
    loginModal.style.display = "block";
}

window.closeLoginModal = function () {
    loginModal.style.display = "none";
}

window.handleLogin = function (e) {
    e.preventDefault();
    const user = document.getElementById("username").value.toLowerCase().trim();
    const pass = document.getElementById("password").value;

    const loginModal = document.getElementById("loginModal");
    const dashboard = document.getElementById("dashboard");

    // 1. CHECK FIRESTORE USERS
    db.collection("users").doc(user).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            if (userData.password === pass) {
                // SUCCESS
                currentUser = userData;
                // Patch role if missing (legacy)
                if (!currentUser.role) currentUser.role = 'user';

                // AUTO-CORRECT JUZGADO NAME FROM MASTER LIST
                // This ensures old users get updated names to match Radicador assignment
                if (typeof initialJuzgadosData !== 'undefined') {
                    const masterEntry = initialJuzgadosData.find(j => j.user === currentUser.username);
                    if (masterEntry) {
                        console.log("Auto-correcting Juzgado Name for:", currentUser.username);
                        currentUser.juzgado = masterEntry.name; // FORCE UPDATE
                        // We also update Firestore in background to make it permanent
                        db.collection("users").doc(currentUser.username).update({ juzgado: masterEntry.name })
                            .catch(e => console.warn("Background update failed", e));
                    }
                }

                localStorage.setItem('sgc_user', JSON.stringify(currentUser));

                alert(`Bienvenido, ${currentUser.username} (${currentUser.role})`);
                document.getElementById("loginForm").reset();
                // Call unified dashboard entry
                enterDashboard();
                return;
            } else {
                alert("⛔ Contraseña incorrecta.");
            }
        } else {
            // 2. FALLBACK: HARDCODED ADMIN (Si no existe en DB aún)
            if (user === "admin" && pass === "123") {
                currentUser = { username: 'admin', role: 'admin', juzgado: 'Administrador' };
                localStorage.setItem('sgc_user', JSON.stringify(currentUser));

                alert("Bienvenido, Admin (Modo Local).");
                document.getElementById("loginForm").reset();
                // Call unified dashboard entry
                enterDashboard();
            } else {
                alert("⛔ Usuario no encontrado.");
            }
        }
    }).catch((error) => {
        console.error("Login Error:", error);
        alert("Error de conexión: " + error.message);
    });
}

// ==========================================
// UNIFIED DASHBOARD ENTRY
// ==========================================
window.enterDashboard = function () {
    const loginModal = document.getElementById("loginModal");
    const dashboard = document.getElementById("dashboard");
    const welcomeMsg = document.getElementById("welcomeMsg");
    const sidebarBtnUsers = document.getElementById("sidebarBtnUsers");

    if (loginModal) loginModal.style.display = "none";
    if (dashboard) dashboard.style.display = "flex";

    if (welcomeMsg && currentUser) {
        welcomeMsg.innerHTML = `<i class="fas fa-user-circle"></i> Hola, ${currentUser.username || 'Funcionario'}`;
    }

    // --- NEW: CSS ROLE CLASS FOR TARGETING ---
    const role = (currentUser.role || '').toLowerCase().trim();
    console.log("Dashboard Entry - Detected Role:", role);

    if (role.startsWith('radicador')) {
        document.body.classList.add('role-radicador');
    } else {
        document.body.classList.remove('role-radicador');
    }

    // Role-based Sidebar visibility
    if (sidebarBtnUsers) {
        if (currentUser.role === 'admin') {
            sidebarBtnUsers.style.display = 'block';
        } else {
            sidebarBtnUsers.style.display = 'none';
        }
    }

    // Default view: Tutelas
    if (typeof window.switchModule === 'function') {
        window.switchModule('tutelas');
    }
}

window.logout = function () {
    if (confirm("¿Seguro que desea cerrar sesión?")) {
        dashboard.style.display = "none";
        localStorage.removeItem('sgc_user'); // CLEAR SESSION
        currentUser = {};
        window.location.reload(); // Clean state
    }
}

// Global variable to store ID being edited (null if new)
let currentEditId = null;

// Dashboard Form Logic (Create / Update in Firestore)
window.handleFormSubmit = function (e) {
    e.preventDefault();

    // GET BUTTON & DISABLE IT
    const submitBtn = document.querySelector('#terminosForm button[type="submit"]');

    // Safety check for Firebase
    if (!db) {
        alert("⚠️ Error: El sistema no ha conectado con la base de datos (Firebase). Por favor, recargue la página.");
        return;
    }

    const originalBtnText = currentEditId ? '<i class="fas fa-save"></i> ACTUALIZAR REGISTRO (EDICIÓN)' : (currentCollection === 'tutelas' ? '<i class="fas fa-plus"></i> Guardar Tutela' : '<i class="fas fa-plus"></i> Guardar Demanda');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        // SAFETY TIMEOUT: If it takes too long (e.g. 15s), re-enable
        setTimeout(() => {
            if (submitBtn.disabled && submitBtn.innerHTML.includes("Guardando")) {
                alert("⚠️ La operación está tardando demasiado. Verifica tu conexión.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }, 15000);
    }

    // Get values
    const radicadoResto = document.getElementById('radicadoResto').value;
    const radicadoFull = radicadoResto;

    // VALIDACIÓN RADICADOR EXTRICTA
    const userRoleRaw = (currentUser && currentUser.role) ? currentUser.role : "";
    if (userRoleRaw.startsWith('radicador')) {
        if (radicadoResto.length !== 23) {
            alert("⚠️ EL RADICADO DEBE TENER EXACTAMENTE 23 DÍGITOS.\n\n" +
                "Actualmente tiene " + radicadoResto.length + " dígitos.");
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        if (!document.getElementById('juzgadoDestino').value) {
            alert("⚠️ Debe seleccionar un JUZGADO DESTINO.");
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        // Validation for IDs (REMOVED: Optional now)
        /*
        const idAcc = document.getElementById('idAccionante').value;
        const idDmd = document.getElementById('idAccionado').value;
        if (!idAcc || !idDmd) {
            alert("⚠️ ES OBLIGATORIO ingresar los Cédulas/NIT de Accionante y Demandado.");
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        */
    }

    const accionante = document.getElementById('accionante').value.toUpperCase();
    const idAccionante = document.getElementById('idAccionante').value;
    const accionado = document.getElementById('accionado').value.toUpperCase();
    const idAccionado = document.getElementById('idAccionado').value;
    const fechaReparto = document.getElementById('fechaReparto').value;
    const fechaNotificacion = document.getElementById('fechaNotificacion').value;

    // NEW FIELDS
    // NEW FIELDS
    const asignadoA = document.getElementById('asignadoA').value;
    const derecho = document.getElementById('derecho').value;
    // Removed outdated 'Otro' logic for droit
    const ingreso = document.getElementById('ingreso').value;
    const decision = document.getElementById('decision').value;
    const genero = document.getElementById('genero').value;
    const impugno = document.getElementById('impugno').value;
    const observaciones = document.getElementById('observaciones').value;

    // VALIDACIÓN MANUAL DE DERECHO PARA NO-RADICADORES
    if (!userRoleRaw.startsWith('radicador') && currentCollection === 'tutelas' && !derecho) {
        alert("⚠️ El 'Derecho Vulnerado' es obligatorio para juzgados.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
        return;
    }

    console.log("Data gathered:", { radicadoFull, accionante, accionado, fechaReparto, derecho, ingreso });

    // Recalculate days
    const diaSiete = addBusinessDays(fechaReparto, 7);
    const diaDiez = addBusinessDays(fechaReparto, 10);

    // Lógica de Alerta y Cumplimiento
    let alertaStatus = "Verde";
    let cumplioTermino = "-";
    const today = new Date().toISOString().split('T')[0];

    if (!fechaNotificacion) {
        // SAFEGUARD: Only compare if diaDiez is a valid string
        if (diaDiez && today > diaDiez) {
            alertaStatus = "Rojo";
        } else if (diaSiete && today >= diaSiete) {
            alertaStatus = "Amarillo";
        }
        cumplioTermino = "PENDIENTE";
    } else {
        // Also safeguard here just in case
        if (diaDiez && fechaNotificacion <= diaDiez) {
            cumplioTermino = "SÍ";
            alertaStatus = "Verde";
        } else {
            cumplioTermino = "NO";
            alertaStatus = "Rojo";
        }
    }

    // Verificación de Duplicados CRUZADA (Tutelas Y Demandas)
    console.log("🔍 Verificando duplicados para:", radicadoFull, "ID Edición:", currentEditId);

    const checkTutelas = db.collection("tutelas").where("radicado", "==", radicadoFull).get();
    const checkDemandas = db.collection("demandas").where("radicado", "==", radicadoFull).get();

    Promise.all([checkTutelas, checkDemandas])
        .then(([snapTutelas, snapDemandas]) => {
            let esDuplicado = false;
            let origenDuplicado = "";

            snapTutelas.forEach((doc) => {
                if (doc.id !== currentEditId) {
                    esDuplicado = true;
                    origenDuplicado = "TUTELAS";
                }
            });

            if (!esDuplicado) {
                snapDemandas.forEach((doc) => {
                    if (doc.id !== currentEditId) {
                        esDuplicado = true;
                        origenDuplicado = "DEMANDAS";
                    }
                });
            }

            if (esDuplicado) {
                console.warn("❌ Duplicado detectado en:", origenDuplicado);
                alert(`⚠️ ERROR: El radicado ${radicadoFull} YA EXISTE en el módulo de ${origenDuplicado}.\nNo se puede crear duplicado.`);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
                return;
            }

            console.log("✅ No hay duplicados. Procediendo a guardar...");

            // Determine Juzgado Owner
            let juzgadoOwner = (currentUser && currentUser.juzgado) ? currentUser.juzgado : "";
            if (!juzgadoOwner && currentUser && currentUser.username && typeof initialJuzgadosData !== 'undefined') {
                const found = initialJuzgadosData.find(u => u.user === currentUser.username);
                if (found) {
                    juzgadoOwner = found.name;
                    currentUser.juzgado = found.name;
                }
            }
            if (!juzgadoOwner) juzgadoOwner = "Juzgado Desconocido";

            const userRole = (currentUser && currentUser.role) ? currentUser.role : "";
            if (userRole === 'admin' || userRole.startsWith('radicador')) {
                const jDestinoEl = document.getElementById('juzgadoDestino');
                juzgadoOwner = jDestinoEl ? jDestinoEl.value : juzgadoOwner;
                if (!juzgadoOwner) {
                    alert("⚠️ DEBE asignar un Juzgado destino.");
                    if (submitBtn) submitBtn.disabled = false;
                    return;
                }
            }

            const entryData = {
                radicado: radicadoFull || "",
                radicadoResto: radicadoResto || "",
                accionante: accionante || "",
                idAccionante: idAccionante || "",
                accionado: accionado || "",
                idAccionado: idAccionado || "",
                fechaReparto: fechaReparto || "",
                fechaNotificacion: fechaNotificacion || "",
                diaSiete: diaSiete || "",
                diaDiez: diaDiez || "",
                alerta: alertaStatus || "Verde",
                cumplio: cumplioTermino || "PENDIENTE",
                asignadoA: asignadoA || "",
                derecho: derecho || "",
                decision: decision || "",
                genero: genero || "",
                impugno: impugno || "",
                observaciones: observaciones || "",
                ingreso: ingreso || "",
                juzgado: (juzgadoOwner || "Juzgado Desconocido").trim(),
                createdByRole: (currentUser && currentUser.role) ? currentUser.role : "user",
                emailSent: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (currentEditId) {
                console.log("📝 Actualizando documento:", currentEditId, "en colección:", currentCollection);
                const idToUpdate = currentEditId;
                const docRef = db.collection(currentCollection).doc(idToUpdate);

                docRef.get().then(snap => {
                    if (snap.exists) {
                        const oldData = snap.data();
                        db.collection("audit_logs").add({
                            entityId: idToUpdate,
                            entityCollection: currentCollection,
                            previousData: oldData,
                            radicado: oldData.radicado || "N/A",
                            modifiedBy: currentUser.username || "Desconocido",
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            action: 'UPDATE'
                        }).catch(e => console.log("Audit Log (info):", e));
                    }
                    return docRef.update(entryData);
                }).then(() => {
                    console.log("✨ Actualización exitosa en Firebase.");
                    alert("✅ Registro actualizado correctamente.");
                    resetForm();
                }).catch((error) => {
                    console.error("🔥 Error en Firebase update:", error);
                    alert("Error al actualizar: " + error.message);
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                    }
                });
            } else {
                console.log("🆕 Creando nuevo documento en colección:", currentCollection);
                db.collection(currentCollection).add(entryData)
                    .then(() => {
                        console.log("✨ Creación exitosa en Firebase.");
                        alert("✅ Registro guardado exitosamente.");
                        resetForm();
                    })
                    .catch((error) => {
                        console.error("🔥 Error en Firebase add:", error);
                        alert("Error al guardar: " + error.message);
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalBtnText;
                        }
                    });
            }

        }).catch((error) => {
            console.error("🔥 Error verificando duplicados:", error);
            alert("Error de conexión verificando radicado.");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
}


currentEditId = null;
// function resetForm() updated to clear ingreso
window.resetForm = function () {
    console.log("Reseteando formulario...");
    currentEditId = null;

    const form = document.getElementById('terminosForm');
    if (form) form.reset();

    // RESTORE FECHA REPARTO FOR RADICADOR
    if (typeof currentUser !== 'undefined' && currentUser.role && currentUser.role.startsWith('radicador')) {
        const today = new Date().toISOString().split('T')[0];
        const fReparto = document.getElementById('fechaReparto');
        if (fReparto) {
            fReparto.value = today;
            fReparto.setAttribute('readonly', 'true');
            fReparto.style.backgroundColor = "#e9ecef";
        }
    }

    // Restore Submit Button
    const btn = document.querySelector('#terminosForm button[type="submit"]');
    if (btn) {
        const isTutelas = currentCollection === 'tutelas';
        btn.innerHTML = isTutelas ? '<i class="fas fa-plus"></i> Guardar Tutela' : '<i class="fas fa-plus"></i> Guardar Demanda';
        btn.className = isTutelas ? "btn-primary" : "btn-success";
        btn.disabled = false;
        btn.style.width = "";
        btn.style.padding = "";
        btn.style.fontSize = "";
    }

    // Hide Edit-Mode Only Elements
    const indicator = document.getElementById('editModeIndicator');
    if (indicator) indicator.style.display = 'none';

    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';

    const histBtn = document.getElementById('btnHistory');
    if (histBtn) histBtn.style.display = 'none';

    // Clear calculated hidden fields if any (optional)
    const el7 = document.getElementById('diaSiete');
    const el10 = document.getElementById('diaDiez');
    if (el7) el7.value = "";
    if (el10) el10.value = "";

    // Trigger change to refresh calculations if necessary
    const fReparto = document.getElementById('fechaReparto');
    if (fReparto) fReparto.dispatchEvent(new Event('change'));
}

// MATRIX STATISTICS LOGIC
window.updateMatrixStatistics = function () {
    const tableBody = document.getElementById('matrixTableBody');
    const tableFoot = document.getElementById('matrixTableFoot');
    if (!tableBody || !tableFoot) return;

    tableBody.innerHTML = '';
    tableFoot.innerHTML = '';

    // Define Rows (Derechos) and Cols (Ingresos)
    const derechos = [
        "SALUD", "SEGURIDAD SOCIAL", "VIDA", "MÍNIMO VITAL",
        "IGUALDAD", "EDUCACIÓN", "DEBIDO PROCESO", "DERECHO DE PETICIÓN",
        "DERECHO A LA INFORMACIÓN PÚBLICA", "CONTRA PROVIDENCIAS JUDICIALES",
        "MEDIO AMBIENTE", "OTROS"
    ];

    const ingresos = [
        "Reparto",
        "Competencia",
        "Reingreso por Nulidad o por Competencia",
        "Entrada Impedimentos",
        "Otras Entradas no Efectivas"
    ];

    // Initialize Matrix 2D Array
    // matrix[derechoIndex][ingresoIndex] = count
    let matrix = Array(derechos.length).fill(0).map(() => Array(ingresos.length).fill(0));

    // Calculate Stats from globalTerminos (Tutelas Cache)
    // Ensure we are using Tutelas Data, or current view data
    // Assuming globalTerminos holds the currently loaded collection (tutelas on start)
    globalTerminos.forEach(item => {
        // Normalize item values
        const d = (item.derecho || "").toUpperCase();
        let i = (item.ingreso || "");

        // Find Indexes
        const dIndex = derechos.indexOf(d);
        const iIndex = ingresos.indexOf(i);

        if (dIndex !== -1 && iIndex !== -1) {
            matrix[dIndex][iIndex]++;
        }
    });

    // Render Body
    derechos.forEach((derecho, r) => {
        let rowHtml = `<tr><td style="border: 1px solid #ddd; padding: 5px; white-space: nowrap;">${derecho}</td>`;
        let rowTotal = 0;
        ingresos.forEach((ingreso, c) => {
            const count = matrix[r][c];
            rowTotal += count;
            rowHtml += `<td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${count || ((count === 0) ? '' : '')}</td>`; // Show number or empty
        });
        rowHtml += `<td style="border: 1px solid #ddd; padding: 5px; text-align: center; font-weight:bold; background:#e9ecef;">${rowTotal}</td></tr>`;
        tableBody.innerHTML += rowHtml;
    });

    // Render Footer (Column Totals)
    let footerHtml = `<tr><td style="border: 1px solid #ddd; padding: 5px; font-weight: bold;">TOTAL</td>`;
    let grandTotal = 0;

    ingresos.forEach((_, c) => {
        let colTotal = 0;
        derechos.forEach((_, r) => {
            colTotal += matrix[r][c];
        });
        grandTotal += colTotal;
        footerHtml += `<td style="border: 1px solid #ddd; padding: 5px; text-align: center; font-weight:bold;">${colTotal}</td>`;
    });
    footerHtml += `<td style="border: 1px solid #ddd; padding: 5px; text-align: center; background:#333; color:white;">${grandTotal}</td></tr>`;
    tableFoot.innerHTML = footerHtml;
}

window.exportMatrixToExcel = function () {
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // Headers
    const headers = ["TIPOS PROCESOS", "REPARTO", "COMPETENCIA", "REINGRESO POR NULIDAD/COMPETENCIA", "ENTRADA IMPEDIMENTOS", "OTRAS ENTRADAS NO EFECTIVAS", "TOTAL"];
    ws_data.push(headers);

    // Get Data from DOM for simplicity (or recalculate)
    // Recalculating is safer
    const derechos = [
        "SALUD", "SEGURIDAD SOCIAL", "VIDA", "MÍNIMO VITAL",
        "IGUALDAD", "EDUCACIÓN", "DEBIDO PROCESO", "DERECHO DE PETICIÓN",
        "DERECHO A LA INFORMACIÓN PÚBLICA", "CONTRA PROVIDENCIAS JUDICIALES",
        "MEDIO AMBIENTE", "OTROS"
    ];
    const ingresos = [
        "Reparto", "Competencia", "Reingreso por Nulidad o por Competencia",
        "Entrada Impedimentos", "Otras Entradas no Efectivas"
    ];

    let matrix = Array(derechos.length).fill(0).map(() => Array(ingresos.length).fill(0));
    globalTerminos.forEach(item => {
        const d = (item.derecho || "").toUpperCase();
        let i = (item.ingreso || "");
        const dIndex = derechos.indexOf(d);
        const iIndex = ingresos.indexOf(i);
        if (dIndex !== -1 && iIndex !== -1) matrix[dIndex][iIndex]++;
    });

    // Push Rows
    derechos.forEach((d, r) => {
        let row = [d];
        let rowTotal = 0;
        ingresos.forEach((_, c) => {
            row.push(matrix[r][c]);
            rowTotal += matrix[r][c];
        });
        row.push(rowTotal);
        ws_data.push(row);
    });

    // Push Footer
    let footer = ["TOTAL"];
    let grandTotal = 0;
    ingresos.forEach((_, c) => {
        let colTotal = 0;
        derechos.forEach((_, r) => colTotal += matrix[r][c]);
        footer.push(colTotal);
        grandTotal += colTotal;
    });
    footer.push(grandTotal);
    ws_data.push(footer);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Estadística Tutelas");
    XLSX.writeFile(wb, "Estadistica_Entrada_Tutelas.xlsx");
}

window.editTermino = function (id) {
    // Al editar, leemos el doc actual de la 'cache' o buscamos en lista local
    // Como tenemos listener, podemos buscar en el DOM o pedir a Firebase. 
    // Para simplificar, pediré a Firebase el documento fresco.
    db.collection(currentCollection).doc(id).get().then((doc) => {
        if (doc.exists) {
            const item = doc.data();

            // Logica simplificada: mostrar todo el radicado en el único campo
            document.getElementById('radicadoResto').value = item.radicado;
            document.getElementById('accionante').value = item.accionante;
            document.getElementById('accionado').value = item.accionado;
            document.getElementById('fechaReparto').value = item.fechaReparto || "";
            document.getElementById('fechaNotificacion').value = item.fechaNotificacion || "";

            // Populate New Fields
            document.getElementById('asignadoA').value = item.asignadoA || "";
            document.getElementById('ingreso').value = item.ingreso || "";
            document.getElementById('derecho').value = item.derecho || "";
            document.getElementById('decision').value = item.decision || "";
            document.getElementById('genero').value = item.genero || "NO";
            document.getElementById('impugno').value = item.impugno || "NO";

            // Populate New Fields (IDs & Obs)
            document.getElementById('idAccionante').value = item.idAccionante || "";
            document.getElementById('idAccionado').value = item.idAccionado || "";
            document.getElementById('observaciones').value = item.observaciones || "";

            // Trigger visual
            document.getElementById('fechaReparto').dispatchEvent(new Event('change'));

            currentEditId = id;

            // UI ACTUALIZACIÓN: MODO EDICIÓN VISTOSO
            const submitBtn = document.querySelector('#terminosForm button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> ACTUALIZAR REGISTRO';
            submitBtn.className = "btn-premium btn-premium-blue";
            submitBtn.style.width = "auto";
            submitBtn.style.fontSize = "";
            submitBtn.style.padding = "";

            // Mostrar el indicador flotante
            const indicator = document.getElementById('editModeIndicator');
            if (indicator) indicator.style.display = 'block';

            // Mostrar botón cancelar
            const cancelBtn = document.getElementById('cancelEditBtn');
            if (cancelBtn) cancelBtn.style.display = 'inline-block';

            // Inject History Button
            let histBtn = document.getElementById('btnHistory');
            if (!histBtn) {
                histBtn = document.createElement('button');
                histBtn.type = "button";
                histBtn.id = "btnHistory";
                histBtn.className = "btn-info"; // Azul claro para diferenciar
                histBtn.style.backgroundColor = "#17a2b8";
                histBtn.style.marginLeft = "10px";
                histBtn.innerHTML = '<i class="fas fa-history"></i> Historial';
                // Find where to append - maybe next to submit button parent container if created
                // Check if wrapper exists
                const btnContainer = submitBtn.parentElement;
                if (btnContainer && btnContainer.style.display === 'flex') {
                    btnContainer.appendChild(histBtn);
                } else {
                    submitBtn.parentNode.appendChild(histBtn);
                }
            }
            histBtn.onclick = function () { viewHistory(id); };
            histBtn.style.display = 'inline-block';

            document.querySelector('.data-form-card').scrollIntoView({ behavior: 'smooth' });
        }
    });
}
// function resetForm() defined above

function formatDate(dateString) {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// GLOBAL DATA STORAGE for Search & Export
let globalTerminos = [];

// GLOBAL LISTENER REFERENCE
window.unsubscribeRealtime = null;

// SETUP REALTIME LISTENER
window.setupRealtimeUpdates = function () {
    // Unsubscribe previous if exists (Clean slate for new user)
    if (window.unsubscribeRealtime) {
        console.log("DEBUG: Cleaning up old Firestore listener...");
        window.unsubscribeRealtime();
    }

    // Escuchar colección 'tutelas' y renderizar cambios automáticamente
    window.unsubscribeRealtime = db.collection(currentCollection).orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        globalTerminos = [];
        snapshot.forEach((doc) => {
            const data = doc.data();

            // FILTER LOGIC:
            // 1. Admin sees ALL
            // 2. Radicador (Any Type) sees ALL (to verify assignments)
            // 3. User sees ONLY match with currentUser.juzgado

            let showRecord = false;

            const role = (currentUser.role || '').toLowerCase();
            if (role === 'admin' || role.startsWith('radicador')) {
                showRecord = true;
            } else {
                // Precise match required - con TRIM y manejo de nulidad
                const dataJuzgado = (data.juzgado || "").trim();
                const userJuzgado = (currentUser.juzgado || "").trim();

                let isMatch = false;

                // SPECIAL MATCH FOR JUZ01CMPL (Emergency Fuzzy Logic)
                // This resolves the issue where records might have slightly different names in DB
                if (currentUser.username === 'juz01cmpl') {
                    const normData = dataJuzgado.toLowerCase();
                    if (normData.includes("primero civil municipal")) {
                        isMatch = true;
                    }
                }

                // STANDARD EXACT MATCH (Primary check)
                if (dataJuzgado && dataJuzgado === userJuzgado) {
                    isMatch = true;
                }

                if (isMatch) showRecord = true;
            }

            if (showRecord) {
                globalTerminos.push({ id: doc.id, ...data });
            }
        });
        filterAndRender(); // Render with current filter
    });
}

// SEARCH LOGIC
document.getElementById('searchInput').addEventListener('keyup', function () {
    filterAndRender();
});

function filterAndRender() {
    // 1. QUERY (Multicampo: Radicado, Nombres, etc)
    const query = document.getElementById('searchInput').value.toLowerCase();

    // 2. FECHA REPARTO
    const filterFecha = document.getElementById('filterFecha').value;

    // 3. JUZGADO (Nuevo filtro opcional para Admin/Radicador)
    const filterJuzgadoEl = document.getElementById('filterJuzgadoTabla');

    // LAZY LOAD: Asegurar que el select esté lleno antes de leer su valor
    if (filterJuzgadoEl && filterJuzgadoEl.options.length <= 1) {
        if (typeof window.loadJuzgadosIntoSelect === 'function') {
            window.loadJuzgadosIntoSelect();
        }
    }

    const filterJuzgado = filterJuzgadoEl ? filterJuzgadoEl.value : "";

    // Actualizar filtros actuales en AdvancedFilters antes de filtrar
    if (window.AdvancedFilters) {
        window.AdvancedFilters.currentFilters.juzgado = filterJuzgado;
        window.AdvancedFilters.currentFilters.searchTerm = query;
        window.AdvancedFilters.currentFilters.radicadoEspecfico = document.getElementById('filterRadicadoAnio')?.value || "";
    }

    const filtered = globalTerminos.filter(item => {
        // A. TEXT SEARCH
        const textToSearch = (
            (item.radicado || "") + " " +
            (item.accionante || "") + " " +
            (item.accionado || "") + " " +
            (item.asignadoA || "") + " " +
            (item.derecho || "") + " " +
            (item.decision || "")
        ).toLowerCase();
        const matchesText = textToSearch.includes(query);

        // B. DATE FILTER (Simple)
        const matchesFecha = (filterFecha === "") || (item.fechaReparto === filterFecha);

        // C. DOCUMENT FILTER (Cédula/NIT)
        let matchesDoc = true;
        const filterDocEl = document.getElementById('filterDocumento');
        const filterDoc = filterDocEl ? filterDocEl.value.trim() : "";

        if (filterDoc !== "") {
            const id1 = (item.idAccionante || "").toString();
            const id2 = (item.idAccionado || "").toString();
            matchesDoc = id1.includes(filterDoc) || id2.includes(filterDoc);
        }

        // D. ADVANCED FILTERS INTEGRATION
        let matchesAdvanced = true;
        if (window.AdvancedFilters && typeof window.AdvancedFilters.matchesFilters === 'function') {
            matchesAdvanced = window.AdvancedFilters.matchesFilters(item);
        }

        return matchesText && matchesFecha && matchesDoc && matchesAdvanced;
    });

    renderRealtimeTable(filtered);
    return filtered;
}

// EXPORT TO EXCEL
window.exportToExcel = function () {
    if (globalTerminos.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    const query = (document.getElementById('searchInput').value || "").toLowerCase();
    const filterFecha = document.getElementById('filterFecha').value;
    const filterJuzgadoEl = document.getElementById('filterJuzgadoTabla');
    const filterJuzgado = filterJuzgadoEl ? filterJuzgadoEl.value : "";

    const dataToExport = globalTerminos.filter(item => {
        const textToSearch = (
            (item.radicado || "") + " " +
            (item.accionante || "") + " " +
            (item.accionado || "") + " " +
            (item.derecho || "") + " " +
            (item.decision || "")
        ).toLowerCase();

        const matchesText = textToSearch.includes(query);
        const matchesFecha = (filterFecha === "") || (item.fechaReparto === filterFecha);
        const matchesJuzgado = (filterJuzgado === "") ||
            (item.juzgadoDestino || item.juzgadoOwner || item.juzgado || "").includes(filterJuzgado);

        return matchesText && matchesFecha && matchesJuzgado;
    });

    if (dataToExport.length === 0) {
        alert("No hay registros que coincidan con los filtros actuales.");
        return;
    }

    const isRad = (currentUser.role && currentUser.role.startsWith('radicador'));
    const wb = XLSX.utils.book_new();
    let ws_data = [];

    if (isRad) {
        // Headers Radicador EXACT ORDER
        ws_data.push([
            "Asignado A Juzgado", "Radicado", "Fecha Reparto", "Accionante",
            "Doc. Id. Accionante", "Accionado", "Doc. Id. Accionado",
            "Derecho Vulnerado", "Observaciones"
        ]);

        dataToExport.forEach(item => {
            ws_data.push([
                item.juzgadoDestino || item.juzgadoOwner || item.juzgado || 'Sin Asignar',
                item.radicado,
                item.fechaReparto,
                item.accionante,
                item.idAccionante || '',
                item.accionado || '',
                item.idAccionado || '',
                item.derecho || '',
                item.observaciones || ''
            ]);
        });
    } else {
        // Headers Admin/Juzgado (Standard)
        ws_data.push([
            "Radicado", "Accionante", "Doc. Id. Accionante", "Accionado",
            "Doc. Id. Accionado", "Juzgado", "Asignado", "F. Reparto",
            "F. Fallo", "Límite (10)", "¿Cumplió?", "Alerta",
            "Decisión", "Derecho", "Género", "Impugnó"
        ]);

        dataToExport.forEach(item => {
            ws_data.push([
                item.radicado,
                item.accionante,
                item.idAccionante || '',
                item.accionado || '',
                item.idAccionado || '',
                item.juzgadoDestino || item.juzgadoOwner || item.juzgado || 'Sin Asignar',
                item.asignadoA || '',
                item.fechaReparto,
                item.fechaNotificacion || '',
                item.diaDiez,
                item.cumplio,
                item.alerta,
                item.decision || '',
                item.derecho || '',
                item.genero || '',
                item.impugno || ''
            ]);
        });
    }

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Force Radicado column to be string to avoid scientific notation
    const radColIndex = isRad ? 1 : 0;
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const addr = XLSX.utils.encode_col(radColIndex) + (R + 1);
        if (ws[addr]) {
            ws[addr].t = 's'; // type string
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Tutelas");
    XLSX.writeFile(wb, `Reporte_Tutelas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// PAGINATION STATE
let currentPage = 1;
const recordsPerPage = 20;

function renderRealtimeTable(terminos) {
    const tbody = document.getElementById('terminosTableBody');
    tbody.innerHTML = '';

    if (terminos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="17" style="text-align:center">No hay registros en la Nube aún.</td></tr>';
        // Clear pagination if exists
        const pagContainer = document.getElementById('paginationControls');
        if (pagContainer) pagContainer.innerHTML = '';
        return;
    }

    // Update Counter
    const counterEl = document.getElementById('totalCount');
    if (counterEl) {
        counterEl.innerHTML = `<i class="fas fa-layer-group"></i> Total: ${terminos.length}`;
    }

    // PAGINATION LOGIC
    const totalPages = Math.ceil(terminos.length / recordsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const recordsToShow = terminos.slice(startIndex, endIndex);

    // Helper Function needed locally
    const getJuzgadoColor = (nombre) => {
        if (currentCollection === 'demandas') return '#28a745'; // Green
        return '#00b4db'; // Sky Blue for Tutelas
    };

    const thead = document.querySelector('#tablaTerminos thead');
    // Normalize role for comparison
    const role = (currentUser.role || '').toLowerCase();
    const isRadicador = (role.startsWith('radicador'));

    // DEFINICIÓN DE ENCABEZADOS Y FILAS SEGÚN ROL
    if (isRadicador) {
        const headerColorVal = (currentCollection === 'demandas') ? '#28a745' : '#004884';

        // 1. ROL RADICADOR - ORDEN ESPECÍFICO SOLICITADO
        thead.innerHTML = `
            <tr>
                <th>Fecha Reparto</th>
                <th id="colJuzgadoHeader" style="background-color: ${headerColorVal}; color: white;">Asignado A Juzgado</th>
                <th>Radicado</th>
                <th>Accionante</th>
                <th>Doc. Id. Accionante</th>
                <th style="min-width: 150px;">Accionado</th>
                <th style="min-width: 120px;">Doc. Id. Accionado</th>
                <th style="max-width: 150px;">Derecho Vulnerado</th>
                <th style="max-width: 150px;">Observaciones</th>
                <th style="min-width: 100px;">Acciones</th>
            </tr>
        `;

        // LIMPIAR TBODY ANTES DE LLENAR (CRÍTICO)
        tbody.innerHTML = '';

        // GENERAR FILAS RADICADOR
        recordsToShow.forEach(item => {
            const juzName = item.juzgadoDestino || item.juzgadoOwner || item.juzgado || 'Sin Asignar';
            const color = getJuzgadoColor(juzName);

            // Botón Borrar (Solo Admin/Radicador)
            const deleteBtn = `
            <button class="btn-action-delete" onclick="deleteTermino('${item.id}')" title="Borrar">
                <i class="fas fa-trash"></i>
            </button>`;

            const rowClass = (currentCollection === 'demandas') ? 'row-demandas' : 'row-tutelas';

            const row = `
                <tr class="${rowClass}">
                    <td>${formatDate(item.fechaReparto)}</td>
                    <td style="color: ${color}; font-weight: bold;">${juzName}</td>
                    <td><strong>${item.radicado}</strong></td>
                    <td>${item.accionante}</td>
                    <td>${item.idAccionante || '-'}</td>
                    <td>${item.accionado || '-'}</td>
                    <td>${item.idAccionado || '-'}</td>
                    <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.derecho || ''}">${item.derecho || '-'}</td>
                    <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.observaciones || ''}">
                        <small>${item.observaciones || '-'}</small>
                    </td>
                    <td>
                        <button class="btn-action-edit" onclick="editTermino('${item.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${deleteBtn}
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } else {
        // 2. ROL STANDARD (Admin / Juzgado) - Columnas Completas
        const showJuzgadoValues = (role === 'admin');
        const displayStyleJuzgado = showJuzgadoValues ? '' : 'display:none;';

        thead.innerHTML = `
            <tr>
                <th>F. Reparto</th>
                <th id="colJuzgadoHeader" style="${displayStyleJuzgado}">Juzgado</th>
                <th>Radicado</th>
                <th>Accionante</th>
                <th>Doc. Id. Accion.</th>
                <th>Accionado</th>
                <th>Doc. Id. Accion.</th>
                <th id="colAsignado">Asignado</th>
                <th id="colFallo">F. Fallo</th>
                <th id="colDia10">Día 10</th>
                <th id="colCumplio">¿Cumplió?</th>
                <th id="colAlerta">Alerta</th>
                <th id="colDecision">Decisión</th>
                <th id="colDerecho" style="max-width: 120px;">Derecho</th>
                <th>Género</th>
                <th>Impugnó</th>
                <th style="min-width: 100px;">Acciones</th>
            </tr>
        `;

        // LIMPIAR TBODY ANTES DE LLENAR (CRÍTICO)
        tbody.innerHTML = '';

        recordsToShow.forEach(item => {
            const juzName = item.juzgadoDestino || item.juzgadoOwner || item.juzgado || 'Sin Asignar';
            const color = getJuzgadoColor(juzName);

            // Status Logic Repeats (Keeping existing logic)
            let badgeClass = ""; // Initialize badgeClass
            if (item.alerta === "Rojo") badgeClass = "badge-danger";
            let cumplioHtml = item.cumplio || "-";
            if (item.cumplio === "SÍ") cumplioHtml = `<span class="badge badge-success">SÍ <i class="fas fa-check"></i></span>`;
            else if (item.cumplio === "NO") cumplioHtml = `<span class="badge badge-danger">NO <i class="fas fa-times"></i></span>`;

            const subject = encodeURIComponent(`ALERTA VENCIMIENTO: Tutela ${item.radicado}`);
            const body = encodeURIComponent(`Radicado ${item.radicado} vencido.`);
            const emailAction = `window.location.href='mailto:?subject=${subject}&body=${body}'`;

            // Dynamic Alert Logic (Calculate based on today's date)
            const todayStr = new Date().toISOString().split('T')[0];
            let dynamicAlerta = item.alerta || "Verde";

            // Only recalculate if no notification date is present
            if (!item.fechaNotificacion) {
                if (item.diaDiez && todayStr > item.diaDiez) {
                    dynamicAlerta = "Rojo";
                } else if (item.diaSiete && todayStr >= item.diaSiete) {
                    dynamicAlerta = "Amarillo";
                } else {
                    dynamicAlerta = "Verde";
                }
            }

            let badgeHtml = '';
            if (item.cumplio === "SÍ" || item.cumplio === "NO") {
                badgeHtml = '';
            } else {
                if (dynamicAlerta === "Verde") badgeHtml = `<span class="badge badge-success">✅ A Tiempo</span>`;
                else if (dynamicAlerta === "Amarillo") badgeHtml = `<span class="badge badge-warning" style="cursor:pointer;" onclick="${emailAction}" title="Enviar Correo de Alerta">⚠️ Alerta <i class="far fa-envelope"></i></span>`;
                else if (dynamicAlerta === "Rojo") badgeHtml = `<span class="badge badge-danger" style="cursor:pointer;" onclick="${emailAction}" title="Enviar Correo de Vencimiento">🚨 Vencido <i class="far fa-envelope"></i></span>`;
                else badgeHtml = `<span class="badge badge-secondary">${dynamicAlerta}</span>`;
            }

            let deleteBtnHtml = '';
            if (role === 'admin') { // Only admin can delete in this view
                deleteBtnHtml = `<button class="btn-action-delete" onclick="deleteTermino('${item.id}')" title="Borrar"><i class="fas fa-trash"></i></button>`;
            }

            const rowClass = (currentCollection === 'demandas') ? 'row-demandas' : 'row-tutelas';

            const row = `
                <tr class="${rowClass}">
                    <td>${formatDate(item.fechaReparto)}</td>
                    <td style="color: ${color}; font-weight: bold; ${displayStyleJuzgado}">${juzName}</td>
                    <td><strong>${item.radicado}</strong></td>
                    <td>${item.accionante}</td>
                    <td>${item.idAccionante || '-'}</td>
                    <td>${item.accionado || '-'}</td>
                    <td>${item.idAccionado || '-'}</td>
                    <td>${item.asignadoA || '-'}</td>
                    <td>${formatDate(item.fechaNotificacion)}</td>
                    <td>${formatDate(item.diaDiez)}</td>
                    <td>${cumplioHtml}</td>
                    <td>${badgeHtml}</td>
                    <td>${item.decision || '-'}</td>
                    <td style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.derecho || ''}">${item.derecho || '-'}</td>
                    <td>${item.genero || '-'}</td>
                    <td>${item.impugno || '-'}</td>
                    <td>
                            <button class="btn-action-edit" onclick="editTermino('${item.id}')" title="Editar / Ver"><i class="fas fa-edit"></i></button>
                            ${deleteBtnHtml}
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    // RENDER PAGINATION CONTROLS
    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    let pagContainer = document.getElementById('paginationControls');
    if (!pagContainer) {
        // Create if doesn't exist (after table)
        pagContainer = document.createElement('div');
        pagContainer.id = 'paginationControls';
        pagContainer.className = 'pagination-controls';
        pagContainer.style.cssText = "display: flex; justify-content: center; align-items: center; gap: 5px; margin-top: 15px;";
        const tableCard = document.querySelector('.data-table-card');
        if (tableCard) tableCard.appendChild(pagContainer);
    }

    if (totalPages <= 1) {
        pagContainer.innerHTML = ''; // No controls needed
        return;
    }

    let buttons = '';

    // Prev Button
    buttons += `<button onclick="changePage(${currentPage - 1})" class="btn-sm" style="padding: 8px 16px; font-size: 1rem; ${currentPage === 1 ? 'opacity:0.5; pointer-events:none;' : ''}">&laquo; Ant</button>`;

    // Page Numbers (Simple range: 1 2 ... 5 6)
    // For simplicity showing all or a slice could be better, implementing simple slice around current
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        buttons += `<button onclick="changePage(1)" class="btn-sm" style="padding: 8px 16px; font-size: 1rem; ${currentPage === 1 ? 'background:#007bff; color:white;' : ''}">1</button>`;
        if (startPage > 2) buttons += `<span style="font-size: 1.2rem; font-weight: bold;">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeStyle = (i === currentPage) ? 'background-color: #007bff; color: white; border-color: #007bff;' : '';
        buttons += `<button onclick="changePage(${i})" class="btn-sm" style="padding: 8px 16px; font-size: 1rem; ${activeStyle}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) buttons += `<span style="font-size: 1.2rem; font-weight: bold;">...</span>`;
        buttons += `<button onclick="changePage(${totalPages})" class="btn-sm" style="padding: 8px 16px; font-size: 1rem; ${currentPage === totalPages ? 'background:#007bff; color:white;' : ''}">${totalPages}</button>`;
    }

    // Next Button
    buttons += `<button onclick="changePage(${currentPage + 1})" class="btn-sm" style="padding: 8px 16px; font-size: 1rem; ${currentPage === totalPages ? 'opacity:0.5; pointer-events:none;' : ''}">Sig &raquo;</button>`;

    pagContainer.innerHTML = buttons;
}

window.changePage = function (newPage) {
    currentPage = newPage;
    // Re-render current global data with new page
    // Needs access to current filtered data. 
    // Optimization: call filterAndRender() which calls renderRealtimeTable
    filterAndRender();
}

window.deleteTermino = function (id) {
    if (currentUser.role !== 'admin' && currentUser.role !== 'radicador') {
        alert("⛔ Solo Admin o Radicador pueden eliminar registros.");
        return;
    }

    if (!confirm("⚠️ ¿Estás seguro de ELIMINAR este registro definitivamente?")) return;
    db.collection(currentCollection).doc(id).delete()
        .then(() => {
            console.log("Registro eliminado");
            // La tabla se actualiza sola por el listener
        })
        .catch((error) => {
            console.error("Error eliminando: ", error);
            alert("Error al eliminar.");
        });
}


// function enterDashboard() moved up for safety

// ==========================================
// LOGICA DE FECHAS Y DÍAS HÁBILES (COLOMBIA)
// ==========================================

// Festivos Colombia 2025 y 2026 (YYYY-MM-DD)
const holidaysColombia = [
    // 2025
    '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
    '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
    '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
    '2025-12-08', '2025-12-25',
    // 2026
    '2026-01-01', '2026-01-12', '2026-03-23',
    // Semana Santa Judicial 2026 (Semana Completa)
    '2026-03-30', '2026-03-31', '2026-04-01', '2026-04-02', '2026-04-03',
    '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
    '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
    '2026-11-16', '2026-12-08',
    '2026-12-17', // Día del Empleado Judicial
    '2026-12-25',
    // 2027 (Partial for overflow)
    '2027-01-01', '2027-01-11'
];

function isBusinessDay(date) {
    const day = date.getDay(); // 0 = Domingo, 6 = Sábado
    if (day === 0 || day === 6) return false; // Fin de semana

    // Formato YYYY-MM-DD para comparar con lista
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (holidaysColombia.includes(dateStr)) return false; // Es festivo

    return true;
}

const vacanciaDaysAll = [
    // Dec 20, 2025 to Jan 10, 2026 (Weekdays only, weekends/holidays handled globally)
    '2025-12-22', '2025-12-23', '2025-12-24', '2025-12-26',
    '2025-12-29', '2025-12-30', '2025-12-31',
    '2026-01-02', '2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09',

    // Dec 20, 2026 to Jan 10, 2027
    '2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24', '2026-12-26', // (25 is holiday)
    '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31',
    '2027-01-02', // (If Jan 1 is Fri, Jan 2 Sat checked by weekend logic, but just in case)
    '2027-01-04', '2027-01-05', '2027-01-06', '2027-01-07', '2027-01-08'
];

// ==========================================
// ALGORITMO DE CALENDARIO PERPETUO (COLOMBIA)
// ==========================================
const HolidayCalculator = {
    cache: {},

    getEasterDate: function (year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    },

    addDays: function (date, days) {
        let result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    moveToNextMonday: function (date) {
        while (date.getDay() !== 1) {
            date.setDate(date.getDate() + 1);
        }
        return date;
    },

    formatDate: function (date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    },

    getHolidays: function (year) {
        if (this.cache[year]) return this.cache[year];

        let holidays = [];
        // 1. Fixed Holidays
        const fixed = [`${year}-01-01`, `${year}-05-01`, `${year}-07-20`, `${year}-08-07`, `${year}-12-08`, `${year}-12-25`];
        holidays.push(...fixed);

        // 2. Emiliani Holidays
        const emilianiBase = [`${year}-01-06`, `${year}-03-19`, `${year}-06-29`, `${year}-08-15`, `${year}-10-12`, `${year}-11-01`, `${year}-11-11`];
        emilianiBase.forEach(dateStr => {
            let d = new Date(dateStr + 'T00:00:00');
            if (d.getDay() !== 1) { d = this.moveToNextMonday(d); }
            holidays.push(this.formatDate(d));
        });

        // 3. Easter Based
        const easter = this.getEasterDate(year);
        // Holy Week (Mon-Fri)
        for (let i = -6; i <= -2; i++) holidays.push(this.formatDate(this.addDays(easter, i)));
        // Ascension (43), Corpus (64), Sacred Heart (71)
        [43, 64, 71].forEach(d => holidays.push(this.formatDate(this.addDays(easter, d))));

        // 4. JUDICIAL SPECIFIC
        holidays.push(`${year}-12-17`);

        this.cache[year] = holidays;
        return holidays;
    },

    isInVacancia: function (dateStr, hasVacanciaUser) {
        if (!hasVacanciaUser) return false;
        const parts = dateStr.split('-');
        let d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const m = d.getMonth();
        const day = d.getDate();
        if ((m === 11 && day >= 20) || (m === 0 && day <= 10)) return true;
        return false;
    }
};

// Función CORRECTA para sumar días hábiles
function addBusinessDays(startDateStr, daysToAdd) {
    if (!startDateStr) return "";

    // Parsear fecha inicio (YYYY-MM-DD -> Local Date sin timezone issues)
    const parts = startDateStr.split('-');
    // Crear fecha a las 12:00 para evitar problemas de cambio de horario
    let currentDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);

    let daysAdded = 0;

    // Obtener preferencias del usuario actual para vacancia
    // Si no hay usuario logueado, asumimo false por defecto (o true si se prefiere conservador)
    const applyVacancia = (typeof currentUser !== 'undefined' && currentUser.hasVacancia === true);

    while (daysAdded < daysToAdd) {
        // 1. Avanzar un día natural
        currentDate.setDate(currentDate.getDate() + 1);

        // 2. Verificar condiciones del día
        const dayOfWeek = currentDate.getDay(); // 0=Domingo, 6=Sábado
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        // a) Fin de Semana
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            continue; // Es sábado o domingo, no cuenta, seguimos buscando
        }

        // b) Festivos (Calculados dinámicamente)
        // Nota: HolidayCalculator debe estar definido antes
        const holidays = getHolidaysForYear(yyyy); // Usaremos función auxiliar o la del objeto
        if (holidays.includes(dateStr)) {
            continue; // Es festivo oficial, no cuenta
        }

        // c) Vacancia Judicial (Solo si el usuario aplica para ella)
        if (applyVacancia) {
            // Regla General: 20 Dic a 10 Ene (inclusive)
            const m = currentDate.getMonth(); // 0-11
            const d = currentDate.getDate();

            // Diciembre (11) >= 20 OR Enero (0) <= 10
            if ((m === 11 && d >= 20) || (m === 0 && d <= 10)) {
                continue; // Estamos en vacancia, no cuenta
            }

            // Semana Santa (Toda la semana)
            // Ya está cubierta en los festivos si agregamos toda la semana en getHolidaysForYear
            // Si getHolidays solo trae Jueves/Viernes, aquí deberíamos agregar Lunes-Miércoles Santo si aplica
        }

        // Si pasó todos los filtros, ES un día hábil
        daysAdded++;
    }

    // Formatear salida
    const yFinal = currentDate.getFullYear();
    const mFinal = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dFinal = String(currentDate.getDate()).padStart(2, '0');
    return `${yFinal}-${mFinal}-${dFinal}`;
}

// Wrapper simple para obtener festivos del año usando la lógica existente
function getHolidaysForYear(year) {
    if (HolidayCalculator.cache[year]) return HolidayCalculator.cache[year];

    // Si no está en caché, calcúlalo (Lógica copiada/adaptada de objeto anterior para acceso global)
    // Para simplificar, asumimos que HolidayCalculator.getHolidays funciona bien si se expone
    if (typeof HolidayCalculator !== 'undefined' && typeof HolidayCalculator.getHolidays === 'function') {
        return HolidayCalculator.getHolidays(year);
    }
    return []; // Fallback empty
}

// Event Listener para cálculo automático
function setupDateAutoCalc() {
    const fechaRepartoInput = document.getElementById('fechaReparto');
    if (fechaRepartoInput) {
        // Use multiple events to ensure capture
        ['change', 'blur', 'input'].forEach(evt =>
            fechaRepartoInput.addEventListener(evt, function () {
                const fechaInicio = this.value;
                if (fechaInicio) {
                    try {
                        const dia7 = addBusinessDays(fechaInicio, 7);
                        const dia10 = addBusinessDays(fechaInicio, 10);

                        const el7 = document.getElementById('diaSiete');
                        const el10 = document.getElementById('diaDiez');

                        if (el7) el7.value = dia7;
                        if (el10) el10.value = dia10;
                    } catch (e) {
                        console.error("Error calculating dates", e);
                    }
                }
            })
        );
    }
}

// Call on load and immediately
document.addEventListener('DOMContentLoaded', setupDateAutoCalc);
// Also try to call it in case DOMContentLoaded already fired (e.g. if script loaded late)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupDateAutoCalc();
}

// Close (x) for Image Modal
if (span) {
    span.onclick = function () {
        modal.style.display = "none";
    }
}

// VIDEO MODAL LOGIC
window.openVideo = function () {
    const modal = document.getElementById("videoModal");
    const player = document.getElementById("videoPlayer");
    if (modal && player) {
        // Embed URL con el ID proporcionado por el usuario
        player.src = "https://www.youtube.com/embed/6AmXIy-SHQA?autoplay=1";
        modal.style.display = "flex";
    }
}

window.closeVideo = function () {
    const modal = document.getElementById("videoModal");
    const player = document.getElementById("videoPlayer");
    if (modal && player) {
        modal.style.display = "none";
        player.src = ""; // Stop video
    }
}

// Close when clicking outside the modals
window.onclick = function (event) {
    const modal = document.getElementById('imageModal'); // Master image modal
    const videoModal = document.getElementById('videoModal');
    const loginModal = document.getElementById('loginModal');

    if (event.target == modal) {
        modal.style.display = "none";
    }
    if (event.target == videoModal) {
        window.closeVideo();
    }
    if (event.target == loginModal) {
        window.closeLoginModal();
    }
    const cpModal = document.getElementById("changePasswordModal");
    if (cpModal && event.target == cpModal) {
        cpModal.style.display = "none";
    }
}

// FUNCIONES DE CAMBIO DE CONTRASEÑA DE USUARIO (SELF-SERVICE)
window.openChangePasswordModal = function () {
    console.log("Intentando abrir modal contraseña...");
    const m = document.getElementById("changePasswordModal");
    if (m) {
        m.style.display = "block";
        document.getElementById("changePasswordForm").reset();
    } else {
        console.error("No se encontró el modal 'changePasswordModal'");
        alert("Error: Modal no encontrado. Contacte soporte.");
    }
}

window.closeChangePasswordModal = function () {
    const m = document.getElementById("changePasswordModal");
    if (m) m.style.display = "none";
}

window.handleChangePassword = function (e) {
    e.preventDefault();
    const currentPassVal = document.getElementById("currentPassword").value;
    const newPassVal = document.getElementById("newOwnPassword").value;

    if (!currentUser || !currentUser.username) {
        alert("Error: No hay sesión activa.");
        return;
    }

    // Verify current (simple check with local state)
    // Note: In a real app we would re-auth with Firebase Auth, but here we use custom auth logic
    // We assume currentUser.password is kept up to date or we fetch it.
    // Let's trust local state for now as MVP.
    if (currentUser.password && currentPassVal !== currentUser.password) {
        alert("❌ La contraseña actual es incorrecta.");
        return;
    }

    if (confirm("¿Seguro que desea cambiar su contraseña?")) {
        // Usamos SET con merge:true para que si el usuario no existe (ej: admin hardcoded), se cree.
        db.collection("users").doc(currentUser.username).set({
            password: newPassVal,
            role: currentUser.role, // Asegurar rol
            juzgado: currentUser.juzgado || 'Todos' // Asegurar juzgado
        }, { merge: true }).then(() => {
            alert("✅ Contraseña actualizada correctamente.");
            currentUser.password = newPassVal; // Update local state
            localStorage.setItem('sgc_user', JSON.stringify(currentUser)); // Persist
            closeChangePasswordModal();
        }).catch((err) => {
            console.error("Error cambiando contraseña:", err);
            alert("Error al actualizar: " + err.message);
        });
    }
}

// DATOS INICIALES DE JUZGADOS (Moved to top of file)

// Function to populate the Juzgado Select (for Radicador & Table Filter)
// Function to populate the Juzgado Select (for Radicador & Table Filter)
window.loadJuzgadosIntoSelect = function () {
    console.log("CARGANDO JUZGADOS MANUAL...");

    if (typeof initialJuzgadosData === 'undefined' || !initialJuzgadosData) {
        alert("ERROR CRÍTICO: No se encontraron los datos de juzgados (initialJuzgadosData).");
        return;
    }

    const selectFilter = document.getElementById('filterJuzgadoTabla');

    if (!selectFilter) {
        alert("ERROR: No se encontró el elemento select 'filterJuzgadoTabla' en el HTML.");
        return;
    }

    // Clear options except the first one
    selectFilter.innerHTML = '<option value="">Todos los Despachos</option>';

    // Load data
    initialJuzgadosData.forEach(juz => {
        const opt = document.createElement('option');
        opt.value = juz.name;
        opt.innerText = juz.name;
        selectFilter.appendChild(opt);
    });

    // Also try to load the form select just in case
    const selectForm = document.getElementById('juzgadoDestino');
    if (selectForm) {
        selectForm.innerHTML = '<option value="">Seleccione...</option>';
        initialJuzgadosData.forEach(juz => {
            const opt = document.createElement('option');
            opt.value = juz.name;
            opt.innerText = juz.name;
            selectForm.appendChild(opt);
        });
    }

    console.log(`✅ Se cargaron ${initialJuzgadosData.length} juzgados en el filtro.`);
}

// HISTORY & AUDIT LOGIC
window.viewHistory = function (id) {
    const modal = document.getElementById('historyModal');
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Cargando historial...</td></tr>';

    modal.style.display = "block";

    db.collection("audit_logs")
        .where("entityId", "==", id)
        // .orderBy("timestamp", "desc") // REMOVED to avoid index error
        .get()
        .then((snapshot) => {
            tbody.innerHTML = '';
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No hay cambios registrados.</td></tr>';
                return;
            }

            // Convert to array and sort in memory
            let logs = [];
            snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));

            logs.sort((a, b) => {
                const tA = a.timestamp ? a.timestamp.seconds : 0;
                const tB = b.timestamp ? b.timestamp.seconds : 0;
                return tB - tA; // Descending
            });

            logs.forEach((log) => {
                const date = log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : "Sin fecha";

                let actionBtn = '';
                // Allow restoring only if user is Admin or the same user who made the change (or owner)
                // For simplicity: Admin and Juzgados can restore.
                if (currentUser.role === 'admin' || currentUser.role === 'user' || currentUser.role === 'radicador') {
                    actionBtn = `<button class="btn-sm btn-warning" onclick="restoreVersion('${log.id}')" title="Restaurar esta versión"><i class="fas fa-undo"></i> Restaurar</button>`;
                }

                const row = `
                    <tr style="border-bottom: 1px solid #444;">
                        <td>${date}</td>
                        <td>${log.modifiedBy || 'Sistema'}</td>
                        <td>${log.action || 'UPDATE'}</td>
                        <td>${actionBtn}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        })
        .catch((error) => {
            console.error("Error fetching history:", error);
            tbody.innerHTML = '<tr><td colspan="4">Error cargando historial.</td></tr>';
        });
}

window.closeHistoryModal = function () {
    document.getElementById('historyModal').style.display = "none";
}

window.restoreVersion = function (logId) {
    if (!confirm("⚠️ ¿Estás seguro de RESTAURAR esta versión antigua?\nEsto sobrescribirá los datos actuales con los de esa fecha.")) {
        return;
    }

    db.collection("audit_logs").doc(logId).get().then((doc) => {
        if (doc.exists) {
            const logData = doc.data();
            const previousData = logData.previousData;
            const targetId = logData.entityId;

            if (previousData && targetId) {
                // Perform Restore
                // 1. Save CURRENT state as audit log before overwriting (Safety)
                // This is handled by handleFormSubmit if we used it, but here we do direct update.
                // We should manually log the restoration action.

                db.collection(currentCollection).doc(targetId).update(previousData)
                    .then(() => {
                        // Log the restoration
                        db.collection("audit_logs").add({
                            entityId: targetId,
                            entityCollection: currentCollection,
                            previousData: {}, // We don't have the "overwritten" state easily here without another fetch, acceptable trade-off or fetch it.
                            action: 'RESTORE_VERSION',
                            restoredFromLogId: logId,
                            modifiedBy: currentUser.username,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        alert("✅ Versión restaurada exitosamente.");
                        closeHistoryModal();
                        // Refresh form if open
                        if (currentEditId === targetId) {
                            editTermino(targetId); // Reload form
                        }
                    })
                    .catch((err) => {
                        alert("Error al restaurar: " + err.message);
                    });
            }
        } else {
            alert("No se encontró el registro de historial.");
        }
    });
}


// --- MODAL & UI SWITCHING ---

window.processActaPDF = async function (input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const statusSpan = document.getElementById('pdfStatus');
    statusSpan.textContent = "⏳ Analizando PDF...";
    statusSpan.style.color = "#004884";

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1); // Acta is usually 1 page
        const textContent = await page.getTextContent();

        // Extract all text items into a single string for regex (and keep array for positional)
        const textItems = textContent.items.map(item => item.str);
        const fullText = textItems.join(" "); // Joined with spaces

        console.log("PDF Full Text:", fullText); // Debug

        // 1. RADICADO (23 Digits)
        // Example: 05266311000220260006300
        let radicadoMatch = fullText.match(/\b(\d{23})\b/);
        if (radicadoMatch) {
            const fullRad = radicadoMatch[1];
            // FULL 23 DIGITS
            const radInput = document.getElementById('radicadoResto');
            if (radInput) radInput.value = fullRad;
            console.log("Radicado encontrado:", fullRad);
        } else {
            // Fallback: Try with hyphens or spaces if needed, or the old "NÚMERO RADICACIÓN" pattern
            const oldRadMatch = fullText.match(/NÚMERO RADICACIÓN:\s*(\d+)/i);
            if (oldRadMatch) {
                const radicado = oldRadMatch[1];
                if (radicado.replace(/\D/g, '').length === 23) {
                    const radInput = document.getElementById('radicadoResto');
                    if (radInput) radInput.value = radicado.replace(/\D/g, '');
                }
            }
        }

        // 2. FECHA REPARTO
        const dateMatch = fullText.match(/FECHA REPARTO:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
        if (dateMatch) {
            const dateStr = dateMatch[1];
            const [d, m, y] = dateStr.split('/');
            const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            const dateInput = document.getElementById('fechaReparto');
            if (dateInput) {
                dateInput.value = isoDate;
                dateInput.dispatchEvent(new Event('change'));
            }
        }

        // 3. JUZGADO (ROBUST EXTRACTION)
        // Intent 1: Standard Label "REPARTIDO AL DESPACHO:"
        let juzgadoMatch = fullText.match(/REPARTIDO AL DESPACHO[:\s]+(.*?)(?=\s+JUEZ|\s+NUMERO|\s+RADICACIO|\s+FECHA|$)/i);

        // Intent 2: Try looking for "DESPACHO" generally if first failed
        if (!juzgadoMatch) {
            juzgadoMatch = fullText.match(/DESPACHO[:\s]+(.*?)(?=\s+JUEZ|\s+NUMERO|$)/i);
        }

        if (juzgadoMatch) {
            let juzgadoPDF = juzgadoMatch[1].trim();
            // Clean up common noise
            juzgadoPDF = juzgadoPDF.replace("JUEZ / MAGISTRADO:", "").trim();
            juzgadoPDF = juzgadoPDF.replace(/_/g, " ").trim(); // Remove underscores line
            console.log("Juzgado PDF Found:", juzgadoPDF);

            // Attempt mapping
            const mapped = mapAndSelectJuzgado(juzgadoPDF);

            // FALLBACK ULTRA-ROBUST: If mapping failed, try searching the WHOLE text for exact known Juzgado names
            // This fixes cases where the regex missed the label but the court name is clear in the document
            if (!mapped) {
                console.log("Mapping failed with extracted text. Scanning full text for known Juzgados...");
                scanFullTextForJuzgado(fullText);
            }
        } else {
            // Regex failed completely -> Scan full text
            console.log("Juzgado Regex failed. Scanning full text...");
            scanFullTextForJuzgado(fullText);
        }

        // 4. ACCIONANTE
        let accionanteIndex = textItems.findIndex(t => t.toUpperCase().includes("DEMANDANTE"));
        if (accionanteIndex === -1) accionanteIndex = textItems.findIndex(t => t.toUpperCase().includes("ACCIONANTE"));

        if (accionanteIndex > 0) {
            let idFound = "";
            let nameFound = "";

            // Search backwards for an ID-like string
            for (let i = accionanteIndex - 1; i >= Math.max(0, accionanteIndex - 15); i--) {
                let txt = textItems[i].trim();
                // Remove dots and spaces to check for ID (e.g. "1.234.567")
                let cleanId = txt.replace(/[\.\s]/g, '');

                // CRITICAL: Stop if we hit a boundary word (though less likely for Accionante as it's usually first)
                if (txt.includes("JUEZ") || txt.includes("DESPACHO")) break;

                // Check if it looks like a valid ID (5-15 digits)
                if (/^\d{5,15}$/.test(cleanId) && cleanId.length > 4) {
                    idFound = cleanId;

                    // Text between ID and Label
                    const chunksBetween = textItems.slice(i + 1, accionanteIndex);
                    // Filter noise
                    const cleanChunks = chunksBetween.filter(c => c.trim().length > 1 && !/^\d+$/.test(c.replace(/[\.\s]/g, '')));

                    if (cleanChunks.length > 0) {
                        nameFound = cleanChunks.join(" ");
                    }
                    break;
                }
            }

            // Fallback: If no ID found, gather all name chunks until boundary
            if (!nameFound && !idFound) {
                let chunks = [];
                for (let k = accionanteIndex - 1; k >= Math.max(0, accionanteIndex - 10); k--) {
                    const t = textItems[k].trim();
                    // Stop at previous section boundary or header
                    if (t.includes("JUEZ") || t.includes("DESPACHO") || t.includes("PARTE")) break;

                    // Filter noise (headers, dates, empty)
                    if (t.length > 0 && !t.includes("IDENTIFICACION") && !t.includes("CEDULA") && !t.includes("NIT") && !/^\d+$/.test(t.replace(/[\.\s]/g, ''))) {
                        chunks.unshift(t); // Keep correct order
                    }
                }
                if (chunks.length > 0) nameFound = chunks.join(" ");
            }

            if (nameFound) {
                const el = document.getElementById('accionante');
                if (el) el.value = nameFound.toUpperCase();
            }
            if (idFound) {
                const el = document.getElementById('idAccionante');
                if (el) el.value = idFound;
            }
        }

        // 5. ACCIONADO (STRICTER LOGIC)
        let accionadoIndex = textItems.findIndex(t => t.toUpperCase().includes("DEMANDADO")); // Covers Demandado/Indiciado...

        if (accionadoIndex > 0) {
            let idFound = "";
            let nameFound = "";

            // Search backwards
            for (let i = accionadoIndex - 1; i >= Math.max(0, accionadoIndex - 15); i--) {
                const txt = textItems[i].trim();
                const cleanId = txt.replace(/[\.\s]/g, '');

                // CRITICAL SAFETY: If we hit the word "DEMANDANTE" or "ACCIONANTE", STOP IMMEDIATELY.
                // This means we crossed into the previous row and the Accionado DOES NOT have an ID.
                if (txt.includes("DEMANDANTE") || txt.includes("ACCIONANTE")) {
                    console.warn("PDF Parse: Hit Demandante boundary while looking for Demandado ID. Demandado likely has no ID.");
                    break;
                }

                if (/^\d{5,15}$/.test(cleanId) && cleanId.length > 4) {
                    idFound = cleanId;

                    const chunksBetween = textItems.slice(i + 1, accionadoIndex);
                    const cleanChunks = chunksBetween.filter(c => c.trim().length > 1 && !/^\d+$/.test(c.replace(/[\.\s]/g, '')));

                    if (cleanChunks.length > 0) {
                        nameFound = cleanChunks.join(" ");
                    }
                    break;
                }
            }

            // Fallback 1: Gather chunks backward within the row (Row-based extraction)
            if (!nameFound) {
                let chunks = [];
                for (let k = accionadoIndex - 1; k >= Math.max(0, accionadoIndex - 12); k--) {
                    const t = textItems[k].trim();
                    if (t.includes("DEMANDANTE") || t.includes("ACCIONANTE") || t.includes("PARTE")) break;
                    if (t.length > 0 && !t.includes("NIT") && !t.includes("IDENTIFICACION") && !/^\d+$/.test(t.replace(/[\.\s]/g, ''))) {
                        chunks.unshift(t);
                    }
                }
                if (chunks.length > 0) nameFound = chunks.join(" ");
            }

            // Fallback 2: Pool Subtraction (Fix for column-grouped extractions like Colsanitas)
            if (!nameFound) {
                let pool = [];
                const startPool = textItems.findIndex(t => t.toUpperCase().includes("JUEZ")) + 1;
                for (let p = Math.max(0, startPool); p < accionadoIndex; p++) {
                    const t = textItems[p].trim();
                    const up = t.toUpperCase();
                    if (up.includes("DEMANDANTE") || up.includes("ACCIONANTE") || up.includes("NOMBRE") || up.includes("IDENTIFIC")) continue;
                    // Filter out numbers/IDs and short noise
                    if (t.length < 2 || /^\d+$/.test(t.replace(/[\.\s]/g, ''))) continue;
                    pool.push(t);
                }
                // Subtract Accionante Name
                const accVal = (document.getElementById('accionante').value || "").toUpperCase();
                const filtered = pool.filter(p => !accVal.includes(p.toUpperCase()));
                if (filtered.length > 0) nameFound = filtered.join(" ");
            }

            if (nameFound) {
                const el = document.getElementById('accionado');
                if (el) el.value = nameFound.toUpperCase();
            }
            if (idFound) {
                const el = document.getElementById('idAccionado');
                if (el) el.value = idFound;
            }
        }

        statusSpan.textContent = "✅ Datos cargados!";
        statusSpan.style.color = "green";

    } catch (e) {
        console.error("PDF Parse Error:", e);
        statusSpan.textContent = "❌ Error al leer PDF";
    }
}

// Helper para convertir números a ordinales (Escalabilidad)
function getOrdinal(n) {
    const ordinales = [
        "", "Primero", "Segundo", "Tercero", "Cuarto", "Quinto",
        "Sexto", "Septimo", "Octavo", "Noveno", "Decimo",
        "Undecimo", "Duodecimo", "Decimotercero", "Decimocuarto", "Decimoquinto",
        "Decimosexto", "Decimoseptimo", "Decimoctavo", "Decimonoveno", "Vigesimo"
    ];
    return ordinales[n] || "";
}

// HELPER: Convert Word Ordineals to Numbers (Reverse)
function getNumberFromOrdinal(word) {
    const map = {
        "PRIMERO": 1, "SEGUNDO": 2, "TERCERO": 3, "CUARTO": 4, "QUINTO": 5,
        "SEXTO": 6, "SÉPTIMO": 7, "OCTAVO": 8, "NOVENO": 9, "DÉCIMO": 10,
        "UNDÉCIMO": 11, "DUODÉCIMO": 12
    };
    return map[word] || 0;
}

// HELPER: Scan Full Text for known Juzgados
function scanFullTextForJuzgado(fullText) {
    const select = document.getElementById('juzgadoDestino');
    if (!select) return;

    const lowerText = fullText.toLowerCase();

    // Iterate over all OPTIONS in the select (which are the source of truth)
    for (let i = 0; i < select.options.length; i++) {
        const optText = select.options[i].text.toLowerCase();
        if (optText.length < 5 || optText.includes("seleccione")) continue;

        // Strict Check: The FULL Option Name must be in the text
        // E.g. "Juzgado Primero Civil Municipal"
        // But exclude common generic words to avoid false positives?
        // Actually, searching for "Primero Civil Municipal" (without Juzgado) is safer

        const cleanOpt = optText.replace("juzgado ", "").trim();
        if (lowerText.includes(cleanOpt)) {
            select.selectedIndex = i;
            console.log("Full Text Scan Match:", select.options[i].text);
            return true;
        }
    }
    return false;
}

window.mapAndSelectJuzgado = function (juzgadoName) {
    const select = document.getElementById('juzgadoDestino');
    if (!select || !juzgadoName) return false;

    // Normalizar texto del PDF (quitar espacios extra, UPPERCASE)
    let pdfRaw = juzgadoName.toUpperCase().replace(/\s+/g, ' ').trim();
    pdfRaw = pdfRaw.replace("JUEZ / MAGISTRADO:", "").trim();
    pdfRaw = pdfRaw.replace(/[^A-Z0-9\sÑ]/g, ""); // Remove non-alphanumeric noise

    console.log("DEBUG: Mapeando Juzgado PDF (Raw):", pdfRaw);

    // --- 1. INTENTO DINÁMICO (SOPORTE FUTURO) ---
    // A. Busca número DIGITO (ej: "005", "020")
    let numberMatch = pdfRaw.match(/\b0*(\d+)\b/);
    let ordinal = "";

    if (numberMatch) {
        const num = parseInt(numberMatch[1], 10);
        ordinal = getOrdinal(num);
    } else {
        // B. Busca número PALABRA (ej: "PRIMERO", "SEGUNDO")
        const words = ["PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO", "SEXTO", "SEPTIMO", "OCTAVO", "NOVENO", "DECIMO"];
        const foundWord = words.find(w => pdfRaw.includes(w));
        if (foundWord) ordinal = foundWord.charAt(0) + foundWord.slice(1).toLowerCase(); // Title Case "Primero"
    }

    if (ordinal) {
        let keywords = [];

        // Detectar Tipo
        if (pdfRaw.includes("CIVIL")) keywords.push("Civil");
        if (pdfRaw.includes("PENAL")) keywords.push("Penal");
        if (pdfRaw.includes("FAMILIA")) keywords.push("de Familia");
        if (pdfRaw.includes("LABORAL")) keywords.push("Laboral");
        if (pdfRaw.includes("PEQUEÑAS") || pdfRaw.includes("COMPETENCIAS") || pdfRaw.includes("PEQUENAS")) keywords.push("de Pequeñas");

        // Detectar Nivel
        if (pdfRaw.includes("MUNICIPAL")) keywords.push("Municipal");
        if (pdfRaw.includes("CIRCUITO")) keywords.push("Circuito");
        if (pdfRaw.includes("MIXTO")) keywords.push("Mixto");

        // Construir frases de búsqueda probables
        // Ej: "Quinto Civil Municipal"
        const baseGuess = `${ordinal} ${keywords.join(" ")}`;
        console.log("DEBUG: Intento Dinámico Mejorado:", baseGuess);

        if (selectOptionByText(select, baseGuess)) return true;
    }

    // --- 3. DICCIONARIO POR CÓDIGO (RADICADO FIRST 12 DIGITS) - MÉTODO MÁS SEGURO ---
    // Si obtenemos el radicado del PDF, podemos mapear los primeros 12 dígitos al juzgado exacto
    const radicadoInput = document.getElementById('radicadoResto');
    if (radicadoInput && radicadoInput.value && radicadoInput.value.length >= 12) {
        const codigoRadicado = radicadoInput.value.substring(0, 12);
        console.log("DEBUG: Usando Código de Radicado para asignar Juzgado:", codigoRadicado);

        const codigoMap = {
            "052664003001": "Juzgado Primero Civil Municipal de Envigado",
            "052664003002": "Juzgado Segundo Civil Municipal de Envigado",
            "052664003003": "Juzgado Tercero Civil Municipal de Envigado",
            "052664003004": "Juzgado Cuarto Civil Municipal de Envigado",
            "052664003005": "Juzgado Quinto Civil Municipal de Envigado", // Si aplica

            "052663103001": "Juzgado Primero Civil del Circuito de Envigado",
            "052663103002": "Juzgado Segundo Civil del Circuito de Envigado",
            "052663103003": "Juzgado Tercero Civil del Circuito de Envigado",

            "052664046001": "Juzgado Primero Penal Municipal Mixto de Envigado", // Updated Name
            "052664046002": "Juzgado Segundo Penal Municipal Mixto de Envigado", // Updated Name

            "052664088001": "Juzgado Tercero Penal Municipal de Garantias de Envigado", // Garantias
            "052664009001": "Juzgado Cuarto Penal Municipal de Conocimiento de Envigado", // Conocimiento

            "052663109001": "Juzgado Primero Penal del Circuito de Envigado",
            "052663109002": "Juzgado Segundo Penal del Circuito de Envigado",
            "052663109003": "Juzgado Tercero Penal del Circuito de Envigado",

            "052663110001": "Juzgado Primero de Familia de Envigado",
            "052663110002": "Juzgado Segundo de Familia de Envigado",
            "052663110003": "Juzgado Tercero de Familia de Envigado",

            "052663105001": "Juzgado Primero Laboral del Circuito de Envigado",
            "052663105002": "Juzgado Segundo Laboral del Circuito de Envigado",

            "052664189001": "Juzgado Primero de Pequeñas Causas y Competencias Múltiples de Envigado",
            "052664189002": "Juzgado Segundo de Pequeñas Causas y Competencias Múltiples de Envigado"
        };

        // SPECIAL HANDLING FOR 052664046001 / 002 (Mixto vs Municipal discrepancy)
        if (codigoRadicado === "052664046001") {
            const targets = [
                "Juzgado Primero Penal Mixto de Envigado",
                "Juzgado Primero Penal Municipal de Envigado",
                "Juzgado Primero Penal Mixto",
                "Primero Penal Mixto",
                "Primero Penal Municipal"
            ];
            for (const t of targets) {
                if (selectOptionByText(select, t)) {
                    console.log("✅ Asignación por Código (Multi-try):", t);
                    return true;
                }
            }
        }
        if (codigoRadicado === "052664046002") {
            const targets = [
                "Juzgado Segundo Penal Mixto de Envigado",
                "Juzgado Segundo Penal Municipal de Envigado",
                "Juzgado Segundo Penal Mixto",
                "Segundo Penal Mixto",
                "Segundo Penal Municipal"
            ];
            for (const t of targets) {
                if (selectOptionByText(select, t)) {
                    console.log("✅ Asignación por Código (Multi-try):", t);
                    return true;
                }
            }
        }

        if (codigoMap[codigoRadicado]) {
            // Priority 1: Exact Full Name Match
            if (selectOptionByText(select, codigoMap[codigoRadicado])) {
                console.log("✅ Asignación por Código de Radicado EXITOSA:", codigoMap[codigoRadicado]);
                return true;
            } else {
                // Priority 2: "Core" Name Match (Stripped)
                // E.g. "Primero Penal Municipal Mixto"
                const coreName = codigoMap[codigoRadicado]
                    .replace("Juzgado ", "")
                    .replace(" de Envigado", "")
                    .replace(" del Circuito", " Circuito")
                    .trim();

                if (selectOptionByText(select, coreName)) {
                    console.log("✅ Asignación por Código (Core Name):", coreName);
                    return true;
                }
            }
        }
    }


    // --- 2. DICCIONARIO MANUAL DE TEXTO (Respaldo si falla el código) ---
    const mappingRules = [

        // --- CIVILES MUNICIPALES ---
        { pdf: "MUNICIPAL CIVIL 001", select: "Primero Civil Municipal" },
        { pdf: "MUNICIPAL CIVIL 1", select: "Primero Civil Municipal" },
        { pdf: "MUNICIPAL CIVIL 002", select: "Segundo Civil Municipal" },
        { pdf: "MUNICIPAL CIVIL 2", select: "Segundo Civil Municipal" },
        { pdf: "MUNICIPAL CIVIL 003", select: "Tercero Civil Municipal" },
        { pdf: "MUNICIPAL CIVIL 3", select: "Tercero Civil Municipal" },
        { pdf: "MUNICIPAL CIVIL 004", select: "Cuarto Civil Municipal" },
        { pdf: "MUNICIPAL CIVIL 4", select: "Cuarto Civil Municipal" },

        // Handling "MUNICIPAL - CIVIL" patterns
        { pdf: "JUZGADO 001 CIVIL MUNICIPAL", select: "Primero Civil Municipal" },
        { pdf: "JUZGADO 002 CIVIL MUNICIPAL", select: "Segundo Civil Municipal" },
        { pdf: "JUZGADO 003 CIVIL MUNICIPAL", select: "Tercero Civil Municipal" },
        { pdf: "JUZGADO 004 CIVIL MUNICIPAL", select: "Cuarto Civil Municipal" },

        // --- CIVILES CIRCUITO ---
        { pdf: "CIRCUITO CIVIL 001", select: "Primero Civil Circuito" },
        { pdf: "CIRCUITO CIVIL 002", select: "Segundo Civil Circuito" },
        { pdf: "CIRCUITO CIVIL 003", select: "Tercero Civil Circuito" },

        // --- PENALES MIXTOS (Updated) ---
        { pdf: "PENAL MIXTO 001", select: "Primero Penal Mixto" },
        { pdf: "MUNICIPAL PENAL MIXTO 001", select: "Primero Penal Mixto" },
        { pdf: "PENAL MIXTO 002", select: "Segundo Penal Mixto" },
        { pdf: "MUNICIPAL PENAL MIXTO 002", select: "Segundo Penal Mixto" },

        // --- GARANTIAS Y CONOCIMIENTO ---
        { pdf: "CONTROL DE GARANTIAS 003", select: "Tercero Penal Municipal" }, // Checking legacy
        { pdf: "DE CONOCIMIENTO 004", select: "Cuarto Penal Municipal" },

        // --- FAMILIA ---
        { pdf: "FAMILIA 001", select: "Primero de Familia" },
        { pdf: "FAMILIA 002", select: "Segundo de Familia" },
        { pdf: "FAMILIA 003", select: "Tercero de Familia" },

        // --- LABORAL ---
        { pdf: "LABORAL 001", select: "Primero Laboral" },
        { pdf: "LABORAL 002", select: "Segundo Laboral" },

        // --- PEQUEÑAS CAUSAS ---
        { pdf: "COMPETENCIAS MÚLTIPLES 001", select: "Primero de Pequeñas" },
        { pdf: "COMPETENCIAS MULTIPLES 001", select: "Primero de Pequeñas" },
        { pdf: "COMPETENCIAS MÚLTIPLES 002", select: "Segundo de Pequeñas" },
        { pdf: "COMPETENCIAS MULTIPLES 002", select: "Segundo de Pequeñas" }
    ];

    // Iterar reglas (Loose Match)
    for (const rule of mappingRules) {
        // Normalize rule pdf too
        const token = rule.pdf.replace(/\s+/g, "");
        const rawToken = pdfRaw.replace(/\s+/g, "");

        if (rawToken.includes(token)) {
            // Validation to prevent Municipal vs Circuito mixup
            if (rule.select.includes("Municipal") && pdfRaw.includes("CIRCUITO")) {
                continue;
            }
            return selectOptionByText(select, rule.select);
        }
    }

    console.warn("No se encontró mapeo para:", pdfRaw);
    return false;
}

function selectOptionByText(select, textToken) {
    const options = select.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].text.toLowerCase().includes(textToken.toLowerCase())) {
            select.selectedIndex = i;
            console.log("Mapeo Exitoso:", options[i].text);
            return true;
        }
    }
    return false;
}




console.log("✅ script.js Loaded Successfully");

