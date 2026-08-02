(function(){
  'use strict';

  var form = document.getElementById('contactForm');
  if (!form) return;
  var status = document.getElementById('formStatus');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var validators = {
    fName: function(v){ return v.trim().length >= 2 ? '' : 'Indica tu nombre completo.'; },
    fEmail: function(v){ return emailRe.test(v.trim()) ? '' : 'Introduce un correo electrónico válido.'; },
    fCountry: function(v){ return v.trim().length >= 2 ? '' : 'Indica tu país.'; },
    fCompany: function(){ return ''; },
    fMessage: function(v){ return v.trim().length >= 10 ? '' : 'Cuéntanos un poco más (mínimo 10 caracteres).'; }
  };

  function fieldOf(input){ return input.closest('.field'); }

  function validateField(input){
    var validator = validators[input.id];
    if (!validator) return true;
    var message = validator(input.value);
    var errorEl = document.getElementById('err-' + input.id);
    var field = fieldOf(input);
    if (message){
      field.classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
      input.setAttribute('aria-invalid', 'true');
      return false;
    }
    field.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
    return true;
  }

  Object.keys(validators).forEach(function(id){
    var input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('blur', function(){ validateField(input); });
    input.addEventListener('input', function(){
      if (fieldOf(input).classList.contains('has-error')) validateField(input);
    });
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var ok = true;
    Object.keys(validators).forEach(function(id){
      var input = document.getElementById(id);
      if (input && !validateField(input)) ok = false;
    });

    if (!ok){
      status.textContent = 'Revisa los campos marcados antes de enviar.';
      status.classList.remove('is-success');
      var firstError = form.querySelector('.has-error input, .has-error textarea');
      if (firstError) firstError.focus();
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    status.textContent = 'Enviando…';
    status.classList.remove('is-success');

    var FALLBACK = ' Si el problema continúa, escríbenos a codigolibreesp@gmail.com.';
    var payload = {
      nombre: document.getElementById('fName').value,
      email: document.getElementById('fEmail').value,
      pais: document.getElementById('fCountry').value,
      empresa: document.getElementById('fCompany').value,
      configuracion: document.getElementById('fConfig').value,
      mensaje: document.getElementById('fMessage').value,
      web: (document.getElementById('fWeb') || {}).value || ''
    };

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(resp){
      return resp.json().catch(function(){ return {}; }).then(function(data){
        if (resp.ok && data.ok){
          status.textContent = 'Gracias. Hemos recibido tu solicitud y te responderemos en menos de 24 horas.';
          status.classList.add('is-success');
          form.reset();
        } else if (resp.status === 429){
          status.textContent = 'Has enviado demasiadas solicitudes seguidas. Espera unos minutos e inténtalo de nuevo.';
        } else if (resp.status === 503){
          status.textContent = 'El envío automático aún no está activo. Escríbenos a codigolibreesp@gmail.com y te responderemos igual de rápido.';
        } else {
          status.textContent = (data.error || 'No se pudo enviar tu solicitud.') + FALLBACK;
        }
        submitBtn.disabled = false;
      });
    }).catch(function(){
      status.textContent = 'No se pudo conectar con el servidor.' + FALLBACK;
      submitBtn.disabled = false;
    });
  });
})();
