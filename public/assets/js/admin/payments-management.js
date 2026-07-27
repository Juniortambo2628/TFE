/**
 * Admin Payments Management
 *
 * Handles payment schedule modal and viewing.
 */

(function () {
  'use strict';

  let paymentModal;

  /**
   * Initialize modal on DOM ready
   */
  function initModal() {
    paymentModal = window.initAdminModal('paymentModal');
  }

  /**
   * View payment schedule for a booking
   * @param {string|number} bookingId - Booking ID
   */
  window.viewPaymentSchedule = async function (bookingId) {
    const content = document.getElementById('paymentScheduleContent');
    if (!content) return;

    content.innerHTML = '<div class="loading">Loading payment schedule...</div>';

    paymentModal = window.showAdminModal(paymentModal, 'paymentModal');
    if (!paymentModal) return;

    const response = await fetch(`api/payment-schedule.php?booking_id=${bookingId}`);
    await window.handleModalApiResponse(
      response,
      content,
      (data) => {
        let html = `
                    <div class="booking-info mb-4">
                        <h6>Booking Details</h6>
                        <p><strong>Package:</strong> ${data.booking.package_name}</p>
                        <p><strong>User:</strong> ${data.booking.user_name} (${data.booking.user_email})</p>
                        <p><strong>Total:</strong> $${parseFloat(data.booking.total_amount).toFixed(2)}</p>
                        <p><strong>Paid:</strong> $${parseFloat(data.booking.amount_paid).toFixed(2)}</p>
                        <p><strong>Balance:</strong> $${(data.booking.total_amount - data.booking.amount_paid).toFixed(2)}</p>
                    </div>
                    <h6>Payment Schedule</h6>
                    <table class="table table-dark table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Due Date</th>
                                <th>Paid Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

        data.payments.forEach(payment => {
          html += `
                        <tr>
                            <td>${payment.payment_number}</td>
                            <td>${payment.payment_type || 'N/A'}</td>
                            <td>$${parseFloat(payment.amount).toFixed(2)}</td>
                            <td>${payment.due_date || 'N/A'}</td>
                            <td>${payment.paid_date || '-'}</td>
                            <td><span class="badge bg-${payment.status === 'paid' ? 'success' : 'warning'}">${payment.status}</span></td>
                        </tr>
                    `;
        });

        html += `
                        </tbody>
                    </table>
                `;
        return html;
      },
      'Failed to load payment schedule'
    );
  };

  // Initialize modal when DOM is ready
  window.initModalOnReady('paymentModal', (modal) => {
    paymentModal = modal;
  });
})();
