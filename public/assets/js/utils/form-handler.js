/**
 * Form Handler Utility
 * 
 * Provides a unified interface for handling form submissions with validation,
 * loading states, and API integration.
 */

(function () {
  'use strict';

  /**
   * Handle form submission
   * 
   * @param {HTMLFormElement|string} form - Form element or form selector
   * @param {Object} options - Handler options
   * @param {string} options.endpoint - API endpoint
   * @param {string} options.method - HTTP method (default: 'POST')
   * @param {Function} options.onSuccess - Success callback (receives response data)
   * @param {Function} options.onError - Error callback (receives error)
   * @param {Function} options.validate - Validation function (receives formData, returns true/false or error message)
   * @param {Function} options.transform - Transform form data before sending (receives formData, returns transformed data)
   * @param {string} options.submitButton - Submit button selector (default: 'button[type="submit"], input[type="submit"]')
   * @param {boolean} options.resetOnSuccess - Reset form on success (default: false)
   * @param {boolean} options.preventDefault - Prevent default form submission (default: true)
   */
  function handleForm(form, options = {}) {
    const {
      endpoint,
      method = 'POST',
      onSuccess = null,
      onError = null,
      validate = null,
      transform = null,
      submitButton = 'button[type="submit"], input[type="submit"]',
      resetOnSuccess = false,
      preventDefault = true,
    } = options;

    if (!endpoint) {
      console.error('Form handler: endpoint is required');
      return;
    }

    // Get form element
    const formElement = typeof form === 'string' ? document.querySelector(form) : form;
    if (!formElement) {
      console.error('Form handler: form element not found');
      return;
    }

    // Get submit button
    const submitBtn = formElement.querySelector(submitButton);
    const originalButtonText = submitBtn ? submitBtn.textContent || submitBtn.value : null;

    // Handle form submission
    formElement.addEventListener('submit', async function (e) {
      if (preventDefault) {
        e.preventDefault();
      }

      // Get form data
      const formData = new FormData(formElement);
      const data = Object.fromEntries(formData.entries());

      // Validate
      if (validate) {
        const validationResult = validate(data, formElement);
        if (validationResult !== true) {
          const errorMessage = typeof validationResult === 'string' ? validationResult : 'Validation failed';
          alert(errorMessage);
          if (onError) {
            onError(new Error(errorMessage));
          }
          return;
        }
      }

      // Transform data if needed
      const transformedData = transform ? transform(data, formElement) : data;

      // Disable submit button and show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtn.tagName === 'BUTTON') {
          submitBtn.textContent = 'Loading...';
        } else {
          submitBtn.value = 'Loading...';
        }
      }

      try {
        // Make API request
        const response = await window.apiClient.request(endpoint, {
          method,
          body: transformedData,
          onSuccess: (data) => {
            if (onSuccess) {
              onSuccess(data, formElement);
            }
          },
          onError: (error) => {
            if (onError) {
              onError(error, formElement);
            }
          },
          onLoading: (loading) => {
            if (submitBtn) {
              submitBtn.disabled = loading;
            }
          },
        });

        // Reset form if requested
        if (resetOnSuccess && response.success) {
          formElement.reset();
        }

        return response;
      } catch (error) {
        // Error handling is done by apiClient
        console.error('Form submission error:', error);
        return null;
      } finally {
        // Re-enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitBtn.tagName === 'BUTTON') {
            submitBtn.textContent = originalButtonText;
          } else {
            submitBtn.value = originalButtonText;
          }
        }
      }
    });
  }

  /**
   * Validate required fields
   * 
   * @param {Object} data - Form data
   * @param {Array<string>} requiredFields - List of required field names
   * @returns {string|true} Error message or true if valid
   */
  function validateRequired(data, requiredFields) {
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === '') {
        return `${field} is required`;
      }
    }
    return true;
  }

  /**
   * Validate email format
   * 
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * 
   * @param {string} password - Password to validate
   * @param {Object} options - Validation options
   * @param {number} options.minLength - Minimum length (default: 8)
   * @returns {string|true} Error message or true if valid
   */
  function validatePassword(password, options = {}) {
    const { minLength = 8 } = options;
    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    return true;
  }

  // Export to global scope
  window.formHandler = {
    handle: handleForm,
    validate: {
      required: validateRequired,
      email: validateEmail,
      password: validatePassword,
    },
  };
})();

