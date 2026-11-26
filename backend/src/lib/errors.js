class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status =
    error.statusCode ||
    (error.type === 'entity.parse.failed'
      ? 400
      : error.type === 'entity.too.large'
        ? 413
        : error.code === 'P2002' || error.code === 'P2034'
          ? 409
          : 500);
  const message =
    status < 500 && error instanceof HttpError
      ? error.message
      : status === 400
        ? 'Ungültiges JSON.'
        : status === 409
          ? 'Datenkonflikt. Bitte erneut laden.'
          : 'Serveranfrage fehlgeschlagen.';
  if (status >= 500)
    console.error('Request failed:', error.code || error.name || 'Error');
  res
    .status(status)
    .json({ error: status < 500 ? 'REQUEST_ERROR' : 'SERVER_ERROR', message });
}
module.exports = { HttpError, asyncRoute, errorHandler };
