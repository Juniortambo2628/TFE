/**
 * Button Handlers
 *
 * Handles special button behaviors (e.g., contact buttons that act like links).
 */

(function () {
  'use strict';

  /**
   * Initialize contact button handlers
   */
  function initContactButtons() {
    document.querySelectorAll('.btn-contact-us').forEach(function (btn) {
      const href = btn.getAttribute('data-href') || btn.getAttribute('href');
      if (!href) return;

      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function (e) {
        // Respect modifier keys (ctrl/cmd/shift for new tab/window)
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;

        // Navigate
        if (href.startsWith('mailto:') || href.startsWith('tel:')) {
          window.location.href = href;
        } else {
          window.location.href = href;
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactButtons);
  } else {
    initContactButtons();
  }
})();
