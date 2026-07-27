/**
 * Contact Page
 *
 * Handles contact form functionality.
 */

(function () {
  'use strict';

  /**
   * Submit contact form
   */
  window.submitContactForm = function () {
    // Implement contact form submission
    alert('Contact form submission functionality will be implemented');
  };

  /**
   * Clear form
   */
  window.clearForm = function () {
    const form = document.getElementById('contactForm');
    if (form) {
      form.reset();
    }
  };

  /**
   * Toggle FAQ item
   */
  window.toggleFAQ = function (element) {
    const faqItem = element.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const icon = element.querySelector('i');

    faqItem.classList.toggle('active');

    if (faqItem.classList.contains('active')) {
      if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
      if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
      if (answer) answer.style.maxHeight = '0';
      if (icon) icon.style.transform = 'rotate(0deg)';
    }
  };

  /**
   * Initialize contact page
   */
  function initContact() {
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        window.submitContactForm();
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContact);
  } else {
    initContact();
  }
})();
