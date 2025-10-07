document.addEventListener('DOMContentLoaded', () => {

            let db = { transactions: [], settings: { theme: 'light', userName: 'Usuário' } };
            let currentChart = null;

            const saveData = () => localStorage.setItem('ferrariManauaraDB', JSON.stringify(db));
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

            const mainContent = document.getElementById('main-content');
            const tabs = document.querySelectorAll('.nav-tab');

            const switchTab = (tabId) => {
                tabs.forEach(tab => tab.classList.toggle('tab-active', tab.dataset.tab === tabId));
                renderContent(tabId);
            };

            tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

            const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
            mobileNavBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

            const updateClock = () => {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const clockElement = document.getElementById('current-time');
                if (clockElement) {
                    clockElement.textContent = timeStr;
                }
            };
            updateClock();
            setInterval(updateClock, 60000);

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

            const renderDashboard = (element) => {
                const totalIncome = db.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
                const totalExpenses = db.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);
                const balance = totalIncome - totalExpenses;
                const recentTransactions = [...db.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

                element.innerHTML = `
                    <div class="tab-content space-y-6">
                        <div class="grid md:grid-cols-3 gap-6">
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Receita Total</h3>
                                <p class="text-3xl font-bold text-green-500">${totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Despesas Totais</h3>
                                <p class="text-3xl font-bold text-red-500">${totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Saldo Atual</h3>
                                <p class="text-3xl font-bold text-blue-500">${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                        </div>
                        <div class="grid lg:grid-cols-2 gap-6">
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visão Geral</h3>
                                <canvas id="overview-chart"></canvas>
                            </div>
                            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transações Recentes</h3>
                                <div class="space-y-4">
                                    ${recentTransactions.map(t => `
                                        <div class="flex justify-between items-center">
                                            <div>
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
                        </div>
                    </div>
                `;

                const ctx = document.getElementById('overview-chart').getContext('2d');
                new Chart(ctx, {
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

            const renderTransactions = (element) => {
                const transactions = [...db.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
                element.innerHTML = `
                    <div class="tab-content space-y-6">
                        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h2 class="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Todas as Transações</h2>
                            <div class="space-y-4">
                                ${transactions.map(t => `
                                    <div class="flex justify-between items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div>
                                            <p class="font-semibold">${t.type === 'income' ? 'Entrada' : t.category}</p>
                                            <p class="text-sm text-gray-500">${new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')} - ${t.paymentMethod}${t.type === 'expense' ? ' - ' + t.category : ''}</p>
                                        </div>
                                        <div class="flex items-center gap-4">
                                            <p class="font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}">
                                                ${t.type === 'income' ? '+' : '-'} ${t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                            <button onclick="window.openTransactionModal('${t.id}')" class="text-gray-500 hover:text-blue-500"><i data-lucide="edit"></i></button>
                                            <button onclick="window.deleteTransaction('${t.id}')" class="text-gray-500 hover:text-red-500"><i data-lucide="trash"></i></button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            };

            const renderSettings = (element) => {
                element.innerHTML = `<h2 class="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Configurações</h2><p>Página de configurações em desenvolvimento.</p>`;
            };

            const openModal = (title, content, actions = []) => {
                const modalContainer = document.getElementById('modal-container');
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop';
                modal.innerHTML = `
                    <div class="bg-card dark:bg-card-dark rounded-lg shadow-xl max-w-md w-full">
                        <div class="flex justify-between items-center p-4 border-b border-border dark:border-border-dark">
                            <h2 class="text-lg font-bold text-text-primary dark:text-text-primary-dark">${title}</h2>
                            <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
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

            window.closeModal = () => {
                const modalContainer = document.getElementById('modal-container');
                modalContainer.innerHTML = '';
            };

            window.openTransactionModal = (id) => {
                const isEdit = !!id;
                const transaction = isEdit ? db.transactions.find(t => t.id == id) : { type: 'expense' };
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
                            <input type="date" id="transaction-date" value="${transaction.date || new Date().toISOString().split('T')[0]}" class="w-full p-2 border rounded" required>
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
                    { text: 'Cancelar', action: 'closeModal()' },
                    { text: isEdit ? 'Salvar' : 'Adicionar', action: `window.saveTransaction('${id || ''}')`, primary: true }
                ]);

                document.getElementById('transaction-type').addEventListener('change', (e) => {
                    const type = e.target.value;
                    document.getElementById('category-field').classList.toggle('hidden', type === 'income');
                });
            };

            window.saveTransaction = (id) => {
                const isEdit = !!id;
                const type = document.getElementById('transaction-type').value;
                const value = parseFloat(document.getElementById('transaction-value').value);
                const date = document.getElementById('transaction-date').value;
                const paymentMethod = document.getElementById('transaction-payment-method').value;
                const category = document.getElementById('transaction-category').value;

                if (!value || !date) {
                    showToast('Por favor, preencha todos os campos.', 'error');
                    return;
                }

                const transaction = {
                    id: isEdit ? parseInt(id) : Date.now(),
                    type, value, date, paymentMethod,
                    category: type === 'expense' ? category : null
                };

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

            window.deleteTransaction = (id) => {
                if (confirm('Tem certeza que deseja excluir esta transação?')) {
                    db.transactions = db.transactions.filter(t => t.id != id);
                    saveData();
                    renderContent(document.querySelector('.nav-tab.tab-active').dataset.tab);
                    showToast('Transação excluída com sucesso!', 'success');
                }
            };

            const setupTheme = () => {
                const themeToggleBtn = document.getElementById('theme-toggle-btn');
                const lightIcon = document.getElementById('theme-icon-light');
                const darkIcon = document.getElementById('theme-icon-dark');
                const htmlEl = document.documentElement;

                const applyTheme = (theme) => {
                    if (theme === 'dark') {
                        htmlEl.classList.add('dark');
                        lightIcon.classList.add('hidden');
                        darkIcon.classList.remove('hidden');
                    } else {
                        htmlEl.classList.remove('dark');
                        darkIcon.classList.add('hidden');
                        lightIcon.classList.remove('hidden');
                    }
                    localStorage.setItem('theme', theme);
                };

                const currentTheme = localStorage.getItem('theme') || 'light';
                applyTheme(currentTheme);

                themeToggleBtn.addEventListener('click', () => {
                    const newTheme = htmlEl.classList.contains('dark') ? 'light' : 'dark';
                    applyTheme(newTheme);
                });
            };

            const setupServiceWorker = () => {
                if ('serviceWorker' in navigator) {
                    window.addEventListener('load', () => {
                        navigator.serviceWorker.register('/sw.js').then(reg => console.log('SW registered'))
                               .catch(err => console.log('SW registration failed: ', err));
                    });
                }
            };

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

            loadData();
            setupTheme();
            setupServiceWorker();
            switchTab('dashboard');

            document.getElementById('fab-add-transaction').addEventListener('click', () => {
                window.openTransactionModal();
            });
        });
