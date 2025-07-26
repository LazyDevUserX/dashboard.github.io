document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'zoroExamHistory';
    let examData = [];
    let donutChart, lineChart;

    // --- DOM ELEMENT SELECTORS ---
    const statsGrid = document.getElementById('stats-grid');
    const historyTableBody = document.getElementById('historyTableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    const searchInput = document.getElementById('searchInput');
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const importModal = document.getElementById('importModal');
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    const importTextArea = document.getElementById('importTextArea');

    // --- INITIALIZATION ---
    function init() {
        loadData();
        renderAll();
        setupEventListeners();
    }

    function loadData() {
        const data = localStorage.getItem(STORAGE_KEY);
        examData = data ? JSON.parse(data) : [];
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(examData));
    }

    // --- RENDERING FUNCTIONS ---
    function renderAll() {
        renderStatCards();
        renderCharts();
        renderTable(examData);
    }

    function renderStatCards() {
        if (examData.length === 0) {
            statsGrid.innerHTML = '';
            return;
        }

        const totalExams = examData.length;
        const avgPercentage = examData.reduce((sum, exam) => sum + exam.percentage, 0) / totalExams;
        const bestPercentage = Math.max(...examData.map(exam => exam.percentage));
        const lastExam = examData.sort((a,b) => new Date(b.date) - new Date(a.date))[0];

        statsGrid.innerHTML = `
            <div class="stat-card card">
                <div class="icon blue"><i class="fas fa-file-alt"></i></div>
                <div class="info"><p>Total Exams</p><h3>${totalExams}</h3></div>
            </div>
            <div class="stat-card card">
                <div class="icon yellow"><i class="fas fa-bullseye"></i></div>
                <div class="info"><p>Average Score</p><h3>${avgPercentage.toFixed(2)}%</h3></div>
            </div>
            <div class="stat-card card">
                <div class="icon green"><i class="fas fa-trophy"></i></div>
                <div class="info"><p>Best Score</p><h3>${bestPercentage.toFixed(2)}%</h3></div>
            </div>
            <div class="stat-card card">
                <div class="icon red"><i class="fas fa-chart-line"></i></div>
                <div class="info"><p>Last Score</p><h3>${lastExam.percentage.toFixed(2)}%</h3></div>
            </div>
        `;
    }

    function renderCharts() {
        renderDonutChart();
        renderLineChart();
    }

    function renderDonutChart() {
        const ctx = document.getElementById('donutChart').getContext('2d');
        if (donutChart) donutChart.destroy();

        const totalCorrect = examData.reduce((sum, exam) => sum + exam.correct, 0);
        const totalIncorrect = examData.reduce((sum, exam) => sum + exam.incorrect, 0);
        const totalNotAttempted = examData.reduce((sum, exam) => sum + exam.notAttempted, 0);

        donutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect', 'Not Attempted'],
                datasets: [{
                    data: [totalCorrect, totalIncorrect, totalNotAttempted],
                    backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
                    borderColor: '#1f2937',
                    borderWidth: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#d1d5db' }
                    }
                },
                cutout: '70%'
            }
        });
    }

    function renderLineChart() {
        const ctx = document.getElementById('lineChart').getContext('2d');
        if (lineChart) lineChart.destroy();

        const chartData = [...examData].sort((a, b) => new Date(a.date) - new Date(b.date));
        const labels = chartData.map(exam => dayjs(exam.date).format('MMM D, YYYY'));
        const percentages = chartData.map(exam => exam.percentage);

        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score Percentage',
                    data: percentages,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true, max: 100,
                        ticks: { color: '#d1d5db', callback: value => value + '%' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#d1d5db' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: context => `Score: ${context.raw.toFixed(2)}%` } }
                }
            }
        });
    }

    function renderTable(data) {
        historyTableBody.innerHTML = '';
        if (data.length === 0) {
            noDataMessage.style.display = 'block';
            return;
        }
        noDataMessage.style.display = 'none';

        data.forEach(exam => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dayjs(exam.date).format('MMM D, YYYY')}</td>
                <td>${exam.examName}</td>
                <td style="color: var(--accent-green);">${exam.correct}</td>
                <td style="color: var(--accent-red);">${exam.incorrect}</td>
                <td style="color: var(--accent-yellow);">${exam.notAttempted}</td>
                <td class="font-semibold">${exam.percentage.toFixed(2)}%</td>
            `;
            historyTableBody.appendChild(row);
        });
    }

    // --- EVENT LISTENERS & HANDLERS ---
    function setupEventListeners() {
        searchInput.addEventListener('input', handleSearch);
        document.querySelector('thead').addEventListener('click', handleSort);
        importBtn.addEventListener('click', () => importModal.style.display = 'flex');
        cancelImportBtn.addEventListener('click', () => importModal.style.display = 'none');
        confirmImportBtn.addEventListener('click', handleImport);
        exportBtn.addEventListener('click', handleExport);
        clearDataBtn.addEventListener('click', handleClear);
    }

    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredData = examData.filter(exam =>
            exam.examName.toLowerCase().includes(searchTerm)
        );
        renderTable(filteredData);
    }

    let sortState = { column: 'date', direction: 'desc' };
    function handleSort(e) {
        const column = e.target.dataset.sort;
        if (!column) return;

        const direction = (sortState.column === column && sortState.direction === 'asc') ? 'desc' : 'asc';
        sortState = { column, direction };

        const sortedData = [...examData].sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (column === 'date') {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        renderTable(sortedData);
    }

    function handleImport() {
        try {
            const dataToImport = JSON.parse(importTextArea.value);
            if (!Array.isArray(dataToImport)) throw new Error("Data is not an array.");
            
            // Basic validation of the first item
            if (dataToImport.length > 0 && !dataToImport[0].examName) {
                throw new Error("Data format seems incorrect.");
            }
            
            examData = dataToImport;
            saveData();
            renderAll();
            importTextArea.value = '';
            importModal.style.display = 'none';
            alert('Data imported successfully!');
        } catch (error) {
            alert('Import failed! Please check the data format. It should be a valid JSON array.');
            console.error(error);
        }
    }

    function handleExport() {
        if (examData.length === 0) {
            alert('No data to export.');
            return;
        }
        const dataStr = JSON.stringify(examData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'zoro_exam_history.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleClear() {
        if (confirm('Are you sure you want to delete all your exam history? This action cannot be undone.')) {
            examData = [];
            saveData();
            renderAll();
        }
    }

    // --- START THE APPLICATION ---
    init();
});
