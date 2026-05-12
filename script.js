// MODAL FUNCTIONALITY
const modal = document.getElementById('privacidad');
const privacyLink = document.querySelector('.privacy-link');
const closeBtn = document.querySelector('.close');

privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// SMOOTH SCROLLING
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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

// CONTACT FORM
const contactForm = document.querySelector('.contacto-form');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = contactForm.querySelector('input[type="text"]').value;
    const email = contactForm.querySelector('input[type="email"]').value;
    const message = contactForm.querySelector('textarea').value;

    if (name && email && message) {
        alert('¡Mensaje enviado correctamente! Te contactaremos pronto.');
        contactForm.reset();
    } else {
        alert('Por favor completa todos los campos.');
    }
});

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
