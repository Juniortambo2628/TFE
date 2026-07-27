/**
 * Chart Utilities
 * Shared Chart.js initialization functions for admin pages
 */

(function () {
  'use strict';

  /**
   * Initialize a Registration Trends Chart
   * @param {HTMLElement} canvasElement - Canvas element for the chart
   * @param {Array} registrationData - Array of registration trend data
   * @param {Object} options - Optional chart configuration overrides
   */
  window.initRegistrationChart = function (canvasElement, registrationData, options = {}) {
    if (!canvasElement || typeof Chart === 'undefined') {
      return null;
    }

    if (!registrationData || registrationData.length === 0) {
      if (canvasElement.parentElement) {
        canvasElement.parentElement.innerHTML =
          '<div class="text-center py-4"><p class="text-muted">No data available</p></div>';
      }
      return null;
    }

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    };

    const chartOptions = { ...defaultOptions, ...options };

    return new Chart(canvasElement.getContext('2d'), {
      type: 'line',
      data: {
        labels: registrationData.map(item => {
          const date = new Date(item.month + '-01');
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }),
        datasets: [
          {
            label: 'New Registrations',
            data: registrationData.map(item => item.count),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: chartOptions,
    });
  };
})();

