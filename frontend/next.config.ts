// frontend/next.config.js
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*", // Assuming backend is on port 3001
      },
    ];
  },
};
