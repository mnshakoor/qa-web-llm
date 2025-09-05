# LLM Web By Quanta Analytica

A lightweight, Ollama-style chat UI you can host on GitHub Pages that talks to:
1) On-device WebLLM via WebGPU  
2) Hugging Face Inference API through a Cloudflare Worker proxy  
3) Google AI Studio Gemini API through the same proxy

## Why this design

- GitHub Pages is static, so you cannot safely keep provider keys in the client.  
- The Worker keeps keys server-side and sets CORS so the browser app can call it.  
- WebLLM gives you a local option that runs completely on device when WebGPU is available.

## Files

- `index.html` — Single page app for chat with backend selector, streaming for WebLLM, JSON export, and simple UI controls.  
- `worker.js` — Cloudflare Worker proxy for Hugging Face and Google.  
- `README.md` — These instructions.

## Deploy

### 1) GitHub Pages

1. Create a public repo, add `index.html` and `README.md`.  
2. Settings → Pages → Source: Deploy from branch → set root.  
3. Visit your Pages URL to use the app.

### 2) Cloudflare Worker proxy

1. In Cloudflare dashboard, Workers → Create.  
2. Paste `worker.js`.  
3. Add environment variables:
   - `HF_TOKEN` — your Hugging Face API token
   - `GEMINI_API_KEY` — your Google AI Studio API key
4. Deploy and note the Worker URL:
   - `https://your-worker…/hf`
   - `https://your-worker…/google`

### 3) Configure the app

- Open your Pages app, choose backend in the left sidebar.  
- For Hugging Face: enter a model id, for example `meta-llama/Llama-3.1-8B-Instruct`, and paste your `/hf` proxy URL.  
- For Google: enter model `gemini-1.5-pro` or your chosen variant, and paste your `/google` proxy URL.  
- For WebLLM: pick a local model like `Llama-3.2-1B-Instruct-q4f16_1`. First load takes time while assets cache.

## Usage

- Write in the prompt box and press Send.  
- System prompt sets behavioral constraints.  
- Temperature controls randomness.  
- Max tokens caps output length.  
- Export saves the chat to JSON. Clear resets the session.

## Security

- Never expose provider keys in the client.  
- Use the Worker to terminate TLS and inject `Authorization`.  
- Consider origin allowlists in CORS if you want to restrict who can use the proxy.  
- Rotate keys and monitor usage.

## Notes on models

- WebLLM supports a selection of compact models that can run in browser with quantization. Performance depends on GPU, memory, and model size.  
- Hugging Face Inference API expects `inputs` plus optional `parameters`.  
- Google AI Studio expects `contents` with `role` and `parts`.

## Optional enhancements

- Add SSE streaming in the Worker for HF backends that support it.  
- Add a local Ollama mode that hits `http://localhost:11434` if you run Ollama on your machine and enable CORS.  
- Add conversation save-load workspaces and prompt presets.  
- Add file upload and function-calling handlers for structured tools.
