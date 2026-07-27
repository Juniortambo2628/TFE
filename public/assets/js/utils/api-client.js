/**
 * API Client Utility
 * 
 * Provides a unified interface for making API requests with consistent error handling,
 * loading states, and response formatting.
 */

(function () {
  'use strict';

  /**
   * Default API base URL
   */
  const API_BASE_URL = window.APP_BASE_URL ? window.APP_BASE_URL + 'api/' : '../api/';

  /**
   * Make an API request
   * 
   * @param {string} endpoint - API endpoint (relative to API base URL)
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method (default: 'GET')
   * @param {Object} options.body - Request body (will be JSON stringified)
   * @param {Object} options.headers - Additional headers
   * @param {boolean} options.requireAuth - Require authentication (default: true)
   * @param {Function} options.onSuccess - Success callback
   * @param {Function} options.onError - Error callback
   * @param {Function} options.onLoading - Loading state callback (receives boolean)
   * @returns {Promise<Object>} Promise resolving to response data
   */
  function apiRequest(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      requireAuth = true, // Reserved for future auth checks
      onSuccess = null,
      onError = null,
      onLoading = null,
    } = options;
    // eslint-disable-next-line no-unused-vars
    const _requireAuth = requireAuth; // Reserved for future use

    // Build full URL
    // If endpoint starts with http:// or https://, use as-is
    // If endpoint starts with ../ or ./, treat as relative path
    // Otherwise, treat as API endpoint
    let url;
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      url = endpoint;
    } else if (endpoint.startsWith('../') || endpoint.startsWith('./') || endpoint.startsWith('/')) {
      // Relative or absolute path - use as-is (will be resolved by browser)
      url = endpoint;
    } else {
      // API endpoint - prepend API base URL
      url = API_BASE_URL + endpoint.replace(/^\//, '');
    }

    // Prepare request options
    const requestOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Add body for POST/PUT/PATCH requests
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestOptions.body = JSON.stringify(body);
    }

    // Set loading state
    if (onLoading) {
      onLoading(true);
    }

    // Make request
    return fetch(url, requestOptions)
      .then(async (response) => {
        // Check if response is OK
        if (!response.ok) {
          // Try to parse error message from response
          let errorMessage = `Request failed (${response.status}). Please try again.`;
          try {
            const errorData = await response.json();
            errorMessage = errorData?.message || errorMessage;
          } catch {
            // If JSON parsing fails, try text
            try {
              const text = await response.text();
              if (text.trim().startsWith('{')) {
                const parsed = JSON.parse(text);
                errorMessage = parsed?.message || errorMessage;
              }
            } catch {
              // Use default message
            }
          }
          throw new Error(errorMessage);
        }

        // Parse JSON response
        return response.json();
      })
      .then((data) => {
        // Check if response indicates success
        if (data.success === false) {
          throw new Error(data.message || 'Request failed');
        }

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      })
      .catch((error) => {
        console.error('API request error:', error);

        // Call error callback if provided
        if (onError) {
          onError(error);
        } else {
          // Default error handling - show alert
          alert(error.message || 'An error occurred. Please try again.');
        }

        throw error;
      })
      .finally(() => {
        // Clear loading state
        if (onLoading) {
          onLoading(false);
        }
      });
  }

  /**
   * GET request helper
   */
  function apiGet(endpoint, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request helper
   */
  function apiPost(endpoint, body, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request helper
   */
  function apiPut(endpoint, body, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request helper
   */
  function apiDelete(endpoint, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'DELETE' });
  }

  // Export to global scope
  window.apiClient = {
    request: apiRequest,
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
  };
})();

