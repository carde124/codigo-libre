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

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Error inesperado. Inténtalo de nuevo.' });
  }
};
