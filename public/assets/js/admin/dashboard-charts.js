/**
 * Admin Dashboard Charts
 *
 * Initializes Chart.js charts for the admin dashboard.
 * Expects window.ADMIN_DASHBOARD_DATA to be defined by PHP.
 */

(function () {
  'use strict';

  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js library not loaded. Charts will not be initialized.');
    return;
  }

  // Check if data is available
  if (!window.ADMIN_DASHBOARD_DATA) {
    console.warn('Admin dashboard data not available.');
    return;
  }

  const data = window.ADMIN_DASHBOARD_DATA;

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
   * Initialize Status Distribution Chart
   */
  function initStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const statusData = data.status || { active: 0, pending: 0 };

    if (statusData.active === 0 && statusData.pending === 0) {
      ctx.parentElement.innerHTML =
        '<div class="text-center py-4"><p class="text-muted">No data available</p></div>';
      return;
    }

    new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Pending'],
        datasets: [
          {
            data: [statusData.active, statusData.pending],
            backgroundColor: ['#28a745', '#ffc107'],
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
   * Initialize Enhanced Analytics Charts
   */
  function initEnhancedCharts() {
    // Get base URL from config or use relative path
    const baseUrl = window.APP_BASE_URL || '/TFE';
    const apiUrl = baseUrl.replace(/\/$/, '') + '/admin/api/dashboard-data.php?type=enhanced';
    
    fetch(apiUrl)
      .then(response => {
        // Check if response is OK
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return response.text().then(text => {
            console.error('Non-JSON response:', text);
            throw new Error('Invalid response from server');
          });
        }
        return response.json();
      })
      .then(result => {
        if (!result.success || !result.data) {
          throw new Error('Failed to load enhanced analytics');
        }

        const enhancedData = result.data;

        // Team Support Chart
        if (enhancedData.team_support && enhancedData.team_support.length > 0) {
          const teamCtx = document.getElementById('teamSupportChart');
          if (teamCtx) {
            const teamLabels = enhancedData.team_support.map(item => item.team_support);
            const teamData = enhancedData.team_support.map(item => item.count);

            new Chart(teamCtx.getContext('2d'), {
              type: 'bar',
              data: {
                labels: teamLabels,
                datasets: [
                  {
                    label: 'Users',
                    data: teamData,
                    backgroundColor: '#007bff',
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              },
            });
          }
        } else {
          const teamEl = document.getElementById('teamSupportChart');
          if (teamEl) {
            teamEl.parentElement.innerHTML =
              '<div class="text-center py-4"><p class="text-muted">No team support data available</p></div>';
          }
        }

        // Financing Chart
        if (enhancedData.financing && enhancedData.financing.financing_stats) {
          const financingCtx = document.getElementById('financingChart');
          if (financingCtx) {
            const financingData = enhancedData.financing.financing_stats;

            new Chart(financingCtx.getContext('2d'), {
              type: 'doughnut',
              data: {
                labels: ['Seeking Financing', 'Not Seeking'],
                datasets: [
                  {
                    data: [
                      financingData.find(item => item.seeking_financing == 1)?.count || 0,
                      financingData.find(item => item.seeking_financing == 0)?.count || 0,
                    ],
                    backgroundColor: ['#28a745', '#6c757d'],
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
        } else {
          const fEl = document.getElementById('financingChart');
          if (fEl) {
            fEl.parentElement.innerHTML =
              '<div class="text-center py-4"><p class="text-muted">No financing data available</p></div>';
          }
        }

        // Employment Chart
        if (
          enhancedData.financing &&
          enhancedData.financing.employment_stats &&
          enhancedData.financing.employment_stats.length > 0
        ) {
          const employmentCtx = document.getElementById('employmentChart');
          if (employmentCtx) {
            const employmentLabels = enhancedData.financing.employment_stats.map(
              item => item.employment_status
            );
            const employmentData = enhancedData.financing.employment_stats.map(item => item.count);

            new Chart(employmentCtx.getContext('2d'), {
              type: 'pie',
              data: {
                labels: employmentLabels,
                datasets: [
                  {
                    data: employmentData,
                    backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545'],
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
        } else {
          const eEl = document.getElementById('employmentChart');
          if (eEl) {
            eEl.parentElement.innerHTML =
              '<div class="text-center py-4"><p class="text-muted">No employment data available</p></div>';
          }
        }

        // Loan Period Chart
        if (
          enhancedData.financing &&
          enhancedData.financing.loan_period_stats &&
          enhancedData.financing.loan_period_stats.length > 0
        ) {
          const loanCtx = document.getElementById('loanPeriodChart');
          if (loanCtx) {
            const loanLabels = enhancedData.financing.loan_period_stats.map(
              item => item.loan_return_period
            );
            const loanData = enhancedData.financing.loan_period_stats.map(item => item.count);

            new Chart(loanCtx.getContext('2d'), {
              type: 'bar',
              data: {
                labels: loanLabels,
                datasets: [
                  {
                    label: 'Users',
                    data: loanData,
                    backgroundColor: '#17a2b8',
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              },
            });
          }
        } else {
          const lEl = document.getElementById('loanPeriodChart');
          if (lEl) {
            lEl.parentElement.innerHTML =
              '<div class="text-center py-4"><p class="text-muted">No loan period data available</p></div>';
          }
        }
      })
      .catch(error => {
        console.error('Error loading enhanced analytics:', error);
        // Show error messages for all charts
        ['teamSupportChart', 'financingChart', 'employmentChart', 'loanPeriodChart'].forEach(
          chartId => {
            const chartElement = document.getElementById(chartId);
            if (chartElement) {
              chartElement.parentElement.innerHTML =
                '<div class="text-center py-4"><p class="text-muted">Error loading data</p></div>';
            }
          }
        );
      });
  }

  /**
   * Dashboard utility functions
   */
  window.dashboardHelpers = {
    exportData: function (format) {
      console.log('Exporting data as', format);
      if (window.dashboard && window.dashboard.showInfo) {
        window.dashboard.showInfo(`Exporting data as ${format.toUpperCase()}...`);
      }
    },
    logout: function () {
      if (confirm('Are you sure you want to logout?')) {
        // Clear session cookie
        document.cookie = 'wctfe_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // Redirect to login page
        window.location.href = 'login.php';
      }
    },
  };

  /**
   * Initialize all charts when DOM is ready
   */
  function init() {
    initRegistrationChart();
    initStatusChart();
    initEnhancedCharts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
