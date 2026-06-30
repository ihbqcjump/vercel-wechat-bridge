module.exports = async (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'RedFox WeChat Bridge (Vercel)',
    time: new Date().toISOString(),
  });
};
