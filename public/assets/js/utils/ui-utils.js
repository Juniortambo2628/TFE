/**
 * UI Utilities
 * wrappers for SweetAlert2 and other UI helpers
 */

// import Swal from 'sweetalert2'; // Removed to use global CDN object
const Swal = window.Swal;

export const showToast = (icon, title) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: icon,
        title: title
    });
};

export const showAlert = (title, text, icon = 'info') => {
    return Swal.fire({
        title: title,
        text: text,
        icon: icon,
        confirmButtonColor: '#d63384', // Primary color
        background: '#1a1a1a', // Dark theme background
        color: '#ffffff' // Dark theme text
    });
};

// Expose to window for legacy support if needed
window.showToast = showToast;
window.showAlert = showAlert;
