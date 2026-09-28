/**
 * PLOT360 Frontend API Client
 * Centralized fetch wrapper with Bearer token authentication, error classification,
 * silent token refresh, and graceful backend-offline detection.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const ErrorTypes = {
  BACKEND_UNAVAILABLE: 'BACKEND_UNAVAILABLE',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  BACKEND_DATA_ERROR: 'BACKEND_DATA_ERROR'
};

export class ApiError extends Error {
  constructor(message, errorType, status = 0, details = null, requestId = null) {
    super(message);
    this.name = 'ApiError';
    this.errorType = errorType;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

// Token storage helpers
export function getAccessToken() {
  return localStorage.getItem('plot360_access_token');
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem('plot360_access_token', token);
  } else {
    localStorage.removeItem('plot360_access_token');
  }
}

export function getRefreshToken() {
  return localStorage.getItem('plot360_refresh_token');
}

export function setRefreshToken(token) {
  if (token) {
    localStorage.setItem('plot360_refresh_token', token);
  } else {
    localStorage.removeItem('plot360_refresh_token');
  }
}

/**
 * Generic request dispatcher
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 Unauthorized (attempt refresh once if available)
    if (res.status === 401 && !options._isRetry) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            setAccessToken(data.access_token);
            return apiRequest(endpoint, { ...options, _isRetry: true });
          }
        } catch (_) {
          setAccessToken(null);
          setRefreshToken(null);
        }
      }
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      let errorType = ErrorTypes.BACKEND_DATA_ERROR;
      if (res.status === 401) errorType = ErrorTypes.AUTHENTICATION_ERROR;
      else if (res.status === 403) errorType = ErrorTypes.PERMISSION_DENIED;
      else if (res.status === 404) errorType = ErrorTypes.RESOURCE_NOT_FOUND;
      else if (res.status === 409) errorType = ErrorTypes.CONFLICT_ERROR;
      else if (res.status === 422) errorType = ErrorTypes.VALIDATION_ERROR;

      const message = (data && data.detail) || (data && data.message) || `HTTP error ${res.status}`;
      throw new ApiError(message, errorType, res.status, data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network failure / Connection refused
    throw new ApiError(
      'Backend server is unavailable or offline.',
      ErrorTypes.BACKEND_UNAVAILABLE,
      0,
      err.message
    );
  }
}

export const apiGet = (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options });
export const apiPost = (endpoint, body, options) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body), ...options });
export const apiPut = (endpoint, body, options) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options });
export const apiPatch = (endpoint, body, options) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options });
export const apiDelete = (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options });
