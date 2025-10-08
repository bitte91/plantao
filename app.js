document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // STATE MANAGEMENT
    // =================================================================================

    let db = { transactions: [], settings: { theme: 'light', userName: 'Usuário' } };
    let currentChart = null;
    let deferredPrompt;

    /**
     * Saves the current state of the database to localStorage.
     */
    const saveData = () => localStorage.setItem('ferrariManauaraDB', JSON.stringify(db));

    /**
     * Loads data from localStorage or initializes with default data.
     */
    const loadData = () => {
        const data = localStorage.getItem('ferrariManauaraDB');
        if (data) {
            db = JSON.parse(data);
        } else {
            db = {
                transactions: [
                    { id: 1, type: 'income', value: 1500, date: '2025-10-01', paymentMethod: 'PIX' },
                    { id: 2, type: 'expense', value: 50, date: '2025-10-02', category: 'Comida', paymentMethod: 'Cartão' },
                    { id: 3, type: 'expense', value: 25, date: '2025-10-03', category: 'Transporte', paymentMethod: 'Dinheiro' },
                    { id: 4, type: 'income', value: 200, date: '2025-10-05', paymentMethod: 'Dinheiro' }
                ],
                settings: {
                    theme: 'light',
                    userName: 'Usuário'
                }
            };
            saveData();
        }
    };

    // =================================================================================
    // UI RENDERING
    // =================================================================================

    const mainContent = document.getElementById('main-content');
    const tabs = document.querySelectorAll('.nav-tab');

    const switchTab = (tabId) => {
        tabs.forEach(tab => tab.classList.toggle('tab-active', tab.dataset.tab === tabId));
        renderContent(tabId);
    };


    /**
     * Main function to render content based on the active tab.
     * @param {string} tabId - The ID of the tab to render.
     */
    const renderContent = (tabId) => {
        if (!mainContent) return;
        mainContent.innerHTML = '';
        const renderFunctions = {
            dashboard: renderDashboard,
            transactions: renderTransactions,
            settings: renderSettings
        };
        (renderFunctions[tabId] || renderDashboard)(mainContent);
        lucide.createIcons();
    };

    /**
     * Renders the dashboard view with financial summaries and a chart.
     * @param {HTMLElement} element - The parent element to render into.
     */
    const renderDashboard = (element) => {
        const totalIncome = db.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
        const totalExpenses = db.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);
        const balance = totalIncome - totalExpenses;
        const recentTransactions = [...db.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        element.innerHTML = `
            <div class="tab-content space-y-6">
                <section class="grid md:grid-cols-3 gap-6" aria-label="Resumo financeiro">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                        <div class="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl"><i data-lucide="arrow-up-circle" class="w-6 h-6 text-green-600 dark:text-green-400"></i></div>
                        <div>
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Receita Total</h3>
                            <p class="text-xl md:text-2xl font-bold text-green-500">${totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                        <div class="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl"><i data-lucide="arrow-down-circle" class="w-6 h-6 text-red-600 dark:text-red-400"></i></div>
                        <div>
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Despesas Totais</h3>
                            <p class="text-xl md:text-2xl font-bold text-red-500">${totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                        <div class="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl"><i data-lucide="dollar-sign" class="w-6 h-6 text-blue-600 dark:text-blue-400"></i></div>
                        <div>
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Saldo Atual</h3>
                            <p class="text-xl md:text-2xl font-bold text-blue-500">${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                    </div>
                </section>
                <section class="grid lg:grid-cols-2 gap-6" aria-label="Detalhes das transações">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visão Geral</h3>
                        <canvas id="overview-chart"></canvas>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transações Recentes</h3>
                        <div class="space-y-4">
                            ${recentTransactions.map(t => `
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}">
                                        <i data-lucide="${t.type === 'income' ? 'arrow-up' : 'arrow-down'}" class="w-5 h-5 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-semibold">${t.type === 'income' ? 'Entrada' : t.category}</p>
                                        <p class="text-sm text-gray-500">${new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <p class="font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}">
                                        ${t.type === 'income' ? '+' : '-'} ${t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </section>
            </div>
        `;

        const ctx = document.getElementById('overview-chart').getContext('2d');
        if (currentChart) {
            currentChart.destroy();
        }
        currentChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Receitas', 'Despesas'],
                datasets: [{
                    label: 'Valor',
                    data: [totalIncome, totalExpenses],
                    backgroundColor: ['#10B981', '#EF4444'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    };

    /**
     * Renders the list of all transactions with filtering options.
     * @param {HTMLElement} element - The parent element to render into.
     */
    const renderTransactions = (element) => {
        element.innerHTML = `
            <section class="tab-content space-y-6" aria-label="Lista de transações">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 class="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Todas as Transações</h2>

                    <!-- Filtros -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <input type="text" id="filter-text" placeholder="Buscar por texto..." class="p-2 border rounded">
                        <input type="date" id="filter-date" class="p-2 border rounded">
                        <select id="filter-type" class="p-2 border rounded">
                            <option value="">Todos os tipos</option>
                            <option value="income">Entrada</option>
                            <option value="expense">Saída</option>
                        </select>
                    </div>

                    <div id="transaction-list" class="space-y-4">
                        <!-- A lista de transações será renderizada aqui -->
                    </div>
                </div>
            </section>
        `;

        const renderFilteredTransactions = () => {
            const filterText = document.getElementById('filter-text').value.toLowerCase();
            const filterDate = document.getElementById('filter-date').value;
            const filterType = document.getElementById('filter-type').value;

            const filtered = db.transactions.filter(t => {
                const textMatch = !filterText || (t.category && t.category.toLowerCase().includes(filterText)) || (t.paymentMethod && t.paymentMethod.toLowerCase().includes(filterText));
                const dateMatch = !filterDate || t.date === filterDate;
                const typeMatch = !filterType || t.type === filterType;
                return textMatch && dateMatch && typeMatch;
            });

            const transactionList = document.getElementById('transaction-list');
            transactionList.innerHTML = filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => `
                <div class="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}">
                        <i data-lucide="${t.type === 'income' ? 'arrow-up' : 'arrow-down'}" class="w-5 h-5 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-semibold">${t.type === 'income' ? 'Entrada' : t.category}</p>
                        <p class="text-sm text-gray-500">${new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')} - ${t.paymentMethod}${t.type === 'expense' ? ' - ' + t.category : ''}</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <p class="font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}">
                            ${t.type === 'income' ? '+' : '-'} ${t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <button onclick="window.openTransactionModal('${t.id}')" class="text-gray-500 hover:text-blue-500" aria-label="Editar transação"><i data-lucide="edit"></i></button>
                        <button onclick="window.deleteTransaction('${t.id}')" class="text-gray-500 hover:text-red-500" aria-label="Excluir transação"><i data-lucide="trash"></i></button>
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
        };

        document.getElementById('filter-text').addEventListener('input', renderFilteredTransactions);
        document.getElementById('filter-date').addEventListener('input', renderFilteredTransactions);
        document.getElementById('filter-type').addEventListener('change', renderFilteredTransactions);

        renderFilteredTransactions();
    };


    /**
     * Renders the settings page.
     * @param {HTMLElement} element - The parent element to render into.
     */
    const renderSettings = (element) => {
        element.innerHTML = `<section aria-label="Configurações"><h2 class="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Configurações</h2><p>Página de configurações em desenvolvimento.</p></section>`;
    };

    // =================================================================================
    // MODALS
    // =================================================================================

    /**
     * Opens a generic modal.
     * @param {string} title - The title of the modal.
     * @param {string} content - The HTML content of the modal.
     * @param {Array} actions - An array of action buttons for the modal footer.
     */
    const openModal = (title, content, actions = []) => {
        const modalContainer = document.getElementById('modal-container');
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop';
        modal.innerHTML = `
            <div class="bg-card dark:bg-card-dark rounded-lg shadow-xl max-w-md w-full">
                <div class="flex justify-between items-center p-4 border-b border-border dark:border-border-dark">
                    <h2 class="text-lg font-bold text-text-primary dark:text-text-primary-dark">${title}</h2>
                    <button onclick="window.closeModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Fechar modal">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="p-4">${content}</div>
                <div class="flex justify-end gap-3 p-4 border-t border-border dark:border-border-dark">
                    ${actions.map(action => `<button onclick="${action.action}" class="px-4 py-2 rounded-lg transition-colors ${action.primary ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}">${action.text}</button>`).join('')}
                </div>
            </div>
        `;
        modalContainer.appendChild(modal);
        lucide.createIcons();
    };

    /**
     * Closes any open modal.
     */
    window.closeModal = () => {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = '';
    };

    /**
     * Opens the modal for adding or editing a transaction.
     * @param {string|null} id - The ID of the transaction to edit, or null for a new one.
     */
    window.openTransactionModal = (id) => {
        const isEdit = !!id;
        const transaction = isEdit ? db.transactions.find(t => t.id == id) : { type: 'expense', date: new Date().toISOString().split('T')[0] };
        const title = isEdit ? 'Editar Transação' : 'Nova Transação';

        const content = `
            <form id="transaction-form" class="space-y-4">
                <input type="hidden" id="transaction-id" value="${transaction.id || ''}">
                <div>
                    <label class="block text-sm font-medium">Tipo</label>
                    <select id="transaction-type" class="w-full p-2 border rounded">
                        <option value="income" ${transaction.type === 'income' ? 'selected' : ''}>Entrada</option>
                        <option value="expense" ${transaction.type === 'expense' ? 'selected' : ''}>Saída</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium">Valor (R$)</label>
                    <input type="number" id="transaction-value" value="${transaction.value || ''}" class="w-full p-2 border rounded" required>
                </div>
                <div>
                    <label class="block text-sm font-medium">Data</label>
                    <input type="date" id="transaction-date" value="${transaction.date}" class="w-full p-2 border rounded" required>
                </div>
                <div id="payment-method-field">
                    <label class="block text-sm font-medium">Método de Pagamento</label>
                    <select id="transaction-payment-method" class="w-full p-2 border rounded">
                        <option value="Dinheiro" ${transaction.paymentMethod === 'Dinheiro' ? 'selected' : ''}>Dinheiro</option>
                        <option value="Pix" ${transaction.paymentMethod === 'Pix' ? 'selected' : ''}>Pix</option>
                        <option value="Cartão" ${transaction.paymentMethod === 'Cartão' ? 'selected' : ''}>Cartão</option>
                    </select>
                </div>
                <div id="category-field" class="${transaction.type === 'income' ? 'hidden' : ''}">
                    <label class="block text-sm font-medium">Categoria</label>
                    <select id="transaction-category" class="w-full p-2 border rounded">
                        <option value="Comida" ${transaction.category === 'Comida' ? 'selected' : ''}>Comida</option>
                        <option value="Roupa" ${transaction.category === 'Roupa' ? 'selected' : ''}>Roupa</option>
                        <option value="Transporte" ${transaction.category === 'Transporte' ? 'selected' : ''}>Transporte</option>
                        <option value="Outros" ${transaction.category === 'Outros' ? 'selected' : ''}>Outros</option>
                    </select>
                </div>
            </form>
        `;

        openModal(title, content, [
            { text: 'Cancelar', action: 'window.closeModal()' },
            { text: isEdit ? 'Salvar' : 'Adicionar', action: `window.saveTransaction('${id || ''}')`, primary: true }
        ]);

        document.getElementById('transaction-type').addEventListener('change', (e) => {
            document.getElementById('category-field').classList.toggle('hidden', e.target.value === 'income');
        });
    };

    /**
     * Saves a transaction (new or edited) to the database.
     * @param {string|null} id - The ID of the transaction to save.
     */
    window.saveTransaction = (id) => {
        const isEdit = !!id;
        const transaction = {
            id: isEdit ? parseInt(id) : Date.now(),
            type: document.getElementById('transaction-type').value,
            value: parseFloat(document.getElementById('transaction-value').value),
            date: document.getElementById('transaction-date').value,
            paymentMethod: document.getElementById('transaction-payment-method').value,
            category: document.getElementById('transaction-type').value === 'expense' ? document.getElementById('transaction-category').value : null
        };

        if (!transaction.value || !transaction.date) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }

        if (isEdit) {
            const index = db.transactions.findIndex(t => t.id == id);
            db.transactions[index] = transaction;
        } else {
            db.transactions.push(transaction);
        }

        saveData();
        closeModal();
        renderContent(document.querySelector('.nav-tab.tab-active').dataset.tab);
        showToast('Transação salva com sucesso!', 'success');
    };

    /**
     * Deletes a transaction from the database.
     * @param {string} id - The ID of the transaction to delete.
     */
    window.deleteTransaction = (id) => {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            db.transactions = db.transactions.filter(t => t.id != id);
            saveData();
            renderContent(document.querySelector('.nav-tab.tab-active').dataset.tab);
            showToast('Transação excluída com sucesso!', 'success');
        }
    };

    /**
     * Opens a modal with instructions for installing the PWA on iOS.
     */
    const openIOSInstallModal = () => {
        const content = `
            <div class="text-center">
                <p class="mb-4">Para instalar o aplicativo no seu iPhone, siga estes passos:</p>
                <ol class="text-left space-y-2">
                    <li>1. Toque no ícone de <strong>Compartilhar</strong> <i data-lucide="share"></i> na barra de navegação do Safari.</li>
                    <li>2. Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                    <li>3. Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
                </ol>
            </div>
        `;
        openModal('Instalar no iOS', content, [{ text: 'Entendi', action: 'window.closeModal()', primary: true }]);
    };

    // =================================================================================
    // SETUP AND INITIALIZATION
    // =================================================================================

    /**
     * Sets up the theme toggle functionality.
     */
    const setupTheme = () => {
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        const lightIcon = document.getElementById('theme-icon-light');
        const darkIcon = document.getElementById('theme-icon-dark');
        const htmlEl = document.documentElement;

        const applyTheme = (theme) => {
            htmlEl.classList.toggle('dark', theme === 'dark');
            lightIcon.classList.toggle('hidden', theme === 'dark');
            darkIcon.classList.toggle('hidden', theme !== 'dark');
            localStorage.setItem('theme', theme);
        };

        const currentTheme = localStorage.getItem('theme') || 'light';
        applyTheme(currentTheme);

        themeToggleBtn.addEventListener('click', () => {
            applyTheme(htmlEl.classList.contains('dark') ? 'light' : 'dark');
        });
    };

    /**
     * Registers the service worker for PWA functionality.
     */
    const setupServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(reg => console.log('SW registered'))
                               .catch(err => console.log('SW registration failed: ', err));
            });
        }
    };

    /**
     * Displays a toast notification.
     * @param {string} message - The message to display.
     * @param {string} type - The type of toast (e.g., 'success', 'error').
     */
    const showToast = (message, type = 'success') => {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const icons = { success: 'check-circle', error: 'x-circle' };
        const colors = { success: 'bg-green-500', error: 'bg-red-500' };
        toast.className = `p-4 rounded-lg mb-3 text-white ${colors[type]} flex items-center gap-2`;
        toast.innerHTML = `<i data-lucide="${icons[type]}"></i> ${message}`;
        toastContainer.appendChild(toast);
        lucide.createIcons();
        setTimeout(() => toast.remove(), 3000);
    };

    /**
     * Updates the clock in the header.
     */
    const updateClock = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const clockElement = document.getElementById('current-time');
        if (clockElement) {
            clockElement.textContent = timeStr;
        }
    };

    // --- APP INITIALIZATION ---

    loadData();
    setupTheme();
    setupServiceWorker();
    updateClock();
    setInterval(updateClock, 60000);

    // =================================================================================
    // EVENT LISTENERS & PWA
    // =================================================================================

    const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

    /**
     * Attaches event listeners to navigation tabs and the FAB.
     */
    const setupEventListeners = () => {
        const installButton = document.getElementById('install-pwa-btn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installButton.classList.remove('hidden');
        });

        if (isIOS() && !isInStandaloneMode()) {
            installButton.classList.remove('hidden');
        }

        installButton.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                });
            } else if (isIOS() && !isInStandaloneMode()) {
                openIOSInstallModal();
            }
        });

        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

        const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
        mobileNavBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

        document.getElementById('fab-add-transaction').addEventListener('click', () => {
            window.openTransactionModal();
        });
    };

    setupEventListeners();
    switchTab('dashboard');
});
