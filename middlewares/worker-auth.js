require('dotenv').config();

module.exports = function workerAuth(request, response, next) {
  const key = request.headers['x-worker-key'];

  if (key && key === process.env.WORKER_AUTH_KEY) {
    return next();
  }

  return response.status(401).json({
    error: 'Unauthorized worker'
  });
};
