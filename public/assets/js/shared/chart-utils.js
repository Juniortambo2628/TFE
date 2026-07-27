import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

/**
 * Create a new chart instance.
 * @param {HTMLCanvasElement} ctx - The canvas element.
 * @param {string} type - The chart type (e.g., 'line', 'bar').
 * @param {object} data - The chart data.
 * @param {object} options - The chart options.
 * @returns {Chart} The chart instance.
 */
export const createChart = (ctx, type, data, options = {}) => {
    return new Chart(ctx, {
        type: type,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            ...options
        }
    });
};

/**
 * Update chart data.
 * @param {Chart} chart - The chart instance.
 * @param {object} newData - The new data.
 */
export const updateChartData = (chart, newData) => {
    chart.data = newData;
    chart.update();
};
