const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
  });

  app.use(
    '/lovejs',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      pathRewrite: {
        '^/lovejs': '',
      },
      onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['Cross-Origin-Opener-Policy'] = 'same-origin';
        proxyRes.headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
        proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
      }
    })
  );
};