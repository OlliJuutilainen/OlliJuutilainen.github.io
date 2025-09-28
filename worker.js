function withCORS(res, origin = '*') {
  res.headers.set('access-control-allow-origin', origin);
  res.headers.set('access-control-allow-methods', 'GET,OPTIONS');
  res.headers.set('access-control-allow-headers', '*');
  if (!res.headers.has('cache-control')) res.headers.set('cache-control', 'no-store');
  return res;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // Preflight
    if (req.method === 'OPTIONS') {
      return withCORS(new Response(null, { status: 204 }));
    }

    if (url.pathname !== '/api/loc') {
      return withCORS(new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } }));
    }

    const t = url.searchParams.get('t') || url.searchParams.get('token');
    if (!t) {
      return withCORS(new Response('Missing token', { status: 400, headers: { 'content-type': 'text/plain' } }));
    }

    const item = await env.LOCATIONS.get(t, { type: 'json' });
    if (!item) {
      return withCORS(new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } }));
    }

    return withCORS(new Response(JSON.stringify(item), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    }));
  }
}
