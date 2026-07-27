/**
 * Admin Footer JavaScript
 * Additional admin functionality and initialization
 */

// Initialize admin footer functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // Initialize AOS (Animate On Scroll) if available
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      offset: 100,
    });
  }

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    });
  });

  // Auto-hide alerts after 5 seconds
  document.querySelectorAll('.alert:not(.alert-permanent)').forEach(alert => {
    setTimeout(() => {
      if (alert.querySelector('.btn-close')) {
        alert.querySelector('.btn-close').click();
      } else {
        alert.remove();
      }
    }, 5000);
  });

  // Enhanced tooltip initialization for admin elements
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  if (tooltipTriggerList.length > 0) {
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  // Add loading states for buttons
  document.querySelectorAll('button[data-loading-text]').forEach(button => {
    button.addEventListener('click', function () {
      const originalText = this.textContent;
      const loadingText = this.getAttribute('data-loading-text');

      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>' + loadingText;

      // Reset after 3 seconds (adjust based on actual operation time)
      setTimeout(() => {
        this.disabled = false;
        this.textContent = originalText;
      }, 3000);
    });
  });

  // Console log for debugging admin page loads
  console.log('Admin footer initialized for:', window.location.pathname);

  // Add keyboard shortcuts for common admin actions
  document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + R to refresh data (if refresh function exists)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      if (typeof window.refreshDashboardData === 'function') {
        window.refreshDashboardData();
      }
    }

    // Escape key to close modals
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal.show');
      openModals.forEach(modal => {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        }
      });
    }
  });

  // Initialize any custom admin widgets
  initializeAdminWidgets();
});

/**
 * Initialize custom admin widgets and components
 */
function initializeAdminWidgets() {
  // Initialize sortable tables if SortableJS is loaded
  if (typeof Sortable !== 'undefined') {
    document.querySelectorAll('.sortable-table tbody').forEach(tableBody => {
      new Sortable(tableBody, {
        handle: '.sortable-handle',
        animation: 150,
        onEnd: function (evt) {
          // Handle row reordering if needed
          console.log('Row reordered:', evt.oldIndex, '->', evt.newIndex);
        },
      });
    });
  }

  // Initialize charts if Chart.js is available
  if (typeof Chart !== 'undefined') {
    // Charts are handled by dashboard-charts.js
    console.log('Chart.js available for admin charts');
  }

  // Initialize any admin-specific form enhancements
  initializeAdminForms();
}

/**
 * Initialize admin form enhancements
 */
function initializeAdminForms() {
  // Add confirmation dialogs for destructive actions
  document.querySelectorAll('[data-confirm-action]').forEach(element => {
    element.addEventListener('click', function (e) {
      const message = this.getAttribute('data-confirm-action');
      if (!confirm(message)) {
        e.preventDefault();
        return false;
      }
    });
  });

  // Add real-time validation for admin forms
  document
    .querySelectorAll(
      '.admin-form input[required], .admin-form select[required], .admin-form textarea[required]'
    )
    .forEach(field => {
      field.addEventListener('blur', function () {
        if (this.value.trim() === '') {
          this.classList.add('is-invalid');
        } else {
          this.classList.remove('is-invalid');
          this.classList.add('is-valid');
        }
      });
    });
}

/**
 * Global function to refresh dashboard data (called by keyboard shortcut)
 */
window.refreshDashboardData = function () {
  console.log('Refreshing dashboard data...');
  // Force reload of dashboard data
  if (typeof window.loadDashboardData === 'function') {
    window.loadDashboardData();
  }
  // Show loading indicator
  showToast('Dashboard data refreshed', 'success');
};

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  // Create toast element if toast container exists
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

  toastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();

  // Remove after showing
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

// Export functions for global access
window.initializeAdminWidgets = initializeAdminWidgets;
window.initializeAdminForms = initializeAdminForms;
window.showToast = showToast;
