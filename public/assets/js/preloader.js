/**
 * Unified Preloader Management
 *
 * Single preloader system for all pages.
 * Shows immediately and hides when page is fully loaded.
 */

(function () {
  'use strict';

  // Check if we're on a dashboard page (fan or admin)
  const isDashboardPage = document.body.classList.contains('dashboard-mode') || 
                          document.querySelector('.dashboard-header') !== null;

  /**
   * Hide the preloader element
   * @param {HTMLElement} preloader - The preloader element
   */
  function hidePreloader(preloader) {
    if (!preloader) return;

    // Use opacity/display method for smooth transition
    preloader.style.opacity = '0';
    preloader.style.transition = 'opacity 0.3s ease-out';
    
    setTimeout(() => {
      preloader.style.display = 'none';
      document.body.classList.add('loaded');
    }, 300);
  }

  /**
   * Initialize preloader - show immediately, hide when ready
   * Prevents multiple initializations with a flag
   */
  let preloaderInitialized = false;

  function initPreloader() {
    // Prevent multiple initializations
    if (preloaderInitialized) {
      return;
    }
    preloaderInitialized = true;

    const preloader = document.getElementById('preloader');
    const loader = document.getElementById('loader');
    const loaderLogo = document.getElementById('loader-logo');

    if (!preloader) {
      return; // No preloader on this page
    }

    // CRITICAL: Ensure preloader is visible immediately (override any CSS)
    preloader.style.display = 'flex';
    preloader.style.opacity = '1';
    preloader.style.visibility = 'visible';
    preloader.style.position = 'fixed';
    preloader.style.top = '0';
    preloader.style.left = '0';
    preloader.style.width = '100%';
    preloader.style.height = '100%';
    preloader.style.zIndex = '9999';
    preloader.style.background = isDashboardPage ? '#070606' : 'var(--color-bg, #000)';
    preloader.style.alignItems = 'center';
    preloader.style.justifyContent = 'center';

    // Ensure loader container is visible
    if (loader) {
      loader.style.display = 'flex';
      loader.style.alignItems = 'center';
      loader.style.justifyContent = 'center';
    }

    // Ensure loader logo is visible and uses the correct image (not theme-logo replacement)
    if (loaderLogo) {
      loaderLogo.style.display = 'block';
      loaderLogo.style.opacity = '1';
      loaderLogo.style.visibility = 'visible';
      
      // Store the original src and prevent theme-logo CSS from changing it
      const originalSrc = loaderLogo.getAttribute('src');
      if (originalSrc && originalSrc.includes('cube-loader.svg')) {
        // Set data attribute to preserve original
        loaderLogo.setAttribute('data-original-src', originalSrc);
        
        // Monitor and prevent src changes from theme-logo CSS
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
              const currentSrc = loaderLogo.getAttribute('src');
              if (currentSrc && !currentSrc.includes('cube-loader.svg')) {
                // Restore original if something tries to change it
                loaderLogo.setAttribute('src', originalSrc);
              }
            }
          });
        });
        
        observer.observe(loaderLogo, {
          attributes: true,
          attributeFilter: ['src']
        });
      }
    }

    // Hide preloader when page is fully loaded
    if (document.readyState === 'complete') {
      // Page already loaded, hide immediately
      setTimeout(() => {
        hidePreloader(preloader);
      }, 100);
    } else {
      // Wait for window load event (all resources loaded)
      window.addEventListener('load', function () {
        hidePreloader(preloader);
      }, { once: true });
      
      // Fallback: hide after maximum wait time (5 seconds)
      setTimeout(() => {
        if (preloader.style.display !== 'none') {
          hidePreloader(preloader);
        }
      }, 5000);
    }
  }

  // Initialize immediately - show preloader right away
  if (document.readyState === 'loading') {
    // DOM is still loading, initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initPreloader);
  } else {
    // DOM is already ready, initialize immediately
    initPreloader();
  }
})();
