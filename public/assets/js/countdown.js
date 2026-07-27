/**
 * World Cup 2026 Countdown Timer
 *
 * Displays a live countdown to the World Cup 2026 Opening Ceremony.
 */

(function () {
  'use strict';

  /**
   * Update the countdown display
   */
  function updateCountdown() {
    try {
      // World Cup 2026 Opening Ceremony: June 11, 2026 at 8:00 PM EST
      const worldCupDate = new Date('2026-06-11T20:00:00-05:00').getTime();
      const now = new Date().getTime();
      const timeLeft = worldCupDate - now;

      // Get countdown elements
      const daysEl = document.getElementById('days');
      const hoursEl = document.getElementById('hours');
      const minutesEl = document.getElementById('minutes');
      const secondsEl = document.getElementById('seconds');

      // Check if elements exist
      if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
        return;
      }

      // Batch DOM updates to prevent forced reflow
      requestAnimationFrame(() => {
        if (timeLeft > 0) {
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

          daysEl.textContent = days.toString().padStart(3, '0');
          hoursEl.textContent = hours.toString().padStart(2, '0');
          minutesEl.textContent = minutes.toString().padStart(2, '0');
          secondsEl.textContent = seconds.toString().padStart(2, '0');
        } else {
          // Countdown finished
          daysEl.textContent = '000';
          hoursEl.textContent = '00';
          minutesEl.textContent = '00';
          secondsEl.textContent = '00';
        }
      });
    } catch (error) {
      console.error('Countdown error:', error);
    }
  }

  /**
   * Initialize countdown when DOM is ready
   */
  function initCountdown() {
    // Check if countdown elements exist on this page
    if (!document.getElementById('days')) {
      return; // No countdown on this page
    }

    // Update immediately
    updateCountdown();

    // Update every second
    setInterval(updateCountdown, 1000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCountdown);
  } else {
    initCountdown();
  }
})();
