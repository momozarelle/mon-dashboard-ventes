// Récupération des clés Supabase depuis l'URL ou à configurer directement
// ASTUCE : On va demander à Vercel de nous injecter ça proprement plus tard.
const SUPABASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'TON_URL_SUPABASE_PROD' 
    : '__SUPABASE_URL__'; // Sera remplacé au déploiement
const SUPABASE_KEY = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'TA_CLE_SUPABASE_PROD' 
    : '__SUPABASE_KEY__';

// Initialisation du client Supabase
// Remplacer directement par tes vraies clés ici pour le test rapide si tu veux :
const supabaseUrl = 'METS_TON_URL_SUPABASE_ICI';
const supabaseKey = 'METS_TA_CLE_ANON_SUPABASE_ICI';
const supabase = supabase?.createClient ? supabase.createClient(supabaseUrl, supabaseKey) : null;

async function fetchAndRenderDashboard() {
    if (!supabase) return alert("Configure tes clés Supabase dans app.js !");

    // 1. Récupérer les données de la table "ventes"
    const { data: ventes, error } = await supabase
        .from('ventes')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error("Erreur de récupération :", error);
        return;
    }

    // 2. Calculs des KPIs
    let totalCA = 0;
    let totalEBG = 0;
    let totalDirect = 0;
    const monthlyData = {};
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    ventes.forEach(v => {
        const montant = parseFloat(v.montant);
        totalCA += montant;
        
        if (v.source === 'EBG') totalEBG += montant;
        if (v.source === 'Direct') totalDirect += montant;

        // Groupement par mois
        const mIdx = new Date(v.date).getMonth();
        const mName = months[mIdx];
        monthlyData[mName] = (monthlyData[mName] || 0) + montant;
    });

    // Mettre à jour les KPIs textuels dans le HTML
    document.getElementById('kpi-total').innerText = `${totalCA.toLocaleString('fr-FR')} € HT`;
    document.getElementById('kpi-ebg').innerText = `${totalEBG.toLocaleString('fr-FR')} € HT`;
    document.getElementById('kpi-direct').innerText = `${totalDirect.toLocaleString('fr-FR')} € HT`;
    document.getElementById('pct-ebg').innerText = `${((totalEBG/totalCA)*100).toFixed(1)}% du total`;
    document.getElementById('pct-direct').innerText = `${((totalDirect/totalCA)*100).toFixed(1)}% du total`;

    // 3. Remplir le Tableau
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    ventes.forEach(v => {
        const row = `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-gray-500 whitespace-nowrap">${new Date(v.date).toLocaleDateString('fr-FR')}</td>
                <td class="px-6 py-4 font-medium text-gray-900">${v.client}</td>
                <td class="px-6 py-4 text-gray-500">${v.description}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-md ${v.source === 'EBG' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}">
                        ${v.source}
                    </span>
                </td>
                <td class="px-6 py-4 text-right font-semibold text-gray-950">${parseFloat(v.montant).toLocaleString('fr-FR')} €</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    // 4. Graphique Évolution Mensuelle
    new Chart(document.getElementById('monthlyChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(monthlyData),
            datasets: [{
                label: 'Ventes mensuelles (€)',
                data: Object.values(monthlyData),
                backgroundColor: '#4f46e5',
                borderRadius: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 5. Graphique Camembert (Source)
    new Chart(document.getElementById('sourceChart'), {
        type: 'doughnut',
        data: {
            labels: ['EBG', 'Direct'],
            datasets: [{
                data: [totalEBG, totalDirect],
                backgroundColor: ['#4f46e5', '#10b981']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Lancer le chargement au démarrage
fetchAndRenderDashboard();