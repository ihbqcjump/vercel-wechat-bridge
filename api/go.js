const TRIGGER_SECRET = 'redfox888';
const ORIGIN_URL = process.env.ORIGIN_URL || 'http://8.148.4.186:9090';

module.exports = async (req, res) => {
  const key = req.query.key || '';

  if (key !== TRIGGER_SECRET) {
    res.status(403).send(
      '<html><body style="font-family:sans-serif;text-align:center;padding:40px;">' +
      '<h2>403</h2><p>密钥错误</p></body></html>'
    );
    return;
  }

  const keyword = req.query.kw || '';

  try {
    // 转发到服务器端的 /go 路由
    const url = keyword
      ? `${ORIGIN_URL}/go?key=${TRIGGER_SECRET}&kw=${encodeURIComponent(keyword)}`
      : `${ORIGIN_URL}/go?key=${TRIGGER_SECRET}`;

    const response = await fetch(url, { method: 'GET', timeout: 10000 });
    const body = await response.text();

    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(body);
  } catch (error) {
    console.error('Trigger error:', error.message);
    res.status(502).send(
      '<html><body style="font-family:sans-serif;text-align:center;padding:40px;">' +
      '<h2>502</h2><p>服务器连接失败</p></body></html>'
    );
  }
};
