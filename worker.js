export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '*';

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (url.pathname === '/hf' && req.method === 'POST') {
      const body = await req.json();
      const model = body.model;
      const inputs = body.inputs;
      const parameters = body.parameters || {};
      if (!env.HF_TOKEN) return json({ error: 'HF token not configured' }, 500, origin);
      if (!model || !inputs) return json({ error: 'Missing model or inputs' }, 400, origin);

      const hf = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs, parameters })
      });
      const data = await hf.json();
      // Normalize to { text }
      let text = '';
      if (Array.isArray(data) && data[0]?.generated_text) text = data[0].generated_text;
      if (typeof data.generated_text === 'string') text = data.generated_text;
      return json({ text, raw: data }, hf.ok ? 200 : 500, origin);
    }

    if (url.pathname === '/google' && req.method === 'POST') {
      if (!env.GEMINI_API_KEY) return json({ error: 'Gemini API key not configured' }, 500, origin);
      const body = await req.json();
      const model = body.model || 'gemini-1.5-pro';
      const payload = {
        contents: body.contents || [],
        generationConfig: body.generationConfig || {}
      };
      const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await g.json();
      let text = '';
      try {
        text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      } catch {}
      return json({ text, raw: data }, g.ok ? 200 : 500, origin);
    }

    return json({ error: 'Route not found' }, 404, origin);
  }
}

function corsHeaders(origin){
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
function json(data, status = 200, origin='*'){
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
  });
}
