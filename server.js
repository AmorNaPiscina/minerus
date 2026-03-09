const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const DATACISS_API_URL = process.env.DATACISS_API_URL || 'https://api.dataciss.example/notas';
const DATACISS_API_TOKEN = process.env.DATACISS_API_TOKEN || '';

const products = {
  'pao-frances': { name: 'Pão Francês', ncm: '1905.90.90', price: 1.2 },
  'pao-de-queijo': { name: 'Pão de Queijo', ncm: '1905.90.90', price: 2.5 },
  'bolo-de-fuba': { name: 'Bolo de Fubá', ncm: '1905.90.90', price: 18.0 },
  'sanduiche-natural': { name: 'Sanduíche Natural', ncm: '1602.32.10', price: 14.0 },
  'torta-de-frango': { name: 'Torta de Frango', ncm: '1905.90.90', price: 32.0 }
};

const orders = [];
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

async function sendToDataCiss(order) {
  const payload = {
    pedido_id: order.id,
    cliente: order.customerName,
    uf: order.state,
    itens: [{
      codigo: order.productId,
      descricao: order.productName,
      ncm: order.ncm,
      quantidade: order.quantity,
      valor_unitario: order.unitPrice,
      valor_total: order.total
    }],
    valor_total: order.total
  };

  if (!DATACISS_API_TOKEN || DATACISS_API_URL.includes('example')) {
    return { status: 'pending', message: 'Integração DataCiss não configurada (modo desenvolvimento).' };
  }

  const response = await fetch(DATACISS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DATACISS_API_TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro DataCiss: ${response.status} - ${text}`);
  }

  return { status: 'sent', data: await response.json() };
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        reject(new Error('Payload muito grande.'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/api/orders') {
    let payload;
    try {
      const rawBody = await collectBody(req);
      payload = JSON.parse(rawBody || '{}');
    } catch {
      return sendJson(res, 400, { error: 'JSON inválido.' });
    }

    const { customerName, phone, productId, quantity, state } = payload;
    if (!customerName || !phone || !productId || !quantity || !state) {
      return sendJson(res, 400, { error: 'Dados obrigatórios ausentes.' });
    }
    if (state !== 'PR') {
      return sendJson(res, 422, { error: 'A Mineiru\'s atende somente pedidos do Paraná (PR).' });
    }

    const product = products[productId];
    const parsedQuantity = Number(quantity);
    if (!product) return sendJson(res, 400, { error: 'Produto inválido.' });
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return sendJson(res, 400, { error: 'Quantidade inválida.' });
    }

    const order = {
      id: orders.length + 1,
      customerName,
      phone,
      productId,
      productName: product.name,
      ncm: product.ncm,
      unitPrice: product.price,
      quantity: parsedQuantity,
      total: Number((product.price * parsedQuantity).toFixed(2)),
      state,
      createdAt: new Date().toISOString()
    };

    try {
      const dataciss = await sendToDataCiss(order);
      order.invoiceStatus = dataciss.status;
      order.dataciss = dataciss;
      orders.push(order);
      return sendJson(res, 201, { message: 'Pedido criado com sucesso.', order });
    } catch (error) {
      return sendJson(res, 502, { error: `Pedido criado, mas a integração DataCiss falhou: ${error.message}` });
    }
  }

  if (req.method === 'GET' && pathname === '/api/orders') {
    return sendJson(res, 200, { orders });
  }

  if (req.method === 'GET' && pathname === '/api/dataciss/health') {
    const configured = Boolean(DATACISS_API_TOKEN) && !DATACISS_API_URL.includes('example');
    return sendJson(res, 200, {
      configured,
      datacissApiUrl: DATACISS_API_URL,
      message: configured
        ? 'Integração DataCiss configurada e pronta para emissão fiscal.'
        : 'Configure DATACISS_API_URL e DATACISS_API_TOKEN para emissão fiscal em produção.'
    });
  }

  return false;
}

function serveStatic(res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(__dirname, safePath);
  if (!fullPath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Página não encontrada');
      return;
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const handled = await handleApi(req, res, url.pathname);
  if (handled !== false) return;
  serveStatic(res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Mineiru's rodando em http://localhost:${PORT}`);
});
