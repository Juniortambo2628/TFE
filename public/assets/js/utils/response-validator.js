/**
 * Response Validator Utility
 * 
 * Provides functions to validate and parse API responses
 */

(function () {
  'use strict';
  console.log('response-validator.js loaded');

  /**
   * Validate that response has JSON content type
   * @param {Response} response - Fetch response object
   * @returns {Promise<string>} Response text if not JSON
   * @throws {Error} If response is not JSON
   */
  function validateJsonResponse(response) {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return response.text().then(text => {
        console.error('Non-JSON response:', text);
        throw new Error('Invalid response from server');
      });
    }
    return Promise.resolve();
  }

  /**
   * Parse JSON response with validation
   * @param {Response} response - Fetch response object
   * @returns {Promise<Object>} Parsed JSON data
   * @throws {Error} If response is not valid JSON
   */
  async function parseJsonResponse(response) {
    await validateJsonResponse(response);
    return response.json();
  }

  // Export to global scope
  window.responseValidator = {
    validateJsonResponse,
    parseJsonResponse,
  };
})();

