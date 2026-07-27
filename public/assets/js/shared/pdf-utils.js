import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Create a new PDF document.
 * @param {object} options - jsPDF options.
 * @returns {jsPDF} The jsPDF instance.
 */
export const createPDF = (options = {}) => {
    return new jsPDF(options);
};

/**
 * Add a table to the PDF.
 * @param {jsPDF} doc - The jsPDF instance.
 * @param {Array} headers - The table headers.
 * @param {Array} data - The table data.
 * @param {object} options - autoTable options.
 */
export const addTableToPDF = (doc, headers, data, options = {}) => {
    doc.autoTable({
        head: [headers],
        body: data,
        ...options
    });
};

/**
 * Save the PDF.
 * @param {jsPDF} doc - The jsPDF instance.
 * @param {string} filename - The filename.
 */
export const savePDF = (doc, filename) => {
    doc.save(filename);
};
