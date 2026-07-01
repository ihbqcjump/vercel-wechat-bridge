const crypto = require('crypto');

const ORIGIN_URL = process.env.ORIGIN_URL || 'http://8.148.4.186:9090';
const WECHAT_TOKEN = process.env.WECHAT_TOKEN || 'redfox2026';

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
      // Vercel @vercel/node: read raw body for non-JSON content types
      let xmlBody;
      if (typeof req.body === 'string') {
        xmlBody = req.body;
      } else if (req.body && typeof req.body === 'object' && Buffer.isBuffer(req.body)) {
        xmlBody = req.body.toString('utf-8');
      } else if (req.body && typeof req.body === 'object') {
        // Fallback: might be a parsed object or {type:'Buffer',data:[...]}
        if (req.body.type === 'Buffer' && Array.isArray(req.body.data)) {
          xmlBody = Buffer.from(req.body.data).toString('utf-8');
        } else {
          xmlBody = JSON.stringify(req.body);
        }
      } else {
        xmlBody = '';
      }
      
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
