/**
 * Login Form Handler
 *
 * Handles login form submission, email code login, and social login.
 * Expects window.LOGIN_CONFIG to be defined by PHP.
 */

(function () {
  'use strict';

  const config = window.LOGIN_CONFIG || {};

  /**
   * Handle login form submission
   */
  function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async e => {
      e.preventDefault();

      const form = e.target;
      const email = form.email.value;
      const password = form.password.value;
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!submitBtn) return;

      // Disable submit button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const endpoint = config.loginUrl || '../auth/login.php';
        
        // Use apiClient if available, otherwise use fetch directly
        if (window.apiClient && typeof window.apiClient.post === 'function') {
          await window.apiClient.post(endpoint, {
            email: email,
            password: password,
          }, {
            onSuccess: (response) => {
              // Redirect to the provided URL
              if (response.redirect_url) {
                window.location.href = response.redirect_url;
              } else {
                // Fallback redirect
                window.location.href = '../fan/dashboard.php';
              }
            },
            onError: () => {
              // Error handling is done by apiClient
              submitBtn.disabled = false;
              submitBtn.textContent = 'Sign In';
            },
            onLoading: (loading) => {
              submitBtn.disabled = loading;
              submitBtn.textContent = loading ? 'Signing in...' : 'Sign In';
            },
          });
        } else {
          // Fallback: use fetch directly
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              password: password,
            }),
          });

          // Use response validator utility
          const result = await (window.responseValidator?.parseJsonResponse?.(response) ?? 
            (async () => {
              const contentType = response.headers.get('content-type');
              if (!contentType?.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Invalid response from server');
              }
              return response.json();
            })());

          if (result.success) {
            // Redirect to the provided URL
            if (result.redirect_url) {
              window.location.href = result.redirect_url;
            } else {
              // Fallback redirect
              window.location.href = '../fan/dashboard.php';
            }
          } else {
            // Show error message
            const errorMsg = result.message || 'Login failed. Please try again.';
            alert(errorMsg);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
          }
        }
      } catch (error) {
        if (window.loginErrorHandler && typeof window.loginErrorHandler.handleLoginFormError === 'function') {
          window.loginErrorHandler.handleLoginFormError(error, submitBtn);
        } else {
          console.error('Login error:', error);
          alert(error.message || 'An error occurred. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      }
    });
  }

  /**
   * Login with email code handler
   */
  function initLoginWithCode() {
    const loginWithCodeBtn = document.getElementById('loginWithCodeBtn');
    if (!loginWithCodeBtn) return;

    loginWithCodeBtn.addEventListener('click', async () => {
      const emailInput = document.getElementById('loginEmail');
      if (!emailInput) return;

      const email = emailInput.value;

      if (!email) {
        alert('Please enter your email address first');
        emailInput.focus();
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        emailInput.focus();
        return;
      }

      try {
        const response = await fetch(config.requestCodeUrl || '../auth/request-login-code.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email }),
        });

        const data = await response.json();

        if (data.success || response.ok) {
          // Redirect to verification page
          window.location.href =
            (config.verifyCodeUrl || '../auth/verify-login-code.php') +
            '?email=' +
            encodeURIComponent(email);
        } else {
          alert(data.message || 'Failed to send login code. Please try again.');
        }
      } catch {
        alert('An error occurred. Please try again.');
      }
    });
  }

  /**
   * Social login handlers
   */
  function initSocialLogin() {
    // Google login
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', () => {
        try {
          // Generate state for CSRF protection (client-side)
          const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          
          // Store state in sessionStorage for validation on callback
          sessionStorage.setItem('oauth_state', state);

          const params = new URLSearchParams({
            client_id: config.googleClientId || '',
            redirect_uri: config.googleRedirectUri || '',
            response_type: 'code',
            scope: 'email profile',
            state: state,
          });

          window.location.href =
            'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
        } catch (err) {
          console.error('Google OAuth error:', err);
          alert('Unable to start Google sign-in. Please try again later.');
        }
      });
    }

    // Facebook login
    const facebookLoginBtn = document.getElementById('facebookLoginBtn');
    if (facebookLoginBtn) {
      facebookLoginBtn.addEventListener('click', () => {
        // Generate state for CSRF protection
        const state = Math.random().toString(36).substring(7);
        sessionStorage.setItem('oauth_state', state);

        const params = new URLSearchParams({
          client_id: config.facebookAppId || '',
          redirect_uri: config.facebookRedirectUri || '',
          response_type: 'code',
          scope: 'email,public_profile',
          state: state,
        });

        window.location.href = 'https://www.facebook.com/v18.0/dialog/oauth?' + params.toString();
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initLoginForm();
      initLoginWithCode();
      initSocialLogin();
    });
  } else {
    initLoginForm();
    initLoginWithCode();
    initSocialLogin();
  }
})();
