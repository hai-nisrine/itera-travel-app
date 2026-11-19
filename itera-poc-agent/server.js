import http from 'node:http';
import { createDraft, recommend } from './agent.js';
import {travelers,trips} from './traveler/core.js';

const port = Number(process.env.PORT || 3000);
const send = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/api/fixtures') return send(res, 200, { travelers, trips });
    if (req.method !== 'POST' || !['/api/listing', '/api/match'].includes(req.url)) return send(res, 404, { error: 'Not found' });
    try {
        let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 100000) throw Error('Request too large'); }
        const body = JSON.parse(raw);
        if (req.url === '/api/listing') return send(res, 200, await createDraft(body.history));
        return send(res, 200, await recommend(body.profile, { useAI: body.useAI !== false }));
    } catch (e) { return send(res, 400, { error: e.message }); }
}).listen(port, '127.0.0.1', () => console.log('Itera PoC listening on http://localhost:' + port));
