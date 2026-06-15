// MODAL FUNCTIONALITY (generic)
document.querySelectorAll('.modal-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (!href) return;
        const id = href.replace('#', '');
        const modal = document.getElementById(id);
        if (modal && modal.classList.contains('modal')) {
            modal.style.display = 'block';
        } else {
            // fallback: smooth scroll to section
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// close buttons for any modal (.close or .modal-close)
function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
}
document.querySelectorAll('.close, .modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal');
        closeModal(modal);
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});

// SMOOTH SCROLLING (skip modal links)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    if (anchor.classList.contains('modal-link')) return;
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// HAMBURGER MENU
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
});

// CONTACT FORM (with RGPD consent validation)
const contactForm = document.querySelector('.contacto-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = contactForm.querySelector('input[type="text"]').value.trim();
        const email = contactForm.querySelector('input[type="email"]').value.trim();
        const message = contactForm.querySelector('textarea').value.trim();
        const consentEl = document.getElementById('rgpd-consent');

        if (!name || !email || !message) {
            alert('Por favor completa todos los campos.');
            return;
        }

        if (!consentEl || !consentEl.checked) {
            alert('Debes leer y aceptar la Política de Privacidad para enviar el formulario.');
            consentEl && consentEl.focus();
            return;
        }

        // Aquí iría la lógica real de envío (fetch/post). Actualmente simulamos éxito.
        alert('¡Mensaje enviado correctamente! Te contactaremos pronto.');
        contactForm.reset();
    });
}

// ANIMACIONES DE ENTRADA PARA NUEVAS SECCIONES
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Aplicar animaciones a las nuevas secciones
document.querySelectorAll('.beneficio-card, .proceso-step, .feature-item').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Animación especial para estadísticas
document.querySelectorAll('.stat-number').forEach(stat => {
    const target = parseInt(stat.textContent.replace(/\D/g, ''));
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            stat.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            stat.textContent = Math.floor(current).toLocaleString();
        }
    }, 20);
});

// NAVBAR ACTIVE STATE
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.boxShadow = '0 5px 30px rgba(0, 255, 255, 0.2)';
    } else {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 255, 255, 0.1)';
    }
});

// BOTÓN ESPECIAL - REVELAR SECCIÓN OCULTA
const seccionEspecial = document.getElementById('seccion-especial');

const btnSpecial = document.getElementById('btn-special');

btnSpecial && btnSpecial.addEventListener('click', () => {
    if (seccionEspecial.style.display === 'none' || seccionEspecial.style.display === '') {
        seccionEspecial.style.display = 'block';
        seccionEspecial.scrollIntoView({ behavior: 'smooth', block: 'start' });
        btnSpecial.textContent = '✨ Ocultar Especial';
        btnSpecial.style.background = 'linear-gradient(135deg, #ff6b35, #ff4757)';
    } else {
        seccionEspecial.style.display = 'none';
        btnSpecial.textContent = '✨ Descubre lo Especial';
        btnSpecial.style.background = 'linear-gradient(135deg, #ffff00, #ff6b35)';
    }
});

// COOKIE BANNER + DYNAMIC THIRD-PARTY LOADING
(function () {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    const storageKey = 'codigoLibreCookiesConsent';
    const consent = localStorage.getItem(storageKey);

    function enableNonEssentialCookies() {
        // No se cargan widgets de chat ni scripts de terceros sin configuración explícita.
    }

    function setConsent(value) {
        localStorage.setItem(storageKey, value);
        banner.style.display = 'none';
        if (value === 'accepted') enableNonEssentialCookies();
    }

    const acceptBtn = document.getElementById('cookie-accept');
    const rejectBtn = document.getElementById('cookie-reject');
    const configBtn = document.getElementById('cookie-config');

    acceptBtn && acceptBtn.addEventListener('click', () => setConsent('accepted'));
    rejectBtn && rejectBtn.addEventListener('click', () => setConsent('rejected'));
    configBtn && configBtn.addEventListener('click', () => {
        // abrir modal de cookies para configuración
        const modal = document.getElementById('cookies');
        if (modal) modal.style.display = 'block';
    });

    if (!consent) {
        banner.style.display = 'block';
    } else if (consent === 'accepted') {
        enableNonEssentialCookies();
    } else {
        banner.style.display = 'none';
    }
})();

// CHAT WIDGET
const chatToggle = document.getElementById('chat-toggle');
const chatClose = document.getElementById('chat-close');
const chatPanel = document.getElementById('chat-panel');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

function openChatPanel() {
    if (!chatPanel) return;
    chatPanel.classList.add('open');
    chatPanel.setAttribute('aria-hidden', 'false');
    chatInput && chatInput.focus();
}

function closeChatPanel() {
    if (!chatPanel) return;
    chatPanel.classList.remove('open');
    chatPanel.setAttribute('aria-hidden', 'true');
}

function appendChatMessage(type, text) {
    if (!chatMessages) return;
    const message = document.createElement('div');
    message.className = `chat-message ${type}`;
    message.textContent = text;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getChatResponse(text) {
    const normalized = text.toLowerCase();
    if (/hola|buenas|hey|hi/.test(normalized)) {
        return '¡Hola! Soy tu asistente de Código Libre. Puedes preguntar por servicios, precios, RGPD o cómo contactar.';
    }
    if (/servicios|ofreces|qué haces|qué hacéis/.test(normalized)) {
        return 'Ofrecemos soluciones de IA, chatbots inteligentes, análisis predictivo, automatización y consultoría personalizada.';
    }
    if (/precio|tarifa|coste|cuesta/.test(normalized)) {
        return 'Nuestros precios dependen del proyecto. Cuéntame tu idea y te daré una orientación personalizada.';
    }
    if (/rgpd|privacidad|datos|protección/.test(normalized)) {
        return 'Tus datos solo se usan para responderte. Consulta nuestra Política de Privacidad en el sitio para más detalles.';
    }
    if (/whatsapp|contacto|tel[eé]fono/.test(normalized)) {
        return 'Puedes contactarnos por WhatsApp en +34 665 59 46 51 o enviando un mensaje con el formulario de contacto.';
    }
    return 'Gracias por tu pregunta. Te responderemos lo antes posible con más información.';
}

chatToggle && chatToggle.addEventListener('click', openChatPanel);
chatClose && chatClose.addEventListener('click', closeChatPanel);
chatForm && chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;
    appendChatMessage('user', text);
    chatInput.value = '';
    setTimeout(() => {
        appendChatMessage('bot', getChatResponse(text));
    }, 500);
});
