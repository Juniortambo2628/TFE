/**
 * Dashboard Section Modals and Interactions
 * Handles "Read More" buttons and displays detailed information in modals
 */

(function () {
  'use strict';

  const BASE_URL = (window.APP_BASE_URL || '/TFE').replace(/\/$/, '') + '/';

  // Helper to make API calls - use shared utility if available
  async function fetchAPI(endpoint) {
    if (window.fetchAPI && typeof window.fetchAPI === 'function') {
      return window.fetchAPI(endpoint, BASE_URL);
    }
    // Fallback implementation
    try {
      const response = await fetch(BASE_URL + endpoint);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('API fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Modal HTML template
  function createModal() {
    const modal = document.createElement('div');
    modal.className = 'dashboard-modal';
    modal.id = 'dashboardModal';
    modal.innerHTML = `
            <div class="dashboard-modal-overlay"></div>
            <div class="dashboard-modal-content">
                <button class="dashboard-modal-close" aria-label="Close modal">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="dashboard-modal-header">
                    <h2 class="dashboard-modal-title"></h2>
                </div>
                <div class="dashboard-modal-body"></div>
            </div>
        `;
    document.body.appendChild(modal);
    return modal;
  }

  // Get or create modal
  function getModal() {
    let modal = document.getElementById('dashboardModal');
    if (!modal) {
      modal = createModal();
    }
    return modal;
  }

  // Open modal with content
  function openModal(title, content) {
    const modal = getModal();
    const titleEl = modal.querySelector('.dashboard-modal-title');
    const bodyEl = modal.querySelector('.dashboard-modal-body');

    titleEl.textContent = title;
    bodyEl.innerHTML = content;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close modal
  function closeModal() {
    const modal = document.getElementById('dashboardModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Section 1: Journey Management
  async function showJourneyModal() {
    openModal(
      'My Journey Management',
      '<div class="loading">Loading your journey details...</div>'
    );

    const data = await fetchAPI('api/dashboard/journey.php');
    console.log('Journey API Response:', data);

    if (data.success) {
      const booking = data.booking || {};
      const payments = data.payments || [];
      console.log('Booking data:', booking);
      console.log('Payments data:', payments);

      const content = `
                <div class="journey-details">
                    <div class="booking-card">
                        <h3>Current Booking</h3>
                        ${
                          booking.id
                            ? `
                            <div class="booking-info">
                                <p><strong>Package:</strong> ${booking.package_name}</p>
                                <p><strong>Type:</strong> ${booking.package_type}</p>
                                <p><strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status}</span></p>
                                <p><strong>Total Amount:</strong> $${parseFloat(booking.total_amount).toFixed(2)}</p>
                                <p><strong>Amount Paid:</strong> $${parseFloat(booking.amount_paid).toFixed(2)}</p>
                                <p><strong>Balance:</strong> $${(parseFloat(booking.total_amount) - parseFloat(booking.amount_paid)).toFixed(2)}</p>
                            </div>
                        `
                            : '<p class="empty-state">No booking yet. Contact us to start your World Cup journey!</p>'
                        }
                    </div>
                    
                    <div class="payments-card">
                        <h3>Payment Schedule</h3>
                        ${
                          payments.length > 0
                            ? `
                            <table class="payments-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${payments
                                      .map(
                                        p => `
                                        <tr>
                                            <td>${p.payment_type}</td>
                                            <td>$${parseFloat(p.amount).toFixed(2)}</td>
                                            <td>${p.due_date || 'N/A'}</td>
                                            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                                        </tr>
                                    `
                                      )
                                      .join('')}
                                </tbody>
                            </table>
                        `
                            : '<p class="empty-state">No payment schedule available</p>'
                        }
                    </div>
                </div>
            `;

      openModal('My Journey Management', content);
    } else {
      openModal(
        'My Journey Management',
        '<p class="error-message">Failed to load journey details. Please try again.</p>'
      );
    }
  }

  // Section 2: Local Events
  async function showEventsModal() {
    openModal('Local Events & Watch Parties', '<div class="loading">Loading events...</div>');

    const data = await fetchAPI('api/dashboard/events.php');

    if (data.success && data.events) {
      const events = data.events;

      const content = `
                <div class="events-list">
                    ${
                      events.length > 0
                        ? events
                            .map(
                              event => `
                        <div class="event-card">
                            ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" class="event-image">` : ''}
                            <div class="event-content">
                                <h3>${event.title}</h3>
                                <p class="event-type">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    ${event.location} • ${event.venue}
                                </p>
                                <p class="event-date">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    ${new Date(event.start_date).toLocaleDateString()} at ${new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p class="event-description">${event.description}</p>
                                <div class="event-footer">
                                    <span class="event-price">${event.price > 0 ? '$' + parseFloat(event.price).toFixed(2) : 'Free'}</span>
                                    <span class="event-capacity">${event.capacity ? event.capacity + ' spots available' : 'Limited capacity'}</span>
                                </div>
                                <button class="btn btn--primary" onclick="registerForEvent(${event.id})">Register</button>
                            </div>
                        </div>
                    `
                            )
                            .join('')
                        : '<p class="empty-state">No events available at the moment. Check back soon!</p>'
                    }
                </div>
            `;

      openModal('Local Events & Watch Parties', content);
    } else {
      openModal(
        'Local Events & Watch Parties',
        '<p class="error-message">Failed to load events. Please try again.</p>'
      );
    }
  }

  // Section 3: Communication Hub
  function showCommunicationModal() {
    const content = `
            <div class="communication-hub">
                <div class="comm-card">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <h3>Instant Messaging</h3>
                    <p>Connect with fellow fans, share updates, and coordinate your World Cup experience in real-time.</p>
                    <button class="btn btn--stroke" onclick="openMessaging()">Open Messages</button>
                </div>
                
                <div class="comm-card">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                    <h3>Video Conferencing</h3>
                    <p>Host or join virtual meetups with other fans. Plan your trip together and build excitement!</p>
                    <button class="btn btn--stroke" onclick="startVideoCall()">Start Video Call</button>
                </div>
                
                <div class="comm-card">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <h3>Notification Center</h3>
                    <p>Stay updated with important announcements, payment reminders, and event notifications.</p>
                    <button class="btn btn--stroke" onclick="openNotifications()">View Notifications</button>
                </div>
            </div>
        `;

    openModal('Communication Hub', content);
  }

  // Section 4: Payments & Financing
  async function showFinancingModal() {
    const content = `
            <div class="modal-tabs">
                <button class="modal-tab active" onclick="switchFinancingTab('overview')">Overview</button>
                <button class="modal-tab" onclick="switchFinancingTab('progress')">Payment Progress</button>
                <button class="modal-tab" onclick="switchFinancingTab('tracking')">Loan Tracking</button>
                <button class="modal-tab" onclick="switchFinancingTab('apply')">Apply for Financing</button>
            </div>
            
            <!-- Overview Tab -->
            <div id="financing-overview" class="tab-panel active">
                <div style="text-align: center; padding: 40px 20px;">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" stroke-width="2" style="margin-bottom: 24px;">
                        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                        <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                    <h3 style="font-size: 28px; margin: 0 0 16px 0; color: #fff;">Financing Your World Cup Dream</h3>
                    <p style="font-size: 18px; color: #ccc; line-height: 1.8; max-width: 600px; margin: 0 auto 32px;">
                        We have partnered with leading banks to connect our network with favorable financing options negotiated by us to help you achieve your dream of attending the World Cup 2026.
                    </p>
                    <div class="financing-benefits" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 40px 0;">
                        <div class="benefit-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>Competitive interest rates</span>
                        </div>
                        <div class="benefit-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>Flexible terms (12-36 months)</span>
                        </div>
                        <div class="benefit-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>Quick approval process</span>
                        </div>
                        <div class="benefit-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>No prepayment penalties</span>
                        </div>
                    </div>
                    <button class="btn btn--primary" onclick="switchFinancingTab('apply')" style="padding: 16px 40px; font-size: 16px;">
                        See If I Am Eligible
                    </button>
                </div>
            </div>
            
            <!-- Payment Progress Tab -->
            <div id="financing-progress" class="tab-panel">
                <div style="padding: 20px;">
                    <h3 style="color: #fff; margin-bottom: 20px;">Your Payment Progress</h3>
                    <p class="empty-state">No active payment plans yet. Apply for financing to get started.</p>
                </div>
            </div>
            
            <!-- Loan Tracking Tab -->
            <div id="financing-tracking" class="tab-panel">
                <div style="padding: 20px;">
                    <h3 style="color: #fff; margin-bottom: 20px;">Loan Application Tracking</h3>
                    <p class="empty-state">No loan applications submitted yet.</p>
                </div>
            </div>
            
            <!-- Apply Tab -->
            <div id="financing-apply" class="tab-panel">
                <form id="financingRequestForm" class="financing-form">
                    <h3>Apply for Financing</h3>
                    
                    <div class="form-group">
                        <label for="requested_amount">Requested Amount *</label>
                        <input type="number" id="requested_amount" name="requested_amount" required min="100" step="0.01" placeholder="e.g., 2500.00">
                    </div>
                    
                    <div class="form-group">
                        <label for="monthly_income">Monthly Income *</label>
                        <input type="number" id="monthly_income" name="monthly_income" required min="0" step="0.01" placeholder="Your monthly income">
                    </div>
                    
                    <div class="form-group">
                        <label for="employment_status">Employment Status *</label>
                        <select id="employment_status" name="employment_status" required>
                            <option value="">Select...</option>
                            <option value="employed_full_time">Employed (Full-time)</option>
                            <option value="employed_part_time">Employed (Part-time)</option>
                            <option value="self_employed">Self-employed</option>
                            <option value="student">Student</option>
                            <option value="retired">Retired</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="employer_name">Employer Name</label>
                        <input type="text" id="employer_name" name="employer_name" placeholder="Company/Organization name">
                    </div>
                    
                    <div class="form-group">
                        <label for="preferred_term_months">Preferred Repayment Term *</label>
                        <select id="preferred_term_months" name="preferred_term_months" required>
                            <option value="">Select term...</option>
                            <option value="12">12 months</option>
                            <option value="18">18 months</option>
                            <option value="24">24 months</option>
                            <option value="36">36 months</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="purpose">Purpose of Financing *</label>
                        <textarea id="purpose" name="purpose" required rows="3" placeholder="Tell us why you're requesting financing..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="additional_info">Additional Information</label>
                        <textarea id="additional_info" name="additional_info" rows="3" placeholder="Any additional details you'd like to share..."></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn--primary">Submit Application</button>
                        <button type="button" class="btn btn--stroke" onclick="closeModal()">Cancel</button>
                    </div>
                </form>
            </div>
        `;

    openModal('Payments & Financing', content);

    // Attach form submit handler
    setTimeout(() => {
      const form = document.getElementById('financingRequestForm');
      if (form) {
        form.addEventListener('submit', handleFinancingSubmit);
      }
    }, 100);
  }

  // Switch financing tabs
  window.switchFinancingTab = function (tab) {
    // Hide all tab panels
    document
      .querySelectorAll(
        '#financing-overview, #financing-progress, #financing-tracking, #financing-apply'
      )
      .forEach(panel => {
        panel.classList.remove('active');
      });

    // Remove active class from all tabs
    document.querySelectorAll('.modal-tab').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab
    const tabMap = {
      overview: 'financing-overview',
      progress: 'financing-progress',
      tracking: 'financing-tracking',
      apply: 'financing-apply',
    };

    document.getElementById(tabMap[tab]).classList.add('active');
    event.target.classList.add('active');
  };

  // Handle financing form submission
  async function handleFinancingSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(BASE_URL + 'api/dashboard/financing.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        openModal(
          'Application Submitted',
          `
                    <div class="success-message">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <h3>Thank you for your application!</h3>
                        <p>Your financing request has been submitted successfully. Our team will review your application and get back to you within 48 hours.</p>
                        <button class="btn btn--primary" onclick="closeModal()">Close</button>
                    </div>
                `
        );
      } else {
        alert('Error: ' + (result.message || 'Failed to submit application'));
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    } catch (error) {
      console.error('Financing submission error:', error);
      alert('Failed to submit application. Please try again.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  // Section 5: Security & Compliance
  function showSecurityModal() {
    const content = `
            <div class="security-section">
                <h3>Your Data Security is Our Priority</h3>
                
                <div class="security-features">
                    <div class="security-item">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <h4>Bank-Level Encryption</h4>
                        <p>All your data is protected with 256-bit SSL encryption, the same security used by financial institutions.</p>
                    </div>
                    
                    <div class="security-item">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <h4>PCI DSS Compliant</h4>
                        <p>Our payment processing meets the highest standards for handling credit card information securely.</p>
                    </div>
                    
                    <div class="security-item">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <h4>Privacy Protected</h4>
                        <p>We comply with GDPR and international data protection regulations. Your personal information is never shared without consent.</p>
                    </div>
                    
                    <div class="security-item">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <h4>24/7 Monitoring</h4>
                        <p>Our security team monitors all systems around the clock to detect and prevent any potential threats.</p>
                    </div>
                </div>
                
                <div class="security-actions">
                    <button class="btn btn--stroke" onclick="window.open('/TFE/privacy-policy.php')">Read Privacy Policy</button>
                    <button class="btn btn--stroke" onclick="window.open('/TFE/terms.php')">Terms of Service</button>
                </div>
            </div>
        `;

    openModal('Security & Data Protection', content);
  }

  // Initialize modal system
  function init() {
    // Close modal on overlay click or close button
    document.addEventListener('click', e => {
      if (
        e.target.classList.contains('dashboard-modal-overlay') ||
        e.target.classList.contains('dashboard-modal-close') ||
        e.target.closest('.dashboard-modal-close')
      ) {
        closeModal();
      }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });

    // Attach click handlers to "Read More" buttons with data-service attribute
    document.querySelectorAll('.read-more-btn[data-service]').forEach(btn => {
      btn.addEventListener('click', function () {
        const service = this.dataset.service;

        switch (service) {
          case 'section-1':
            showJourneyModal();
            break;
          case 'section-2':
            showEventsModal();
            break;
          case 'section-3':
            showCommunicationModal();
            break;
          case 'section-4':
            showFinancingModal();
            break;
          case 'section-5':
            showSecurityModal();
            break;
          default:
            console.warn('Unknown service:', service);
        }
      });
    });
  }

  // Global functions for communication hub
  window.openMessaging = function () {
    // Switch to Messages tab in profile section
    const messagesTab = document.querySelector('[data-tab="messages"]');
    if (messagesTab) {
      messagesTab.click();
      closeModal();
      // Scroll to profile section
      document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  window.startVideoCall = function () {
    alert('Video conferencing feature coming soon!');
  };

  window.openNotifications = function () {
    // Trigger notifications dropdown
    const notifBtn = document.querySelector('[data-dropdown="notifications"]');
    if (notifBtn) {
      notifBtn.click();
      closeModal();
    }
  };

  window.registerForEvent = async function (eventId) {
    if (confirm('Would you like to register for this event?')) {
      try {
        const response = await fetch(BASE_URL + 'api/dashboard/events.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'register', event_id: eventId }),
        });

        const result = await response.json();

        if (result.success) {
          alert('Successfully registered for the event!');
          showEventsModal(); // Refresh the list
        } else {
          alert('Error: ' + (result.message || 'Failed to register'));
        }
      } catch (error) {
        console.error('Event registration error:', error);
        alert('Failed to register for event. Please try again.');
      }
    }
  };

  window.closeModal = closeModal;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
