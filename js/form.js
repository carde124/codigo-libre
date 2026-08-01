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

    // No backend is connected in this static build; this simulates the round trip
    // so the confirmation UX can be reviewed end to end.
    setTimeout(function(){
      status.textContent = 'Gracias. Hemos recibido tu solicitud y te responderemos en menos de 24 horas.';
      status.classList.add('is-success');
      submitBtn.disabled = false;
      form.reset();
    }, 900);
  });
})();
