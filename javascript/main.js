// Esperar a que el DOM esté completamente cargado
(function() {
    'use strict';

    // Estado de la aplicación
    const appState = {
        currentUser: null,
        currentService: null,
        selectedAmount: null,
        isCustomAmount: false
    };

    // Configuración de servicios
    const servicesConfig = {
        claro: {
            name: 'Claro',
            logoClass: 'claro-logo',
            gradient: 'linear-gradient(135deg, #E30613, #FF3B47)',
            inputLabel: 'Número de teléfono',
            inputPlaceholder: 'Ej: 1123456789',
            inputType: 'tel',
            inputIcon: 'phone'
        },
        personal: {
            name: 'Personal',
            logoClass: 'personal-logo',
            gradient: 'linear-gradient(135deg, #00A7E1, #33B8E8)',
            inputLabel: 'Número de teléfono',
            inputPlaceholder: 'Ej: 1123456789',
            inputType: 'tel',
            inputIcon: 'phone'
        },
        movistar: {
            name: 'Movistar',
            logoClass: 'movistar-logo',
            gradient: 'linear-gradient(135deg, #00A9E0, #33BAE7)',
            inputLabel: 'Número de teléfono',
            inputPlaceholder: 'Ej: 1123456789',
            inputType: 'tel',
            inputIcon: 'phone'
        },
        tuenti: {
            name: 'Tuenti',
            logoClass: 'tuenti-logo',
            gradient: 'linear-gradient(135deg, #0066CC, #3385DB)',
            inputLabel: 'Número de teléfono',
            inputPlaceholder: 'Ej: 1123456789',
            inputType: 'tel',
            inputIcon: 'phone'
        },
        sube: {
            name: 'SUBE',
            logoClass: 'sube-logo',
            gradient: 'linear-gradient(135deg, #00A4E4, #33B6E9)',
            inputLabel: 'Número de tarjeta SUBE',
            inputPlaceholder: 'Ej: 6061358812345678',
            inputType: 'text',
            inputIcon: 'card'
        },
        directv: {
            name: 'DirecTV',
            logoClass: 'directv-logo',
            gradient: 'linear-gradient(135deg, #0057A3, #337DB8)',
            inputLabel: 'Número de cliente',
            inputPlaceholder: 'Ej: 12345678',
            inputType: 'text',
            inputIcon: 'user'
        },
        antina: {
            name: 'Antina',
            logoClass: 'antina-logo',
            gradient: 'linear-gradient(135deg, #FF6B00, #FF8833)',
            inputLabel: 'Número de cuenta',
            inputPlaceholder: 'Ej: 987654321',
            inputType: 'text',
            inputIcon: 'user'
        }
    };

    // Elementos del DOM - se inicializan después de que el DOM esté listo
    let elements = null;

    // ===========================================
    // FUNCIONES DE UTILIDAD
    // ===========================================

    function getIconSVG(iconType) {
        const icons = {
            phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
            card: '<rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" stroke-width="2"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="2"/>',
            user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        };
        return icons[iconType] || icons.phone;
    }

    function showToast(message, type = 'success') {
        if (!elements || !elements.toast) return;
        
        elements.toast.textContent = message;
        elements.toast.className = `toast ${type}`;
        elements.toast.classList.add('show');
        
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    function switchScreen(hideScreen, showScreen) {
        if (!hideScreen || !showScreen) return;
        
        // Ocultar pantalla actual
        hideScreen.classList.remove('active');
        if (hideScreen === elements.loginScreen) {
            hideScreen.style.display = 'none';
        } else {
            hideScreen.style.display = 'none';
        }
        
        // Mostrar nueva pantalla
        setTimeout(() => {
            if (showScreen === elements.loginScreen) {
                showScreen.style.display = 'flex';
            } else {
                showScreen.style.display = 'block';
            }
            showScreen.classList.add('active');
            
            // Guardar/eliminar de localStorage
            if (showScreen === elements.dashboardScreen && appState.currentUser) {
                localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
            } else if (showScreen === elements.loginScreen) {
                localStorage.removeItem('currentUser');
            }
        }, 100);
    }

    function updateUserInitials(username) {
        if (!elements || !elements.userInitials) return;
        const initials = username.substring(0, 2).toUpperCase();
        elements.userInitials.textContent = initials;
    }

    function calculateTotal(amount) {
        const fee = amount * 0.02; // 2% de comisión
        const total = amount + fee;
        
        return {
            amount: amount,
            fee: fee.toFixed(2),
            total: total.toFixed(2)
        };
    }

    function updateSummary(amount) {
        if (!elements) return;
        
        if (!amount || amount <= 0) {
            elements.summaryAmount.textContent = '$0';
            elements.summaryFee.textContent = '$0';
            elements.summaryTotal.textContent = '$0';
            return;
        }
        
        const { fee, total } = calculateTotal(amount);
        
        elements.summaryAmount.textContent = `$${amount}`;
        elements.summaryFee.textContent = `$${fee}`;
        elements.summaryTotal.textContent = `$${total}`;
    }

    function formatPhoneNumber(value) {
        return value.replace(/\D/g, '');
    }

    // ===========================================
    // LOGIN
    // ===========================================

    function handleLogin(e) {
        e.preventDefault();
        
        if (!elements) return;
        
        const username = elements.usernameInput.value.trim();
        const password = elements.passwordInput.value;
        
        if (username && password.length >= 6) {
            appState.currentUser = {
                username: username,
                loginTime: new Date()
            };
            
            updateUserInitials(username);
            switchScreen(elements.loginScreen, elements.dashboardScreen);
            showToast(`¡Bienvenido, ${username}!`, 'success');
            
            elements.loginForm.reset();
        } else {
            showToast('Usuario o contraseña inválidos', 'error');
        }
    }

    function togglePassword() {
        if (!elements) return;
        
        const type = elements.passwordInput.type === 'password' ? 'text' : 'password';
        elements.passwordInput.type = type;
        elements.togglePasswordBtn.classList.toggle('active');
    }

    // ===========================================
    // LOGOUT
    // ===========================================

    function handleLogout() {
        if (!elements) return;
        
        appState.currentUser = null;
        switchScreen(elements.dashboardScreen, elements.loginScreen);
        showToast('Sesión cerrada exitosamente', 'success');
    }

    // ===========================================
    // MODAL
    // ===========================================

    function openRechargeModal(service) {
        if (!elements) return;
        
        // Configurar header del modal
        elements.modalServiceLogo.className = `modal-service-logo ${service.logoClass}`;
        elements.modalServiceLogo.style.background = service.gradient;
        elements.modalServiceLogo.textContent = service.name;
        elements.modalServiceName.textContent = `Recarga ${service.name}`;
        
        // Configurar campo de entrada según el servicio
        const serviceNumberLabel = document.getElementById('serviceNumberLabel');
        const serviceNumberInput = document.getElementById('serviceNumber');
        const serviceNumberIcon = document.getElementById('serviceNumberIcon');
        
        if (serviceNumberLabel && serviceNumberInput && serviceNumberIcon) {
            serviceNumberLabel.textContent = service.inputLabel;
            serviceNumberInput.placeholder = service.inputPlaceholder;
            serviceNumberInput.type = service.inputType;
            serviceNumberInput.value = '';
            
            // Actualizar el icono
            serviceNumberIcon.innerHTML = getIconSVG(service.inputIcon);
        }
        
        // Resetear formulario
        elements.rechargeForm.reset();
        elements.customAmountGroup.style.display = 'none';
        appState.selectedAmount = null;
        appState.isCustomAmount = false;
        updateSummary(0);
        
        // Remover clase active de todos los botones de monto
        elements.amountBtns.forEach(btn => btn.classList.remove('active'));
        
        // Mostrar modal
        elements.rechargeModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            if (serviceNumberInput) serviceNumberInput.focus();
        }, 100);
    }

    function closeRechargeModal() {
        if (!elements) return;
        
        elements.rechargeModal.classList.remove('active');
        document.body.style.overflow = '';
        appState.currentService = null;
    }

    function handleServiceClick(e) {
        const card = e.target.closest('.service-card');
        if (!card) return;
        
        const serviceType = card.dataset.service;
        const service = servicesConfig[serviceType];
        
        if (service) {
            appState.currentService = serviceType;
            openRechargeModal(service);
        }
    }

    // ===========================================
    // SELECCIÓN DE MONTO
    // ===========================================

    function handleAmountSelection(e) {
        if (!e.target.classList.contains('amount-btn')) return;
        
        const amount = e.target.dataset.amount;
        
        elements.amountBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        if (amount === 'custom') {
            elements.customAmountGroup.style.display = 'block';
            elements.customAmount.focus();
            appState.isCustomAmount = true;
            appState.selectedAmount = null;
            updateSummary(0);
        } else {
            elements.customAmountGroup.style.display = 'none';
            appState.isCustomAmount = false;
            appState.selectedAmount = parseInt(amount);
            updateSummary(appState.selectedAmount);
        }
    }

    function handleCustomAmountInput(e) {
        const value = parseInt(e.target.value);
        
        if (value && value > 0) {
            appState.selectedAmount = value;
            updateSummary(value);
        } else {
            appState.selectedAmount = null;
            updateSummary(0);
        }
    }

    // ===========================================
    // ENVÍO DE RECARGA
    // ===========================================

    function handleRechargeSubmit(e) {
        e.preventDefault();
        
        if (!elements) return;
        
        const serviceNumberInput = document.getElementById('serviceNumber');
        const serviceValue = serviceNumberInput ? serviceNumberInput.value : '';
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        if (!serviceValue || serviceValue.length < 6) {
            showToast('Ingresá un número válido', 'error');
            return;
        }
        
        if (!appState.selectedAmount || appState.selectedAmount <= 0) {
            showToast('Seleccioná un monto válido', 'error');
            return;
        }
        
        // Abrir la pasarela correspondiente según el método de pago
        if (paymentMethod === 'card') {
            openPaymentGateway();
        } else if (paymentMethod === 'wallet') {
            openWalletGateway();
        } else if (paymentMethod === 'bank') {
            openBankGateway();
        }
    }

    function openPaymentGateway() {
        if (!elements) return;
        
        const service = servicesConfig[appState.currentService];
        const { total } = calculateTotal(appState.selectedAmount);
        
        // Configurar resumen de pago
        elements.paymentServiceName.textContent = service.name;
        elements.paymentAmount.textContent = `$${appState.selectedAmount}`;
        elements.paymentTotal.textContent = `$${total}`;
        
        // Limpiar formulario
        elements.paymentGatewayForm.reset();
        
        // Cerrar modal de recarga y abrir pasarela
        closeRechargeModal();
        
        setTimeout(() => {
            elements.paymentGatewayModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                if (elements.cardNumber) elements.cardNumber.focus();
            }, 100);
        }, 300);
    }

    function closePaymentGateway() {
        if (!elements) return;
        
        elements.paymentGatewayModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openWalletGateway() {
        if (!elements) return;
        
        const service = servicesConfig[appState.currentService];
        const { total } = calculateTotal(appState.selectedAmount);
        
        // Configurar resumen de pago
        elements.walletServiceName.textContent = service.name;
        elements.walletAmount.textContent = `$${appState.selectedAmount}`;
        elements.walletTotal.textContent = `$${total}`;
        
        // Limpiar formulario
        elements.walletGatewayForm.reset();
        
        // Cerrar modal de recarga y abrir pasarela
        closeRechargeModal();
        
        setTimeout(() => {
            elements.walletGatewayModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                if (elements.walletEmail) elements.walletEmail.focus();
            }, 100);
        }, 300);
    }

    function closeWalletGateway() {
        if (!elements) return;
        
        elements.walletGatewayModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openBankGateway() {
        if (!elements) return;
        
        const service = servicesConfig[appState.currentService];
        const { total } = calculateTotal(appState.selectedAmount);
        
        // Configurar resumen de pago
        elements.bankServiceName.textContent = service.name;
        elements.bankAmount.textContent = `$${appState.selectedAmount}`;
        elements.bankTotal.textContent = `$${total}`;
        
        // Limpiar formulario
        elements.bankGatewayForm.reset();
        
        // Cerrar modal de recarga y abrir pasarela
        closeRechargeModal();
        
        setTimeout(() => {
            elements.bankGatewayModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                if (elements.cbuCvu) elements.cbuCvu.focus();
            }, 100);
        }, 300);
    }

    function closeBankGateway() {
        if (!elements) return;
        
        elements.bankGatewayModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ===========================================
    // PASARELA DE PAGO
    // ===========================================

    function formatCardNumber(value) {
        // Eliminar espacios y caracteres no numéricos
        const cleaned = value.replace(/\D/g, '');
        // Agregar espacio cada 4 dígitos
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        return formatted;
    }

    function formatExpiryDate(value) {
        // Eliminar caracteres no numéricos
        const cleaned = value.replace(/\D/g, '');
        // Agregar / después de 2 dígitos
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        return cleaned;
    }

    function handlePaymentSubmit(e) {
        e.preventDefault();
        
        if (!elements) return;
        
        const cardNumber = elements.cardNumber.value.replace(/\s/g, '');
        const expiryDate = elements.expiryDate.value;
        const cvv = elements.cvv.value;
        const dni = elements.dni.value;
        const email = elements.emailInput.value;
        
        // Validaciones básicas
        if (cardNumber.length < 15 || cardNumber.length > 16) {
            showToast('Número de tarjeta inválido', 'error');
            return;
        }
        
        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
            showToast('Fecha de vencimiento inválida', 'error');
            return;
        }
        
        if (cvv.length < 3 || cvv.length > 4) {
            showToast('CVV inválido', 'error');
            return;
        }
        
        if (dni.length < 7) {
            showToast('DNI inválido', 'error');
            return;
        }
        
        if (!email.includes('@')) {
            showToast('Email inválido', 'error');
            return;
        }
        
        // Procesar pago
        showToast('Procesando pago...', 'success');
        
        setTimeout(() => {
            const { total } = calculateTotal(appState.selectedAmount);
            const service = servicesConfig[appState.currentService];
            
            closePaymentGateway();
            
            showToast(
                `¡Pago exitoso! ${service.name} - $${total}`,
                'success'
            );
            
            appState.selectedAmount = null;
            appState.isCustomAmount = false;
        }, 2500);
    }

    function handleWalletSubmit(e) {
        e.preventDefault();
        
        if (!elements) return;
        
        const walletEmail = elements.walletEmail.value;
        const walletDni = elements.walletDni.value;
        const walletPhone = elements.walletPhone.value;
        
        // Validaciones básicas
        if (!walletEmail.includes('@')) {
            showToast('Email inválido', 'error');
            return;
        }
        
        if (walletDni.length < 7) {
            showToast('DNI inválido', 'error');
            return;
        }
        
        if (walletPhone.length < 8) {
            showToast('Teléfono inválido', 'error');
            return;
        }
        
        // Procesar pago
        showToast('Procesando pago...', 'success');
        
        setTimeout(() => {
            const { total } = calculateTotal(appState.selectedAmount);
            const service = servicesConfig[appState.currentService];
            
            closeWalletGateway();
            
            showToast(
                `¡Pago exitoso! ${service.name} - $${total}`,
                'success'
            );
            
            appState.selectedAmount = null;
            appState.isCustomAmount = false;
        }, 2500);
    }

    function handleBankSubmit(e) {
        e.preventDefault();
        
        if (!elements) return;
        
        const cbuCvu = elements.cbuCvu.value;
        const accountHolder = elements.accountHolder.value;
        const bankDni = elements.bankDni.value;
        const bankEmail = elements.bankEmail.value;
        
        // Validaciones básicas
        if (cbuCvu.length < 20 || cbuCvu.length > 22) {
            showToast('CBU/CVU inválido', 'error');
            return;
        }
        
        if (accountHolder.length < 3) {
            showToast('Nombre del titular inválido', 'error');
            return;
        }
        
        if (bankDni.length < 7) {
            showToast('DNI inválido', 'error');
            return;
        }
        
        if (!bankEmail.includes('@')) {
            showToast('Email inválido', 'error');
            return;
        }
        
        // Procesar pago
        showToast('Procesando transferencia...', 'success');
        
        setTimeout(() => {
            const { total } = calculateTotal(appState.selectedAmount);
            const service = servicesConfig[appState.currentService];
            
            closeBankGateway();
            
            showToast(
                `¡Transferencia exitosa! ${service.name} - $${total}`,
                'success'
            );
            
            appState.selectedAmount = null;
            appState.isCustomAmount = false;
        }, 2500);
    }

    // ===========================================
    // EFECTOS Y ANIMACIONES
    // ===========================================

    function handleMouseMove(e) {
        if (!elements || !elements.loginScreen.classList.contains('active')) return;
        
        const mouseX = (e.clientX / window.innerWidth) - 0.5;
        const mouseY = (e.clientY / window.innerHeight) - 0.5;
        
        const shapes = document.querySelectorAll('.shape');
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;
            const x = mouseX * 50 * speed;
            const y = mouseY * 50 * speed;
            
            shape.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    function handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            if (elements.dashboardScreen.classList.contains('active')) {
                handleLogout();
            }
        }
        
        if (e.key === 'Escape') {
            if (elements.paymentGatewayModal.classList.contains('active')) {
                closePaymentGateway();
            } else if (elements.walletGatewayModal.classList.contains('active')) {
                closeWalletGateway();
            } else if (elements.bankGatewayModal.classList.contains('active')) {
                closeBankGateway();
            } else if (elements.rechargeModal.classList.contains('active')) {
                closeRechargeModal();
            }
        }
    }

    // ===========================================
    // INICIALIZACIÓN
    // ===========================================

    function initElements() {
        elements = {
            // Screens
            loginScreen: document.getElementById('loginScreen'),
            dashboardScreen: document.getElementById('dashboardScreen'),
            
            // Login
            loginForm: document.getElementById('loginForm'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
            togglePasswordBtn: document.querySelector('.toggle-password'),
            
            // Dashboard
            logoutBtn: document.getElementById('logoutBtn'),
            userInitials: document.getElementById('userInitials'),
            servicesGrid: document.getElementById('servicesGrid'),
            
            // Modal
            rechargeModal: document.getElementById('rechargeModal'),
            closeModalBtn: document.getElementById('closeModal'),
            rechargeForm: document.getElementById('rechargeForm'),
            modalServiceLogo: document.getElementById('modalServiceLogo'),
            modalServiceName: document.getElementById('modalServiceName'),
            
            // Recharge Form
            serviceNumber: document.getElementById('serviceNumber'),
            amountBtns: document.querySelectorAll('.amount-btn'),
            customAmountGroup: document.getElementById('customAmountGroup'),
            customAmount: document.getElementById('customAmount'),
            summaryAmount: document.getElementById('summaryAmount'),
            summaryFee: document.getElementById('summaryFee'),
            summaryTotal: document.getElementById('summaryTotal'),
            
            // Payment Gateway - Card
            paymentGatewayModal: document.getElementById('paymentGatewayModal'),
            closePaymentGateway: document.getElementById('closePaymentGateway'),
            paymentGatewayForm: document.getElementById('paymentGatewayForm'),
            cardNumber: document.getElementById('cardNumber'),
            expiryDate: document.getElementById('expiryDate'),
            cvv: document.getElementById('cvv'),
            dni: document.getElementById('dni'),
            emailInput: document.getElementById('email'),
            paymentServiceName: document.getElementById('paymentServiceName'),
            paymentAmount: document.getElementById('paymentAmount'),
            paymentTotal: document.getElementById('paymentTotal'),
            
            // Payment Gateway - Wallet
            walletGatewayModal: document.getElementById('walletGatewayModal'),
            closeWalletGateway: document.getElementById('closeWalletGateway'),
            walletGatewayForm: document.getElementById('walletGatewayForm'),
            walletEmail: document.getElementById('walletEmail'),
            walletDni: document.getElementById('walletDni'),
            walletPhone: document.getElementById('walletPhone'),
            walletServiceName: document.getElementById('walletServiceName'),
            walletAmount: document.getElementById('walletAmount'),
            walletTotal: document.getElementById('walletTotal'),
            
            // Payment Gateway - Bank
            bankGatewayModal: document.getElementById('bankGatewayModal'),
            closeBankGateway: document.getElementById('closeBankGateway'),
            bankGatewayForm: document.getElementById('bankGatewayForm'),
            cbuCvu: document.getElementById('cbuCvu'),
            accountHolder: document.getElementById('accountHolder'),
            bankDni: document.getElementById('bankDni'),
            bankEmail: document.getElementById('bankEmail'),
            bankServiceName: document.getElementById('bankServiceName'),
            bankAmount: document.getElementById('bankAmount'),
            bankTotal: document.getElementById('bankTotal'),
            
            // Toast
            toast: document.getElementById('toast')
        };
    }

    function attachEventListeners() {
        if (!elements) return;
        
        // Login
        elements.loginForm.addEventListener('submit', handleLogin);
        elements.togglePasswordBtn.addEventListener('click', togglePassword);
        
        // Logout
        elements.logoutBtn.addEventListener('click', handleLogout);
        
        // Services
        elements.servicesGrid.addEventListener('click', handleServiceClick);
        
        // Modal
        elements.closeModalBtn.addEventListener('click', closeRechargeModal);
        elements.rechargeModal.querySelector('.modal-overlay').addEventListener('click', closeRechargeModal);
        elements.rechargeModal.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());
        
        // Amount selection
        elements.amountBtns.forEach(btn => {
            btn.addEventListener('click', handleAmountSelection);
        });
        
        // Custom amount
        elements.customAmount.addEventListener('input', handleCustomAmountInput);
        
        // Service number input - formatear solo números
        const serviceNumberInput = document.getElementById('serviceNumber');
        if (serviceNumberInput) {
            serviceNumberInput.addEventListener('input', (e) => {
                e.target.value = formatPhoneNumber(e.target.value);
                if (e.target.value.length > 20) {
                    e.target.value = e.target.value.slice(0, 20);
                }
            });
        }
        
        // Recharge form
        elements.rechargeForm.addEventListener('submit', handleRechargeSubmit);
        
        // Payment Gateway - Card
        elements.closePaymentGateway.addEventListener('click', closePaymentGateway);
        elements.paymentGatewayModal.querySelector('.modal-overlay').addEventListener('click', closePaymentGateway);
        elements.paymentGatewayModal.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());
        elements.paymentGatewayForm.addEventListener('submit', handlePaymentSubmit);
        
        // Formatear campos de la pasarela - Card
        elements.cardNumber.addEventListener('input', (e) => {
            e.target.value = formatCardNumber(e.target.value);
        });
        
        elements.expiryDate.addEventListener('input', (e) => {
            e.target.value = formatExpiryDate(e.target.value);
        });
        
        elements.cvv.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
        
        elements.dni.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
        
        // Payment Gateway - Wallet
        elements.closeWalletGateway.addEventListener('click', closeWalletGateway);
        elements.walletGatewayModal.querySelector('.modal-overlay').addEventListener('click', closeWalletGateway);
        elements.walletGatewayModal.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());
        elements.walletGatewayForm.addEventListener('submit', handleWalletSubmit);
        
        // Formatear campos de la pasarela - Wallet
        elements.walletDni.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
        
        elements.walletPhone.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
        
        // Payment Gateway - Bank
        elements.closeBankGateway.addEventListener('click', closeBankGateway);
        elements.bankGatewayModal.querySelector('.modal-overlay').addEventListener('click', closeBankGateway);
        elements.bankGatewayModal.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());
        elements.bankGatewayForm.addEventListener('submit', handleBankSubmit);
        
        // Formatear campos de la pasarela - Bank
        elements.cbuCvu.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
        
        elements.bankDni.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
        
        // Social buttons
        document.querySelectorAll('.btn-social').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Próximamente disponible', 'error');
            });
        });
        
        // Links
        document.querySelector('.signup-link a')?.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Próximamente disponible', 'error');
        });
        
        document.querySelector('.forgot-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Próximamente disponible', 'error');
        });
        
        // Global events
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    function checkSavedSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                appState.currentUser = JSON.parse(savedUser);
                updateUserInitials(appState.currentUser.username);
                
                // Ocultar login y mostrar dashboard
                if (elements.loginScreen && elements.dashboardScreen) {
                    elements.loginScreen.style.display = 'none';
                    elements.loginScreen.classList.remove('active');
                    
                    elements.dashboardScreen.style.display = 'block';
                    elements.dashboardScreen.classList.add('active');
                }
            } catch (e) {
                console.error('Error al cargar sesión guardada:', e);
                localStorage.removeItem('currentUser');
            }
        }
    }

    function init() {
        console.log('%c🚀 RecargaPlus', 'color: #0088CC; font-size: 24px; font-weight: bold;');
        console.log('%cPlataforma Argentina de Recargas', 'color: #00A859; font-size: 14px;');
        
        initElements();
        attachEventListeners();
        checkSavedSession();
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();