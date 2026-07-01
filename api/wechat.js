const crypto = require('crypto');

const ORIGIN_URL = process.env.ORIGIN_URL || 'http://8.148.4.186:9090';
const WECHAT_TOKEN = process.env.WECHAT_TOKEN || 'redfox2026';

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function verifySignature(signature, timestamp, nonce) {
  const items = [WECHAT_TOKEN, timestamp, nonce].sort();
  const joined = items.join('');
  const hash = crypto.createHash('sha1').update(joined).digest('hex');
  return hash === signature;
}

module.exports = async (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  // GET: 微信服务器验证
  if (req.method === 'GET') {
    const isValid = verifySignature(signature, timestamp, nonce);
    if (isValid) {
      res.status(200).send(echostr);
    } else {
      res.status(403).send('Forbidden');
    }
    return;
  }

  // POST: 转发微信消息到源站
  if (req.method === 'POST') {
    try {
      const xmlBody = await getRawBody(req);
      
      const response = await fetch(`${ORIGIN_URL}/wechat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'User-Agent': 'Vercel-Function/RedFox',
        },
        body: xmlBody,
      });

      const responseBody = await response.text();
      res.status(response.status).setHeader('Content-Type', 'application/xml').send(responseBody);
    } catch (error) {
      console.error('Forward error:', error.message);
      res.status(502).send('Bad Gateway');
    }
    return;
  }

  res.status(405).send('Method Not Allowed');
};
