export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { ...corsHeaders(), 'allow': 'GET, OPTIONS' },
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/api/loc') {
      return new Response('Not found', { status: 404 });
    }

    const token = url.searchParams.get('t') || url.searchParams.get('token');
    if (!token) {
      return new Response('Missing token', { status: 400, headers: corsHeaders() });
    }

    if (!/^[A-Za-z0-9_-]{12,64}$/.test(token)) {
      return new Response('Invalid token', { status: 400, headers: corsHeaders() });
    }

    let item;
    try {
      item = await env.LOCATIONS.get(token, { type: 'json' });
    } catch (err) {
      console.error('KV get failed', err);
      return new Response('Storage error', { status: 502, headers: corsHeaders() });
    }

    if (!item) {
      return new Response('Not found', { status: 404, headers: corsHeaders() });
    }

    const body = JSON.stringify(item);
    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  },
};

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  };
}
