'use strict';

// Endpoint del formulario de contacto (función serverless de Vercel).
// Credenciales SOLO en variables de entorno (Vercel → Settings → Environment Variables):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y, opcional, RATE_LIMIT_SALT.

const crypto = require('crypto');

const ALLOWED_ORIGINS = [
  'https://codigolibresp.com',
  'https://www.codigolibresp.com',
  'https://codigo-libre.vercel.app'
];

const RATE_LIMIT_MAX = 5;          // envíos permitidos…
const RATE_LIMIT_WINDOW_MIN = 10;  // …por IP en esta ventana de minutos

// Primera barrera, en memoria de la instancia (rápida, se pierde al reciclarse).
// La barrera definitiva es la consulta a la base de datos más abajo.
const recentByIp = new Map();

function setCors(res, origin){
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (origin && ALLOWED_ORIGINS.indexOf(origin) !== -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return true;
  }
  // Sin cabecera Origin no hay navegador de por medio: CORS no aplica,
  // y el rate limiting sigue protegiendo contra scripts.
  return !origin;
}

// Sanitización: solo texto plano, sin caracteres de control, longitud acotada.
// (Las inserciones van por la API REST de Supabase con JSON parametrizado,
// así que no se concatena SQL en ningún punto.)
function clean(value, max){
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

// Escapado para el aviso por correo: lo que escribe el visitante nunca debe
// interpretarse como HTML dentro del email.
function esc(value){
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Aviso por correo del nuevo contacto. Nunca lanza: si el envío falla, el
// mensaje ya está guardado en la base de datos y el visitante ve su
// confirmación igualmente.
async function notificarPorEmail(datos){
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { enviado: false, motivo: 'sin RESEND_API_KEY' };

  const destino = process.env.NOTIFY_EMAIL || 'codigolibreesp@gmail.com';
  const remitente = process.env.NOTIFY_FROM || 'Codigo Libre <onboarding@resend.dev>';

  const filas = [
    ['Nombre', datos.nombre],
    ['Correo', datos.email],
    ['Pais', datos.pais],
    ['Empresa', datos.empresa || '-'],
    ['Tipo de proyecto', datos.configuracion || '-']
  ].map(function(f){
    return '<tr>'
      + '<td style="padding:6px 14px 6px 0;color:#8b8f94;white-space:nowrap;">' + esc(f[0]) + '</td>'
      + '<td style="padding:6px 0;color:#111;"><strong>' + esc(f[1]) + '</strong></td>'
      + '</tr>';
  }).join('');

  const html = ''
    + '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;">'
    + '<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#c97b1f;margin:0 0 4px;">Codigo Libre</p>'
    + '<h2 style="margin:0 0 18px;font-size:20px;color:#111;">Nueva solicitud de contacto</h2>'
    + '<table style="border-collapse:collapse;font-size:14px;">' + filas + '</table>'
    + '<p style="margin:22px 0 6px;color:#8b8f94;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Mensaje</p>'
    + '<div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#111;border-left:3px solid #ff9e2c;padding-left:14px;">'
    + esc(datos.mensaje) + '</div>'
    + '<p style="margin-top:26px;font-size:12px;color:#8b8f94;">Responde a este correo para contestar directamente al cliente.</p>'
    + '</div>';

  const texto = 'Nueva solicitud de contacto\n\n'
    + 'Nombre: ' + datos.nombre + '\n'
    + 'Correo: ' + datos.email + '\n'
    + 'Pais: ' + datos.pais + '\n'
    + 'Empresa: ' + (datos.empresa || '-') + '\n'
    + 'Tipo de proyecto: ' + (datos.configuracion || '-') + '\n\n'
    + 'Mensaje:\n' + datos.mensaje + '\n';

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: remitente,
        to: [destino],
        reply_to: datos.email,
        subject: 'Nueva solicitud web: ' + datos.nombre,
        html: html,
        text: texto
      })
    });
    if (!resp.ok){
      const detalle = await resp.text().catch(function(){ return ''; });
      console.error('Aviso por email fallido:', resp.status, detalle.slice(0, 300));
      return { enviado: false, motivo: 'resend ' + resp.status };
    }
    return { enviado: true };
  } catch (e) {
    console.error('Aviso por email fallido:', e && e.message);
    return { enviado: false, motivo: 'excepcion' };
  }
}

module.exports = async function handler(req, res){
  try {
    const origin = req.headers.origin || '';
    const corsOk = setCors(res, origin);

    if (req.method === 'OPTIONS'){
      return res.status(corsOk ? 204 : 403).end();
    }
    if (!corsOk){
      return res.status(403).json({ ok: false, error: 'Origen no permitido.' });
    }
    if (req.method !== 'POST'){
      res.setHeader('Allow', 'POST, OPTIONS');
      return res.status(405).json({ ok: false, error: 'Método no permitido.' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY){
      return res.status(503).json({ ok: false, error: 'El envío aún no está activo.' });
    }

    let body = req.body;
    if (typeof body === 'string'){
      try { body = JSON.parse(body); } catch (e) { body = null; }
    }
    if (!body || typeof body !== 'object'){
      return res.status(400).json({ ok: false, error: 'Solicitud inválida.' });
    }

    // Honeypot: campo invisible que solo rellenan los bots.
    // Se responde como éxito para no darles pistas, pero no se guarda nada.
    if (clean(body.web, 100)){
      return res.status(200).json({ ok: true });
    }

    const nombre = clean(body.nombre, 120);
    const email = clean(body.email, 200).toLowerCase();
    const pais = clean(body.pais, 80);
    const empresa = clean(body.empresa, 120);
    const configuracion = clean(body.configuracion, 40);
    const mensaje = clean(body.mensaje, 4000);

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (nombre.length < 2 || !emailRe.test(email) || pais.length < 2 || mensaje.length < 10){
      return res.status(400).json({ ok: false, error: 'Revisa los campos del formulario.' });
    }

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconocida';
    const salt = process.env.RATE_LIMIT_SALT || 'codigo-libre';
    const ipHash = crypto.createHash('sha256').update(salt + ip).digest('hex');

    const now = Date.now();
    const windowMs = RATE_LIMIT_WINDOW_MIN * 60000;

    // Capa 1: memoria de esta instancia
    const hits = (recentByIp.get(ipHash) || []).filter(function(t){ return now - t < windowMs; });
    if (hits.length >= RATE_LIMIT_MAX){
      return res.status(429).json({ ok: false, error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.' });
    }

    const sbHeaders = {
      apikey: SERVICE_KEY,
      Authorization: 'Bearer ' + SERVICE_KEY,
      'Content-Type': 'application/json'
    };

    // Capa 2: recuento persistente en la base de datos
    const sinceIso = new Date(now - windowMs).toISOString();
    const countUrl = SUPABASE_URL + '/rest/v1/contactos?select=id'
      + '&ip_hash=eq.' + ipHash
      + '&created_at=gt.' + encodeURIComponent(sinceIso);
    const countResp = await fetch(countUrl, {
      headers: Object.assign({}, sbHeaders, { Prefer: 'count=exact', Range: '0-0' })
    });
    if (countResp.ok){
      const range = countResp.headers.get('content-range') || '';
      const total = parseInt(range.split('/')[1], 10);
      if (!isNaN(total) && total >= RATE_LIMIT_MAX){
        return res.status(429).json({ ok: false, error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.' });
      }
    }

    const insertResp = await fetch(SUPABASE_URL + '/rest/v1/contactos', {
      method: 'POST',
      headers: Object.assign({}, sbHeaders, { Prefer: 'return=minimal' }),
      body: JSON.stringify({
        nombre: nombre,
        email: email,
        pais: pais,
        empresa: empresa || null,
        configuracion: configuracion || null,
        mensaje: mensaje,
        ip_hash: ipHash
      })
    });

    if (!insertResp.ok){
      return res.status(502).json({ ok: false, error: 'No se pudo guardar tu mensaje. Inténtalo de nuevo.' });
    }

    hits.push(now);
    recentByIp.set(ipHash, hits);

    // El mensaje ya está guardado. El aviso por correo es un extra:
    // si falla, se registra en los logs pero no se pierde el contacto.
    await notificarPorEmail({
      nombre: nombre,
      email: email,
      pais: pais,
      empresa: empresa,
      configuracion: configuracion,
      mensaje: mensaje
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Error inesperado. Inténtalo de nuevo.' });
  }
};
