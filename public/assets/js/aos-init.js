/**
 * AOS (Animate On Scroll) Initialization
 *
 * Initializes AOS library with consistent settings across the application.
 */

(function () {
  'use strict';

  // Check if AOS is loaded
  if (typeof AOS === 'undefined') {
    console.warn('AOS library not loaded. Make sure aos.js is included before this script.');
    return;
  }

  // Initialize AOS with configuration
  AOS.init({
    duration: 1200,
    easing: 'ease-in-out-cubic',
    once: false,
    mirror: true,
    offset: 100,
    delay: 0,
    anchorPlacement: 'top-bottom',
    startEvent: 'DOMContentLoaded',
    initClassName: 'aos-init',
    animatedClassName: 'aos-animate',
    useClassNames: false,
    disableMutationObserver: false,
    debounceDelay: 50,
    throttleDelay: 99,
  });
})();
