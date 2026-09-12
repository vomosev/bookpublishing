'use strict';

const { isProduction } = require('../config');

const STATUS_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_SERVER_ERROR',
  501: 'NOT_IMPLEMENTED',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
};

function normalizeStatus(error) {
  const candidate = Number(error && (error.status || error.statusCode));

  if (Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) {
    return candidate;
  }

  return 500;
}

function isMalformedJson(error) {
  return Boolean(
    error &&
      error instanceof SyntaxError &&
      (error.type === 'entity.parse.failed' ||
        (error.status === 400 && Object.prototype.hasOwnProperty.call(error, 'body')))
  );
}

function normalizeCode(error, status) {
  if (
    error &&
    typeof error.code === 'string' &&
    /^[A-Z][A-Z0-9_]{1,49}$/.test(error.code)
  ) {
    return error.code;
  }

  return STATUS_CODES[status] || (status >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR');
}

function safeMessage(error, status) {
  if (status >= 500 && isProduction) {
    return 'An unexpected server error occurred.';
  }

  if (error && typeof error.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return status >= 500
    ? 'An unexpected server error occurred.'
    : 'The request could not be completed.';
}

function logServerFailure(error, request, status) {
  if (status < 500) {
    return;
  }

  const context = {
    status,
    method: request && request.method,
    path: request && (request.path || request.url),
    errorName: error && error.name ? error.name : 'Error',
  };

  if (isProduction) {
    console.error('Unhandled server error', context);
    return;
  }

  console.error('Unhandled server error', {
    ...context,
    message: error && error.message,
    stack: error && error.stack,
  });
}

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (isMalformedJson(error)) {
    return response.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains malformed JSON.',
      },
    });
  }

  const status = normalizeStatus(error);
  logServerFailure(error, request, status);

  const payload = {
    error: {
      code: normalizeCode(error, status),
      message: safeMessage(error, status),
    },
  };

  if (!isProduction && status >= 500 && error && error.stack) {
    payload.error.stack = error.stack;
  }

  return response.status(status).json(payload);
}

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;