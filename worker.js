function withCORS(res, { origin = '*', requestHeaders } = {}) {
  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (requestHeaders) {
    res.headers.set('Access-Control-Allow-Headers', requestHeaders);
  }
  res.headers.set('Vary', 'Origin');
  if (!res.headers.has('cache-control')) res.headers.set('cache-control', 'no-store');
  return res;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '*';
    const requestHeaders = req.headers.get('Access-Control-Request-Headers');

    // Preflight
    if (req.method === 'OPTIONS') {
      return withCORS(new Response(null, { status: 204 }), { origin, requestHeaders });
    }

    if (url.pathname !== '/api/loc') {
      return withCORS(new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } }), { origin, requestHeaders });
    }

    const t = url.searchParams.get('t') || url.searchParams.get('token');
    if (!t) {
      return withCORS(new Response('Missing token', { status: 400, headers: { 'content-type': 'text/plain' } }), { origin, requestHeaders });
    }

    const item = await env.LOCATIONS.get(t, { type: 'json' });
    if (!item) {
      return withCORS(new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } }), { origin, requestHeaders });
    }

    return withCORS(new Response(JSON.stringify(item), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    }), { origin, requestHeaders });
  }
}
