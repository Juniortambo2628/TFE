/**
 * Dashboard Charts
 * Handles rendering of charts on the fan dashboard
 */

import { createChart } from '../shared/chart-utils.js';

(function () {
  'use strict';

  function initCharts() {
    const ctx = document.getElementById('journeyProgressChart');
    if (!ctx) return;

    // Example data - in a real app this would come from an API or injected JSON
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [0, 20, 45, 60, 75, 90];

    createChart(ctx, 'line', {
      labels: labels,
      datasets: [{
        label: 'Journey Progress (%)',
        data: data,
        borderColor: '#ef4050',
        backgroundColor: 'rgba(239, 64, 80, 0.1)',
        tension: 0.4,
        fill: true
      }]
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
  } else {
    initCharts();
  }
})();
