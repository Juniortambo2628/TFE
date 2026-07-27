/**
 * Admin Login Form Handler
 *
 * Handles admin login form submission and password toggle.
 * Expects window.ADMIN_CSRF_TOKEN to be defined by PHP.
 */

(function () {
  'use strict';
  
  console.log('Admin login.js loaded');

  /**
   * Show alert message
   * @param {string} type - Alert type (success, danger, etc.)
   * @param {string} message - Alert message
   */
  function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
  }

  /**
   * Initialize login form
   */
  function initLoginForm() {
    console.log('initLoginForm called');
    const form = document.getElementById('adminLoginForm');
    const loginBtn = document.getElementById('loginBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    console.log('Form elements:', { form: !!form, loginBtn: !!loginBtn, togglePassword: !!togglePassword, passwordInput: !!passwordInput });

    if (!form || !loginBtn) {
      console.error('Form or login button not found!');
      return;
    }

    const btnText = loginBtn.querySelector('.btn-text');
    const btnSpinner = loginBtn.querySelector('.btn-spinner');

    // Toggle password visibility - ensure it works even if utility loads late
    if (togglePassword && passwordInput) {
      console.log('Setting up password toggle');
      // Always set up the toggle directly for reliability
      togglePassword.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Toggle password clicked');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = this.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-eye');
          icon.classList.toggle('fa-eye-slash');
        }
      });
      
      // Also try to use utility if available (for consistency)
      if (window.passwordToggle && typeof window.passwordToggle.init === 'function') {
        console.log('Using passwordToggle utility');
        window.passwordToggle.init(passwordInput, togglePassword);
      }
    } else {
      console.error('Password toggle elements not found!', { togglePassword: !!togglePassword, passwordInput: !!passwordInput });
    }

    // Handle form submission
    console.log('Setting up form submit handler');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      console.log('Form submitted!');

      // Show loading state
      loginBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'inline-block';

      try {
        const formData = new FormData(form);
        // Append CSRF token if available
        if (window.ADMIN_CSRF_TOKEN) {
          formData.append('csrf_token', window.ADMIN_CSRF_TOKEN);
        }
        const data = Object.fromEntries(formData);

        console.log('Submitting login form...', { email: data.email, hasPassword: !!data.password, hasToken: !!data.csrf_token });

        const response = await fetch('../auth/admin-login.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        console.log('Response status:', response.status, response.statusText);

        // Check if response is OK
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          let errorMessage = 'An error occurred. Please try again.';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        // Parse JSON response
        const contentType = response.headers.get('content-type');
        let result;
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Invalid response from server. Please try again.');
        }

        console.log('Login result:', result);

        if (result.success) {
          showAlert('success', result.message || 'Login successful!');

          // Redirect to dashboard after short delay
          setTimeout(() => {
            window.location.href = result.redirect_url || 'dashboard.php';
          }, 1000);
        } else {
          showAlert('danger', result.message || 'Login failed. Please check your credentials.');
          // Reset button state on failure
          loginBtn.disabled = false;
          if (btnText) btnText.style.display = 'inline-block';
          if (btnSpinner) btnSpinner.style.display = 'none';
        }
      } catch (error) {
        console.error('Login error:', error);
        showAlert('danger', error.message || 'An error occurred. Please try again.');
        // Reset button state on error
        loginBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline-block';
        if (btnSpinner) btnSpinner.style.display = 'none';
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginForm);
  } else {
    initLoginForm();
  }
})();
