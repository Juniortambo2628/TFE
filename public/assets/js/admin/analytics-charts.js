/**
 * Admin Analytics Charts
 *
 * Initializes Chart.js charts for the analytics page.
 * Expects window.ANALYTICS_DATA to be defined by PHP.
 */

(function () {
  'use strict';

  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js library not loaded. Charts will not be initialized.');
    return;
  }

  // Check if data is available
  if (!window.ANALYTICS_DATA) {
    console.warn('Analytics data not available.');
    return;
  }

  const data = window.ANALYTICS_DATA;

  /**
   * Initialize Registration Trends Chart
   */
  function initRegistrationChart() {
    const ctx = document.getElementById('registrationChart');
    if (!ctx) return;

    const registrationData = data.registrationTrends || [];
    window.initRegistrationChart(ctx, registrationData);
  }

  /**
   * Initialize Country Distribution Chart
   */
  function initCountryChart() {
    const ctx = document.getElementById('countryChart');
    if (!ctx) return;

    const countryData = data.countryDistribution || [];

    if (countryData.length === 0) {
      ctx.parentElement.innerHTML =
        '<div class="text-center py-4"><p class="text-muted">No data available</p></div>';
      return;
    }

    new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: countryData.map(item => item.country),
        datasets: [
          {
            data: countryData.map(item => item.count),
            backgroundColor: [
              '#007bff',
              '#28a745',
              '#ffc107',
              '#dc3545',
              '#17a2b8',
              '#6f42c1',
              '#fd7e14',
              '#20c997',
              '#e83e8c',
              '#6c757d',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }

  /**
   * Analytics utility functions
   */
  window.analyticsHelpers = {
    exportAnalytics: function () {
      console.log('Exporting analytics data...');
      if (window.dashboard && window.dashboard.showInfo) {
        window.dashboard.showInfo('Exporting analytics data...');
      }
    },
    refreshAnalytics: function () {
      console.log('Refreshing analytics...');
      if (window.dashboard && window.dashboard.showInfo) {
        window.dashboard.showInfo('Refreshing analytics data...');
      }
      // Reload the page to refresh data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
  };

  /**
   * Initialize all charts when DOM is ready
   */
  function init() {
    initRegistrationChart();
    initCountryChart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
