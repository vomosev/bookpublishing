const DEFAULT_API_BASE_URL =
  'https://bookpublishing-api.geo-drops.com:5084';
const DEFAULT_TIMEOUT_MS = 10000;

const configuredBaseUrl =
  typeof process.env.NEXT_PUBLIC_API_BASE_URL === 'string'
    ? process.env.NEXT_PUBLIC_API_BASE_URL.trim()
    : '';

export const API_BASE_URL = (
  configuredBaseUrl || DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    message,
    {
      status = 0,
      code = 'API_ERROR',
      details = null,
      cause,
    } = {},
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

function buildApiUrl(path) {
  if (typeof path !== 'string' || !path.trim()) {
    throw new ApiError('A valid API path is required.', {
      code: 'INVALID_API_PATH',
    });
  }

  const normalizedPath = path.trim();

  if (/^https?:\/\//i.test(normalizedPath)) {
    throw new ApiError('API requests must use a relative path.', {
      code: 'INVALID_API_PATH',
    });
  }

  return `${API_BASE_URL}${
    normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
  }`;
}

function isNativeRequestBody(body) {
  return (
    typeof body === 'string' ||
    (typeof FormData !== 'undefined' && body instanceof FormData) ||
    (typeof URLSearchParams !== 'undefined' &&
      body instanceof URLSearchParams) ||
    (typeof Blob !== 'undefined' && body instanceof Blob) ||
    (typeof ArrayBuffer !== 'undefined' &&
      (body instanceof ArrayBuffer || ArrayBuffer.isView(body))) ||
    (typeof ReadableStream !== 'undefined' &&
      body instanceof ReadableStream)
  );
}

function prepareBody(body, headers) {
  if (body === undefined || body === null) {
    return body;
  }

  if (isNativeRequestBody(body)) {
    return body;
  }

  try {
    const serializedBody = JSON.stringify(body);

    if (serializedBody === undefined) {
      throw new TypeError('The request body cannot be serialized.');
    }

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return serializedBody;
  } catch (error) {
    throw new ApiError('The request data could not be prepared.', {
      code: 'REQUEST_SERIALIZATION_ERROR',
      cause: error,
    });
  }
}

async function parseResponseBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const appearsToBeJson =
    contentType.includes('application/json') ||
    contentType.includes('+json') ||
    /^[\s]*[\[{]/.test(text);

  if (appearsToBeJson) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

function getErrorMessage(payload, status) {
  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }

    if (
      payload.error &&
      typeof payload.error === 'object' &&
      typeof payload.error.message === 'string' &&
      payload.error.message.trim()
    ) {
      return payload.error.message.trim();
    }
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (status === 401) {
    return 'Please sign in to continue.';
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (status === 404) {
    return 'The requested resource could not be found.';
  }

  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (status >= 500) {
    return 'The publishing service is temporarily unavailable.';
  }

  return 'The request could not be completed.';
}

function getErrorCode(payload, status) {
  if (payload && typeof payload === 'object') {
    if (typeof payload.code === 'string' && payload.code.trim()) {
      return payload.code.trim();
    }

    if (
      payload.error &&
      typeof payload.error === 'object' &&
      typeof payload.error.code === 'string' &&
      payload.error.code.trim()
    ) {
      return payload.error.code.trim();
    }
  }

  return `HTTP_${status}`;
}

export async function apiRequest(path, options = {}) {
  const {
    body,
    headers: providedHeaders,
    signal: externalSignal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    credentials: _ignoredCredentials,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  let timeoutId;
  let timedOut = false;
  let removeExternalAbortListener = null;

  try {
    const url = buildApiUrl(path);
    const headers = new Headers(providedHeaders || {});

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const preparedBody = prepareBody(body, headers);
    const normalizedTimeout =
      Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0
        ? Number(timeoutMs)
        : DEFAULT_TIMEOUT_MS;

    if (externalSignal) {
      const abortFromExternalSignal = () => {
        controller.abort(externalSignal.reason);
      };

      if (externalSignal.aborted) {
        abortFromExternalSignal();
      } else {
        externalSignal.addEventListener('abort', abortFromExternalSignal, {
          once: true,
        });
        removeExternalAbortListener = () => {
          externalSignal.removeEventListener(
            'abort',
            abortFromExternalSignal,
          );
        };
      }
    }

    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, normalizedTimeout);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: preparedBody,
      credentials: 'include',
      signal: controller.signal,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(getErrorMessage(payload, response.status), {
        status: response.status,
        code: getErrorCode(payload, response.status),
        details: payload,
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (timedOut) {
      throw new ApiError(
        'The publishing service took too long to respond. Please try again.',
        {
          code: 'REQUEST_TIMEOUT',
          cause: error,
        },
      );
    }

    if (
      externalSignal?.aborted ||
      error?.name === 'AbortError'
    ) {
      throw new ApiError('The request was cancelled.', {
        code: 'REQUEST_ABORTED',
        cause: error,
      });
    }

    throw new ApiError(
      'Unable to reach the publishing service. Please check your connection and try again.',
      {
        code: 'NETWORK_ERROR',
        cause: error,
      },
    );
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (removeExternalAbortListener) {
      removeExternalAbortListener();
    }
  }
}