/**
 * Admin Events Management
 *
 * Handles event modal management and CRUD operations.
 */

(function () {
  'use strict';

  let eventModal;

  /**
   * Initialize modal on DOM ready
   */
  function initModal() {
    if (typeof bootstrap !== 'undefined') {
      const modalElement = document.getElementById('eventModal');
      if (modalElement) {
        eventModal = new bootstrap.Modal(modalElement);
      }
    }
  }

  /**
   * Open event modal for creating new event
   */
  window.openEventModal = function () {
    const titleEl = document.getElementById('eventModalTitle');
    const form = document.getElementById('eventForm');
    const eventIdEl = document.getElementById('event_id');

    if (titleEl) titleEl.textContent = 'Create New Event';
    if (form) form.reset();
    if (eventIdEl) eventIdEl.value = '';

    if (eventModal) {
      eventModal.show();
    } else if (typeof bootstrap !== 'undefined') {
      // fallback: initialize and show
      initModal();
      if (eventModal) {
        eventModal.show();
      }
    } else {
      console.warn('Bootstrap not loaded yet - cannot show modal');
    }
  };

  /**
   * Edit existing event
   * @param {Object} event - Event object with properties
   */
  window.editEvent = function (event) {
    const titleEl = document.getElementById('eventModalTitle');
    if (titleEl) titleEl.textContent = 'Edit Event';

    const eventIdEl = document.getElementById('event_id');
    if (eventIdEl) eventIdEl.value = event.id;

    // Populate form fields
    const fieldMap = {
      event_title: event.title,
      event_type: event.event_type,
      event_status: event.status,
      event_description: event.description || '',
      event_location: event.location,
      event_venue: event.venue || '',
      event_capacity: event.capacity || '',
      event_price: event.price,
      event_image: event.image_url || '',
    };

    Object.keys(fieldMap).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = fieldMap[id];
    });

    // Handle date fields
    const startDateEl = document.getElementById('event_start_date');
    if (startDateEl && event.start_date) {
      startDateEl.value = event.start_date.replace(' ', 'T').substring(0, 16);
    }

    const endDateEl = document.getElementById('event_end_date');
    if (endDateEl && event.end_date) {
      endDateEl.value = event.end_date.replace(' ', 'T').substring(0, 16);
    }

    if (eventModal) {
      eventModal.show();
    }
  };

  /**
   * Save event (create or update)
   */
  window.saveEvent = async function () {
    const form = document.getElementById('eventForm');
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const eventIdEl = document.getElementById('event_id');
    const eventId = eventIdEl ? eventIdEl.value : '';
    formData.append('action', eventId ? 'update' : 'create');

    try {
      const response = await fetch('api/events-admin.php', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message || 'Event saved successfully!');
        if (eventModal) {
          eventModal.hide();
        }
        location.reload();
      } else {
        alert(result.message || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('An error occurred while saving the event');
    }
  };

  /**
   * Delete event
   * @param {string|number} eventId - Event ID to delete
   */
  window.deleteEvent = async function (eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch('api/events-admin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=delete&event_id=${eventId}`,
      });

      const result = await response.json();
      if (result.success) {
        alert('Event deleted successfully!');
        location.reload();
      } else {
        alert(result.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('An error occurred while deleting the event');
    }
  };

  // Initialize modal when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModal);
  } else {
    initModal();
  }
})();
