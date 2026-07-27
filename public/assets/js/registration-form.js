/**
 * DEPRECATED: This file is kept for backward compatibility but is no longer actively used.
 * 
 * The registration form functionality has been consolidated into:
 * - assets/js/registration-unified.js (Main registration handler)
 * 
 * Please use registration-unified.js instead of this file.
 * This file may be removed in a future version.
 * 
 * Registration top controls are created and wired inside RegistrationFormHandler to avoid
 * duplication/conflict with the handler's own step state. Input validation listeners are
 * attached later within the handler's lifecycle.
 */

/**
 * Registration Form Handler
 * Handles multi-step registration form with validation and AJAX submission
 * @deprecated Use RegistrationFormHandler from registration-unified.js instead
 */
// Version marker for debugging — update when editing this file
window.REG_FORM_VERSION = window.REG_FORM_VERSION || '2025-10-03-001';
console.warn('registration-form.js is deprecated. Use registration-unified.js instead.');
console.log('registration-form.js loaded — REG_FORM_VERSION:', window.REG_FORM_VERSION);

class RegistrationFormHandler {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.form = document.getElementById('registerForm');
    // Success UI defaults (can be overridden via data attributes on the form)
    this.successConfig = {
      message:
        'Thanks — we have captured your registration. We will reach out once features are available.',
      redirectUrl: '/',
      delay: 2000,
    };
    this.nextBtn = document.getElementById('nextStep');
    this.prevBtn = document.getElementById('prevStep');
    this.submitBtn = document.getElementById('submitForm');
    this.resumeBtn = document.getElementById('resumeButton');
    this.teamGrid = document.querySelector('.team-grid'); // Define teamGrid as a class property

    // Check if required elements exist
    if (!this.form) {
      console.warn('RegistrationFormHandler: registerForm not found');
      return;
    }

    // Form data storage
    this.formData = {};

    // Initialize additional services
    this.searchableDropdowns = new Map();
    // Prefer namespaced helpers if available to avoid global conflicts
    const SmartDefaultsCtor =
      (window.FormHelpers && window.FormHelpers.resolve('SmartDefaults')) ||
      window.SmartDefaults ||
      null;
    const MicroInteractionsCtor =
      (window.FormHelpers && window.FormHelpers.resolve('MicroInteractions')) ||
      window.MicroInteractions ||
      null;
    this.smartDefaults = SmartDefaultsCtor ? new SmartDefaultsCtor() : null;
    this.microInteractions = MicroInteractionsCtor ? new MicroInteractionsCtor() : null;
    this.enhancedValidator = new EnhancedValidator();

    this.init();
  }

  init() {
    console.log('RegistrationFormHandler.init — REG_FORM_VERSION:', window.REG_FORM_VERSION);
    this.bindEvents();
    // Load any saved state first so the UI can render the correct step
    this.loadFormState();
    this.updateStepDisplay();

    // Read success UI overrides from form data attributes (if present)
    if (this.form) {
      const msg = this.form.dataset.successMessage;
      const url = this.form.dataset.successRedirect;
      const d = this.form.dataset.successDelay;
      if (msg) {
        this.successConfig.message = msg;
      }
      if (url) {
        this.successConfig.redirectUrl = url;
      }
      if (d && !isNaN(parseInt(d))) {
        this.successConfig.delay = parseInt(d);
      }
    }

    // Wait for country data and DOM to be ready before initializing searchable dropdowns
    const initDropdowns = () => {
      if (
        window.CountryData &&
        window.CountryData.countries &&
        window.CountryData.countries.length > 0
      ) {
        this.initializeSearchableDropdowns();
      } else {
        setTimeout(initDropdowns, 50);
      }
    };
    setTimeout(initDropdowns, 100);

    // Attach input/change listeners to run validation-only (no auto-advance)
    const steps = Array.from(document.querySelectorAll('.form-step'));
    steps.forEach(step => {
      const inputs = Array.from(step.querySelectorAll('input, select, textarea'));
      inputs.forEach(inp => {
        const name = inp.getAttribute('name') || '';
        const type = (inp.getAttribute('type') || '').toLowerCase();
        if (type === 'date' || name === 'date_of_birth') {
          inp.addEventListener('blur', () => this.validateCurrentStep());
        } else if (type === 'tel' || type === 'text' || type === 'email' || type === 'password') {
          inp.addEventListener('input', () => this.validateCurrentStep());
        }
        inp.addEventListener('change', () => this.validateCurrentStep());
      });
    });

    // Create and wire top controls here so they have accurate access to this.currentStep
    const pageTitle = document.querySelector('h1');
    if (pageTitle) {
      const topControls = document.createElement('div');
      topControls.className =
        'registration-top-controls d-flex justify-content-between align-items-center mb-3';
      topControls.setAttribute('role', 'toolbar');
      topControls.innerHTML = `
                <div>
                    <button type="button" class="registration-control-btn registration-prev" id="topPrev">Previous</button>
                    <button type="button" class="registration-control-btn registration-reset" id="topReset">Reset</button>
                </div>
                <div>
                    <button type="button" class="registration-control-btn registration-next" id="topNext">Next</button>
                </div>
            `;
      pageTitle.parentNode.insertBefore(topControls, pageTitle.nextSibling);

      const topPrev = topControls.querySelector('#topPrev');
      const topNext = topControls.querySelector('#topNext');
      // Initialize topNext text/class based on current step
      try {
        if (topNext) {
          if (this.currentStep === this.totalSteps) {
            topNext.textContent = 'Finish application';
            topNext.classList.add('is-final');
          } else {
            topNext.textContent = 'Next';
            topNext.classList.remove('is-final');
          }
        }
      } catch {
        /* ignore */
      }
      if (topPrev)
        topPrev.addEventListener('click', () => {
          topControls.classList.remove('controls-has-error');
          this.prevStep();
        });
      // Reset button clears local state and resets the form
      const topReset = topControls.querySelector('#topReset');
      if (topReset)
        topReset.addEventListener('click', () => {
          if (confirm('Reset the registration form? This will clear saved progress.')) {
            this.resetForm();
            localStorage.removeItem('registrationFormData');
            localStorage.removeItem('registrationCurrentStep');
            topControls.classList.remove('controls-has-error');
          }
        });
      if (topNext)
        topNext.addEventListener('click', () => {
          if (!this.validateCurrentStep()) {
            topControls.classList.add('controls-has-error');
            const firstInvalid = document
              .querySelector('.form-step.active')
              .querySelector(
                'input:required:invalid, select:required:invalid, textarea:required:invalid'
              );
            if (firstInvalid) firstInvalid.focus({ preventScroll: true });
            return;
          }
          topControls.classList.remove('controls-has-error');
          if (this.currentStep === this.totalSteps) {
            // Use AJAX submission path to keep behavior consistent (avoid full-page POST)
            try {
              this.handleSubmit(new Event('submit'));
            } catch {
              // Fallback to standard submit if AJAX path fails
              if (this.form) {
                if (typeof this.form.requestSubmit === 'function') {
                  this.form.requestSubmit();
                } else {
                  this.form.submit();
                }
              }
            }
            return;
          }
          this.nextStep();
        });
      window.__registrationTopControls = topControls;
      // Ensure UI reflects current step now that controls exist
      try {
        this.updateStepDisplay();
        this.updateProgress();
      } catch {
        /* ignore */
      }
    }
  }

  // Safe DOM query helpers to avoid throwing on invalid selectors
  safeQuery(selector) {
    try {
      return document.querySelector(selector);
    } catch (err) {
      console.error('safeQuery: invalid selector', selector, err);
      return null;
    }
  }

  safeQueryAll(selector) {
    try {
      return document.querySelectorAll(selector);
    } catch {
      console.error('safeQueryAll: invalid selector', selector);
      return [];
    }
  }

  initializeSearchableDropdowns() {
    // Check if dropdowns are already initialized to prevent duplication
    if (this.searchableDropdowns.has('countryCode') || this.searchableDropdowns.has('country')) {
      console.log('Searchable dropdowns already initialized, skipping...');
      return;
    }

    console.log('Initializing searchable dropdowns...');

    // Initialize country code dropdown
    const countryCodeSelect = document.getElementById('countryCodeSelect');
    console.log('countryCodeSelect:', countryCodeSelect);
    console.log('window.CountryData:', window.CountryData);
    if (countryCodeSelect && window.CountryData && window.CountryData.countries) {
      console.log('Attempting to create countryCodeDropdown.');
      const countryCodeDropdown = new SearchableDropdown(countryCodeSelect, {
        placeholder: 'Select country code...',
        noResultsText: 'No country codes found',
        data: window.CountryData.countries.map(c => ({
          value: c.code,
          text: `${c.text} (${c.code})`,
        })),
      });
      this.searchableDropdowns.set('countryCode', countryCodeDropdown);
      console.log('countryCodeDropdown created:', countryCodeDropdown);
    }

    // Initialize country dropdown
    const countrySelect = document.getElementById('countrySelect');
    console.log('countrySelect:', countrySelect);
    if (countrySelect && window.CountryData && window.CountryData.countries) {
      console.log('Attempting to create countryDropdown.');
      const countryDropdown = new SearchableDropdown(countrySelect, {
        placeholder: 'Select your country...',
        noResultsText: 'No countries found',
        data: window.CountryData.countries.map(c => ({ value: c.value, text: c.text })),
      });
      this.searchableDropdowns.set('country', countryDropdown);
      console.log('countryDropdown created:', countryDropdown);
    }

    // Initialize team selection as searchable dropdown
    this.initializeTeamSelection();
  }

  initializeTeamSelection() {
    const teamSupportInput = document.getElementById('teamSupport');

    if (!this.teamGrid || !teamSupportInput) {
      return;
    }

    // Create a hidden select for team selection
    const teamSelect = document.createElement('select');
    teamSelect.id = 'teamSelect';
    teamSelect.name = 'team_support';
    teamSelect.style.display = 'none';

    // Add team options
    const teams = [
      'Brazil',
      'Argentina',
      'France',
      'Germany',
      'Spain',
      'England',
      'Portugal',
      'Netherlands',
      'Italy',
      'Other',
    ];

    teams.forEach(team => {
      const option = document.createElement('option');
      option.value = team;
      option.textContent = team;
      teamSelect.appendChild(option);
    });

    // Insert select before team grid
    this.teamGrid.parentNode.insertBefore(teamSelect, this.teamGrid);

    // Initialize searchable dropdown for teams
    const teamDropdown = new SearchableDropdown(teamSelect, {
      placeholder: 'Select your team...',
      noResultsText: 'No teams found',
      popularCountries: ['Brazil', 'Argentina', 'France', 'Germany', 'Spain', 'England'],
    });

    this.searchableDropdowns.set('team', teamDropdown);

    // Update team grid to work with dropdown
    this.bindTeamSelection();
  }

  bindEvents() {
    // Footer controls removed — top controls handle navigation. Keep handlers safe if elements exist.
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextStep());
    }
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prevStep());
    }

    // Form submission
    this.form.addEventListener('submit', e => this.handleSubmit(e));

    // Live validation
    this.form.addEventListener('input', e => this.validateField(e.target));
    this.form.addEventListener('change', e => this.validateField(e.target));

    // Team selection
    this.bindTeamSelection();

    // Financing options
    this.bindFinancingOptions();

    // Resume functionality
    if (this.resumeBtn) {
      this.resumeBtn.addEventListener('click', () => this.resumeForm());
    }

    // Modal events
    this.bindModalEvents();
  }

  bindTeamSelection() {
    console.log('bindTeamSelection called.');
    const teamOptions = document.querySelectorAll('.team-option');
    const teamSupportInput = document.getElementById('teamSupport');
    const teamDropdown = this.searchableDropdowns.get('team');

    if (!this.teamGrid || !teamSupportInput) {
      console.warn('Team grid or input not found in bindTeamSelection.');
      return;
    }

    teamOptions.forEach(option => {
      option.addEventListener('click', () => {
        console.log('Team option clicked:', option.dataset.team);
        // Remove previous selection
        teamOptions.forEach(opt => opt.classList.remove('selected'));

        // Add selection to clicked option
        option.classList.add('selected');

        // Update hidden input
        const teamName = option.dataset.team;
        teamSupportInput.value = teamName;

        // Update searchable dropdown
        if (teamDropdown) {
          teamDropdown.setValue(teamName);
        }

        // Clear validation error
        this.clearFieldError('teamSupport');
        // Dispatch change so validation listeners pick it up
        try {
          const ev = new Event('change', { bubbles: true });
          teamSupportInput.dispatchEvent(ev);
        } catch (err) {
          console.warn('Could not dispatch change event for teamSupport', err);
        }
      });
    });

    // Listen for dropdown changes
    if (teamDropdown) {
      const teamSelect = document.getElementById('teamSelect');
      teamSelect.addEventListener('change', () => {
        const selectedTeam = teamSelect.value;
        teamSupportInput.value = selectedTeam;

        // Update visual selection
        teamOptions.forEach(opt => {
          opt.classList.remove('selected');
          if (opt.dataset.team === selectedTeam) {
            opt.classList.add('selected');
          }
        });
      });
    }
  }

  bindFinancingOptions() {
    const financingRadios = document.querySelectorAll('input[name="seeking_financing"]');
    const employmentSection = document.getElementById('employmentSection');
    const loanSection = document.getElementById('loanSection');
    const bankingConsentSection = document.getElementById('bankingConsentSection');

    financingRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === '1') {
          employmentSection.style.display = 'block';
          loanSection.style.display = 'block';
          bankingConsentSection.style.display = 'block';
          // If user chose Yes, do not auto-advance — wait for additional fields
        } else {
          employmentSection.style.display = 'none';
          loanSection.style.display = 'none';
          bankingConsentSection.style.display = 'none';

          // Clear related fields
          this.clearRadioGroup('employment_status');
          this.clearRadioGroup('loan_return_period');
          const banking = document.getElementById('banking_consent');
          if (banking) banking.checked = false;

          // If user explicitly chose No, just validate the step visually; do not auto-advance.
          try {
            this.validateCurrentStep();
          } catch (err) {
            console.warn('Validation after financing No failed', err);
          }
        }
      });
    });

    // Bind radio option selections
    this.bindRadioOptions('employment_status');
    this.bindRadioOptions('loan_return_period');
  }

  bindRadioOptions(name) {
    if (!name || typeof name !== 'string') {
      return;
    }
    const radios = document.querySelectorAll('input[name="' + name + '"]');

    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        try {
          const sel = '.financing-option[data-option="' + CSS.escape(radio.value) + '"]';
          const option = document.querySelector(sel);
          if (option) {
            // Clear other options in same group
            radios.forEach(r => {
              const sel2 = '.financing-option[data-option="' + CSS.escape(r.value) + '"]';
              const opt = document.querySelector(sel2);
              if (opt) {
                opt.classList.remove('selected');
              }
            });
            // Select current option
            option.classList.add('selected');
          }
        } catch (err) {
          console.warn('bindRadioOptions: selector error', err);
        }
      });
    });
  }

  // Clear radio group selections and remove visual selected state
  clearRadioGroup(name) {
    if (!name || typeof name !== 'string') return;
    try {
      const radios = document.querySelectorAll('input[name="' + name + '"]');
      radios.forEach(r => {
        try {
          r.checked = false;
        } catch {}
        try {
          const sel = '.financing-option[data-option="' + CSS.escape(r.value) + '"]';
          const opt = document.querySelector(sel);
          if (opt) opt.classList.remove('selected');
        } catch {}
      });
    } catch (err) {
      console.warn('clearRadioGroup failed for', name, err);
    }
  }

  bindModalEvents() {
    const modal =
      document.getElementById('registrationModal') || document.getElementById('registerModal');
    if (modal && typeof bootstrap !== 'undefined') {
      // When modal is shown, mark the background inert to assist screen readers and prevent focus leakage
      modal.addEventListener('show.bs.modal', () => {
        document
          .querySelectorAll('body > *:not(.modal-backdrop):not(#' + modal.id + ')')
          .forEach(el => {
            try {
              el.inert = true;
            } catch {
              el.setAttribute('aria-hidden', 'true');
            }
          });
      });
      modal.addEventListener('hidden.bs.modal', () => {
        // Restore inert/aria-hidden and reset form
        document
          .querySelectorAll('body > *:not(.modal-backdrop):not(#' + modal.id + ')')
          .forEach(el => {
            try {
              el.inert = false;
            } catch {
              el.removeAttribute('aria-hidden');
            }
          });
        this.resetForm();
      });
    }
  }

  nextStep() {
    this.navigationDirection = 'next';
    if (this.validateCurrentStep()) {
      this.saveFormState();
      this.currentStep++;
      this.updateStepDisplay();
      this.updateProgress();
    }
  }

  prevStep() {
    this.navigationDirection = 'prev';
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepDisplay();
      this.updateProgress();
    }
  }

  validateCurrentStep() {
    const currentStepElement =
      document.querySelector(`.form-step[data-step="${this.currentStep}"]`) ||
      document.querySelector('.form-step.active');
    let requiredFields = [];
    if (currentStepElement) {
      requiredFields = currentStepElement.querySelectorAll('[required]');
    } else {
      console.warn(
        `validateCurrentStep: step element for step ${
          this.currentStep
        } not found; skipping required - field collection.`
      );
      requiredFields = [];
    }
    let isValid = true;

    // Special validation for Country Code and Country dropdowns (Step 1)
    if (this.currentStep === 1) {
      console.log('Validating Step 1 special fields...');
      const countryCodeSelect = this.searchableDropdowns.get('countryCode')
        ? this.searchableDropdowns.get('countryCode').originalSelect
        : null;
      const countrySelect = this.searchableDropdowns.get('country')
        ? this.searchableDropdowns.get('country').originalSelect
        : null;

      if (countryCodeSelect && !countryCodeSelect.value) {
        this.showFieldError('country_code', 'Please select a country code.');
        isValid = false;
        console.log('Country Code validation failed.', countryCodeSelect);
      } else if (countryCodeSelect) {
        this.clearFieldError('country_code');
        console.log('Country Code validation passed.');
      }

      if (countrySelect && !countrySelect.value) {
        this.showFieldError('country', 'Please select your country.');
        isValid = false;
        console.log('Country validation failed.', countrySelect);
      } else if (countrySelect) {
        this.clearFieldError('country');
        console.log('Country validation passed.');
      }
    }

    // Special validation for team selection
    if (this.currentStep === 2) {
      console.log('Validating Step 2 special fields...');
      const teamSupport = document.getElementById('teamSupport').value;
      if (!teamSupport) {
        this.showFieldError('teamSupport', "Please select a team you'll be supporting.");
        isValid = false;
        console.log('Team Support validation failed.');
      } else {
        this.clearFieldError('teamSupport');
        console.log('Team Support validation passed.');
      }
    }

    // Validate required fields
    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    // Special validation for financing options
    if (this.currentStep === 3) {
      console.log('Validating Step 3 special fields...');
      const seekingFinancing = document.querySelector('input[name="seeking_financing"]:checked');
      if (!seekingFinancing) {
        this.showFieldError('seeking_financing', "Please select whether you're seeking financing.");
        isValid = false;
        console.log('Seeking Financing validation failed.');
      } else if (seekingFinancing.value === '1') {
        // Validate employment status and loan period if seeking financing
        const employmentStatus = document.querySelector('input[name="employment_status"]:checked');
        const loanPeriod = document.querySelector('input[name="loan_return_period"]:checked');

        if (!employmentStatus) {
          this.showFieldError('employment_status', 'Please select your employment status.');
          isValid = false;
          console.log('Employment Status validation failed.');
        }

        if (!loanPeriod) {
          this.showFieldError('loan_return_period', 'Please select your ideal loan return period.');
          isValid = false;
          console.log('Loan Period validation failed.');
        }
      } else {
        console.log('Seeking Financing validation passed.');
      }
    }

    console.log(`Overall validation for Step ${this.currentStep}: ${isValid}`);
    return isValid;
  }

  validateField(field) {
    console.log(
      `Validating field: ${field.name || field.id || field.type}, current value: ${field.value}`
    );
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      errorMessage = field.getAttribute('data-error') || 'This field is required.';
      isValid = false;
      console.log(`Field ${field.name}: Required field empty.`);
      if (!field.name) {
        // Less restrictive check
        console.trace(
          'Required field with undefined or empty name detected during validation.',
          field
        );
      }
    }

    // Email validation (basic format check)
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errorMessage = 'Please enter a valid email address.';
        isValid = false;
        console.log(`Field ${field.name}: Invalid email format.`);
      }
    }

    // Phone validation: count digits only and validate against min length
    if (field.type === 'tel' && value) {
      const digits = value.replace(/\D/g, '');
      if (digits.length < 8) {
        errorMessage = 'Please enter a valid phone number.';
        isValid = false;
        console.log(`Field ${field.name}: Invalid phone number format or length.`);
      }
    }

    // Date validation
    if (field.type === 'date' && value) {
      const selectedDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - selectedDate.getFullYear();
      const m = today.getMonth() - selectedDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
        age--;
      }

      if (age < 18) {
        errorMessage = 'You must be at least 18 years old to register.';
        isValid = false;
        console.log(`Field ${field.name}: Age less than 18.`);
      } else if (age > 100) {
        errorMessage = 'Please enter a valid date of birth.';
        isValid = false;
        console.log(`Field ${field.name}: Age greater than 100.`);
      }
    }

    // Update field appearance
    if (isValid) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      this.clearFieldError(field.name);
    } else {
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');
      this.showFieldError(field.name, errorMessage);
    }

    return isValid;
  }

  showFieldError(fieldName, message) {
    const field = document.querySelector(`[name = "${fieldName}"]`);
    if (field) {
      const errorElement =
        field.parentNode.querySelector('.invalid-feedback') ||
        document.getElementById(`${fieldName}Error`);
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      }
    }
  }

  clearFieldError(fieldName) {
    const field = document.querySelector(`[name = "${fieldName}"]`);
    if (field) {
      const errorElement =
        field.parentNode.querySelector('.invalid-feedback') ||
        document.getElementById(`${fieldName}Error`);
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    }
  }

  updateStepDisplay() {
    // Hide all steps and remove active class to avoid overlap issues
    const formSteps = document.querySelectorAll('.form-step');
    if (formSteps.length === 0) return;

    formSteps.forEach(step => {
      step.classList.remove('active');
      try {
        step.style.display = 'none';
      } catch {}
    });

    // Animate transition between steps (fade + slight slide)
    const newStepSelector = `.form-step[data-step="${this.currentStep}"]`;
    console.log('updateStepDisplay: looking for selector ->', newStepSelector);
    const newStepElement = (function () {
      try {
        return document.querySelector(newStepSelector);
      } catch (err) {
        console.error('updateStepDisplay: querySelector failed for', newStepSelector, err);
        return null;
      }
    })();
    const previousElement = document.querySelector('.form-step.active');
    if (previousElement && previousElement !== newStepElement) {
      // fade out previous
      previousElement.style.transition = 'opacity 220ms ease, transform 220ms ease';
      previousElement.style.opacity = '0';
      previousElement.style.transform = 'translateX(-8px)';
      setTimeout(() => {
        previousElement.classList.remove('active');
        previousElement.style.opacity = '';
        previousElement.style.transform = '';
        // Ensure the previous step is hidden from layout (remove any inline display)
        try {
          previousElement.style.display = 'none';
        } catch {}
      }, 220);
    }

    if (newStepElement) {
      // prepare and show new
      newStepElement.classList.add('active');
      // Ensure only the new step is visible in layout
        try {
          newStepElement.style.display = 'block';
          newStepElement.removeAttribute('aria-hidden');
        } catch {}

      newStepElement.style.opacity = '0';
      newStepElement.style.transform = 'translateX(8px)';
      newStepElement.style.transition = 'opacity 260ms ease, transform 260ms ease';

      // Diagnostic: log child count and computed styles; if content exists but height is zero, force a minHeight
      try {
        const inner = (newStepElement.innerText || newStepElement.textContent || '').trim();
        const childCount = newStepElement.childElementCount;
        const cs = window.getComputedStyle(newStepElement);
        const rect = newStepElement.getBoundingClientRect();
        console.log(
          'updateStepDisplay: newStep childCount=',
          childCount,
          'textLength=',
          inner.length,
          'display=',
          cs.display,
          'height=',
          rect.height
        );

        if (childCount === 0 || !inner || inner.length < 5 || rect.height < 8) {
          console.warn(
            'updateStepDisplay: new step appears empty or collapsed — attempting to expand for visibility',
            newStepElement
          );
          try {
            newStepElement.style.display = 'block';
            newStepElement.style.height = 'auto';
            newStepElement.style.overflow = 'visible';

            // compute combined height of children to set an explicit minHeight
            const children = Array.from(newStepElement.children);
            let total = 0;
            for (const c of children) {
              // force layout for child
              const ch = c.scrollHeight || c.offsetHeight || 0;
              total += ch;
              // if child is absolutely positioned, reset to relative to bring into flow
              const cs = window.getComputedStyle(c);
              if (cs.position === 'absolute') {
                c.style.position = 'relative';
              }
            }
            if (total > 8) {
              newStepElement.style.minHeight = total + 40 + 'px';
            } else {
              newStepElement.style.minHeight = '320px';
            }
            // Ensure all child nodes are visible (defensive against animation libraries hiding children)
            try {
              const children = Array.from(newStepElement.querySelectorAll('*'));
              children.forEach(c => {
                try {
                  c.style.display = c.style.display || '';
                } catch {}
                try {
                  c.style.visibility = c.style.visibility || '';
                } catch {}
                try {
                  c.removeAttribute('aria-hidden');
                } catch {}
              });
            } catch {}
          } catch (err) {
            console.error('updateStepDisplay: failed to expand collapsed step', err);
          }
        }
      } catch (err) {
        console.error('updateStepDisplay diagnostic failed', err);
      }

      // animate in using requestAnimationFrame to avoid forced reflow and then ensure it's in view
      requestAnimationFrame(() => {
        newStepElement.style.opacity = '1';
        newStepElement.style.transform = 'translateX(0)';
        setTimeout(() => {
          newStepElement.style.opacity = '';
          newStepElement.style.transform = '';
          newStepElement.style.transition = '';
          // Defensive: if height is still collapsed after animations by other libs, expand explicitly
          const ensureExpanded = () => {
            try {
              const rect2 = newStepElement.getBoundingClientRect();
              if (rect2.height < 8) {
                // compute combined height of visible children
                const children = Array.from(newStepElement.children || []);
                let total = 0;
                children.forEach(c => {
                  const h = c.scrollHeight || c.offsetHeight || 0;
                  total += h;
                  // make sure child is in flow
                  try {
                    c.style.position = c.style.position || '';
                  } catch {}
                });
                // fallback using text length if children heights are zero
                const innerLen =
                  (newStepElement.innerText || newStepElement.textContent || '').length || 0;
                let minH;
                if (total > 8) {
                  minH = Math.max(320, total + 40);
                } else if (innerLen > 80) {
                  // estimate height from text length
                  minH = Math.min(
                    Math.max(420, Math.round(innerLen * 0.6)),
                    Math.round(window.innerHeight * 0.8)
                  );
                } else {
                  minH = Math.max(320, Math.round(window.innerHeight * 0.3));
                }
                // If normal children measurement failed, use a cloned measurement in the document flow
                let measuredHeight = minH;
                try {
                  const clone = newStepElement.cloneNode(true);
                  clone.style.position = 'absolute';
                  clone.style.visibility = 'hidden';
                  clone.style.height = 'auto';
                  clone.style.maxHeight = 'none';
                  clone.style.transform = 'none';
                  clone.style.opacity = '1';
                  clone.style.left = '-9999px';
                  clone.style.width =
                    Math.max(newStepElement.getBoundingClientRect().width, 600) + 'px';
                  document.body.appendChild(clone);
                  const clHeight = clone.scrollHeight || clone.offsetHeight || 0;
                  if (clHeight > 8) measuredHeight = Math.max(minH, clHeight + 40);
                  clone.remove();
                } catch {
                  // fallback to computed minH
                }
                newStepElement.style.minHeight = measuredHeight + 'px';
                newStepElement.style.height = 'auto';
                newStepElement.style.overflow = 'visible';
                newStepElement.style.visibility = 'visible';
                newStepElement.style.display = 'block';
                // Also ensure ancestors are not clipping content (defensive)
                try {
                  let p = newStepElement.parentElement;
                  let depth = 0;
                  while (p && p !== document.body && depth < 12) {
                    try {
                      p.style.overflow = p.style.overflow || 'visible';
                      p.style.height = p.style.height || 'auto';
                      p.style.minHeight = p.style.minHeight || 'auto';
                      p.style.display = p.style.display || 'block';
                      p.style.visibility = p.style.visibility || 'visible';
                      p.style.transform = p.style.transform || '';
                    } catch {
                      // ignore style set errors
                    }
                    p = p.parentElement;
                    depth++;
                  }
                } catch {}
              }
            } catch {
              // ignore
            }
          };
          ensureExpanded();
          setTimeout(ensureExpanded, 350);
        }, 300);
        try {
          newStepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch {}
      });
    }

    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
      step.classList.remove('active', 'completed');
      if (index + 1 === this.currentStep) {
        step.classList.add('active');
      } else if (index + 1 < this.currentStep) {
        step.classList.add('completed');
      }
    });

    // Update navigation buttons (visibility + accessibility)
    if (this.prevBtn) {
      const showPrev = this.currentStep > 1;
      this.prevBtn.style.display = showPrev ? 'inline-block' : 'none';
      this.prevBtn.disabled = !showPrev;
      this.prevBtn.setAttribute('aria-hidden', (!showPrev).toString());
    }
    if (this.nextBtn) {
      const showNext = this.currentStep < this.totalSteps;
      this.nextBtn.style.display = showNext ? 'inline-block' : 'none';
      this.nextBtn.disabled = !showNext;
      this.nextBtn.setAttribute('aria-hidden', (!showNext).toString());
      // Update top next button text if present
      try {
        const topControls = window.__registrationTopControls;
        if (topControls) {
          const topNext = topControls.querySelector('#topNext');
          if (topNext) {
            if (this.currentStep === this.totalSteps) {
              topNext.textContent = 'Finish application';
              topNext.classList.add('is-final');
            } else {
              topNext.textContent = 'Next';
              topNext.classList.remove('is-final');
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
    if (this.submitBtn) {
      const showSubmit = this.currentStep === this.totalSteps;
      this.submitBtn.style.display = showSubmit ? 'inline-block' : 'none';
      this.submitBtn.disabled = !showSubmit;
      this.submitBtn.setAttribute('aria-hidden', (!showSubmit).toString());
    }
    // Ensure top control reflects final-step state as well (defensive)
    try {
      const topControls = window.__registrationTopControls;
      if (topControls) {
        const topNext = topControls.querySelector('#topNext');
        if (topNext) {
          if (this.currentStep === this.totalSteps) {
            topNext.classList.add('is-final');
            topNext.textContent = 'Finish application';
          } else {
            topNext.classList.remove('is-final');
            topNext.textContent = 'Next';
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  updateProgress() {
    const percentage = (this.currentStep / this.totalSteps) * 100;
    const progressBar = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    const currentStepNumber = document.getElementById('currentStepNumber');

    // Safety checks for missing elements
    if (!progressBar) return;

    if (progressBar) {
      // Use compact percent string (no extra spaces) so CSS width parses reliably
      progressBar.style.width = `${percentage}%`;
    }

    if (progressPercentage) {
      // Show clean percentage (no trailing spaces)
      progressPercentage.textContent = `${Math.round(percentage)}%`;
    }

    if (currentStepNumber) {
      currentStepNumber.textContent = this.currentStep;
    }

    // Update estimated time
    const estimatedTime = document.getElementById('estimatedTime');
    if (estimatedTime) {
      const remainingSteps = this.totalSteps - this.currentStep;
      const timePerStep = 1; // minutes
      const remainingTime = remainingSteps * timePerStep;
      estimatedTime.textContent = `~${remainingTime} min remaining`;
    }
  }

  saveFormState() {
    const formData = new FormData(this.form);
    this.formData = Object.fromEntries(formData.entries());
    localStorage.setItem('registrationFormData', JSON.stringify(this.formData));
    localStorage.setItem('registrationCurrentStep', this.currentStep.toString());
  }

  loadFormState() {
    const savedData = localStorage.getItem('registrationFormData');
    const savedStep = localStorage.getItem('registrationCurrentStep');

    if (savedData && savedStep) {
      this.formData = JSON.parse(savedData);
      this.currentStep = parseInt(savedStep);

      // Populate form fields
      Object.entries(this.formData).forEach(([name, value]) => {
        const field = document.querySelector(`[name = "${name}"]`);
        if (field) {
          if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = value === '1' || value === field.value;
          } else {
            field.value = value;
          }
        }
      });

      // Update team selection (be defensive: escape value and guard selector)
      if (this.formData.team_support) {
        let teamOption = null;
        try {
          teamOption = document.querySelector(
            '[data-team="' + CSS.escape(this.formData.team_support) + '"]'
          );
        } catch (err) {
          console.error(
            'loadFormState: invalid team selector for',
            this.formData.team_support,
            err
          );
        }
        if (teamOption) {
          teamOption.classList.add('selected');
        }
      }

      // Show resume button
      if (this.resumeBtn) {
        this.resumeBtn.style.display = 'inline-block';
      }

      this.updateStepDisplay();
      this.updateProgress();
    }
  }

  resumeForm() {
    this.loadFormState();
    const modal = new bootstrap.Modal(document.getElementById('registrationModal'));
    modal.show();
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateCurrentStep()) {
      return;
    }

    // Show loading state
    this.submitBtn.disabled = true;
    this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Processing...';

    try {
      // Ensure privacy and dropdown values are present before building FormData
      try {
        // Sync privacy_policy_agreed to match terms_agreed (some integrations use separate privacy flag)
        let privacyInput = this.form.querySelector('input[name="privacy_policy_agreed"]');
        const termsInput = this.form.querySelector('input[name="terms_agreed"]');
        if (!privacyInput) {
          privacyInput = document.createElement('input');
          privacyInput.type = 'hidden';
          privacyInput.name = 'privacy_policy_agreed';
          this.form.appendChild(privacyInput);
        }
        privacyInput.value = termsInput && termsInput.checked ? '1' : '0';

        // If searchable dropdowns exist but their underlying selects were created outside the form,
        // ensure their values are included in the submission by adding them to FormData explicitly.
      } catch (e) {
        console.warn('prepare submit sync failed', e);
      }

      const formData = new FormData(this.form);
      try {
        const countryDropdown = this.searchableDropdowns.get('country');
        const codeDropdown = this.searchableDropdowns.get('countryCode');
        if (countryDropdown && !formData.get('country')) {
          formData.append(
            'country',
            countryDropdown.originalSelect ? countryDropdown.originalSelect.value : ''
          );
        }
        if (codeDropdown && !formData.get('country_code')) {
          formData.append(
            'country_code',
            codeDropdown.originalSelect ? codeDropdown.originalSelect.value : ''
          );
        }
        // Ensure terms_agreed is present
        if (!formData.get('terms_agreed')) {
          const t = this.form.querySelector('input[name="terms_agreed"]');
          if (t) formData.append('terms_agreed', t.checked ? '1' : '0');
        }
        // Ensure privacy present
        if (!formData.get('privacy_policy_agreed')) {
          const p = this.form.querySelector('input[name="privacy_policy_agreed"]');
          if (p) formData.append('privacy_policy_agreed', p.value);
        }
      } catch (e) {
        console.warn('augment FormData failed', e);
      }
      const response = await fetch(this.form.action, {
        method: 'POST',
        body: formData,
      });

      // Server may return HTML + JSON (page markup + JSON appended) when the
      // handler is in the same file as the page. Attempt robust parsing:
      const raw = await response.text();
      let result;
      try {
        result = JSON.parse(raw);
      } catch (err) {
        // Try to extract trailing JSON object from response text
        const jsonStart = raw.lastIndexOf('{');
        if (jsonStart !== -1) {
          try {
            result = JSON.parse(raw.substring(jsonStart));
          } catch (err2) {
            console.error('Registration parse error (extraction failed):', err2);
            throw err2;
          }
        } else {
          console.error('Registration parse error:', err);
          throw err;
        }
      }

      if (result.success) {
        // Clear saved form state
        localStorage.removeItem('registrationFormData');
        localStorage.removeItem('registrationCurrentStep');

        // Show configurable success message
        this.showMessage('success', this.successConfig.message);

        // Animate modal body then redirect after configured delay
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
          modalBody.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          modalBody.style.opacity = '0.92';
          modalBody.style.transform = 'scale(0.995)';
        }

        setTimeout(() => {
          const modal = bootstrap.Modal.getInstance(document.getElementById('registrationModal'));
          if (modal) modal.hide();
          this.resetForm();
          // show toast and redirect
          this.showSuccessToast(
            this.successConfig.message,
            this.successConfig.redirectUrl,
            this.successConfig.delay
          );
        }, this.successConfig.delay);
      } else {
        this.showMessage('error', result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showMessage('error', 'An error occurred. Please try again.');
    } finally {
      // Reset button state
      this.submitBtn.disabled = false;
      this.submitBtn.innerHTML = '<i class="fas fa-check me-1"></i>Complete Registration';
    }
  }

  showMessage(type, message) {
    // Remove existing messages
    document.querySelectorAll('.alert').forEach(alert => alert.remove());

    // Create new message element (use Bootstrap alert classes)
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
            <span class="me-2"><i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i></span>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

    // Insert into appropriate container: prefer modal body, fall back to card-body or document.body
    const container =
      document.querySelector('.modal-body') ||
      document.querySelector('.card-body') ||
      document.body;
    container.insertBefore(alertDiv, container.firstChild);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }

  resetForm() {
    this.currentStep = 1;
    this.form.reset();
    this.formData = {};

    // Clear visual selections
    document.querySelectorAll('.team-option').forEach(option => {
      option.classList.remove('selected');
    });

    document.querySelectorAll('.financing-option').forEach(option => {
      option.classList.remove('selected');
    });

    // Clear validation states
    document.querySelectorAll('.is-valid, .is-invalid').forEach(field => {
      field.classList.remove('is-valid', 'is-invalid');
    });

    // Hide sections (if they exist)
    const employmentSection = document.getElementById('employmentSection');
    const loanSection = document.getElementById('loanSection');
    const bankingConsentSection = document.getElementById('bankingConsentSection');

    if (employmentSection) employmentSection.style.display = 'none';
    if (loanSection) loanSection.style.display = 'none';
    if (bankingConsentSection) bankingConsentSection.style.display = 'none';

    this.updateStepDisplay();
    this.updateProgress();
  }
}

// Add success toast helper
RegistrationFormHandler.prototype.showSuccessToast = function (message, redirectUrl, delay) {
  // create container if not present
  let container = document.querySelector('.success-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'success-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `
        < div class = "success-checkmark" aria - hidden = "true" >
            < svg viewBox = "0 0 52 52" class = "check-svg" >
                < circle class = "check-circle" cx = "26" cy = "26" r = "25" fill = "none" /  >
                < path class = "check-path" fill = "none" d = "M14 27 l7 7 l17 -17" /  >
            <  / svg >
        <  / div >
        < div class = "success-body" > ${message} < / div >
    `;

  container.appendChild(toast);

  // trigger animation
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
      if (redirectUrl) window.location.href = redirectUrl;
    }, 400);
  }, delay);
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  // Only initialize if the registration form exists
  if (document.getElementById('registerForm')) {
    new RegistrationFormHandler();
  }

  // Hook up AJAX login on fan register page if login form exists
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const emailField = loginForm.querySelector('input[name="email"]');
      const passField = loginForm.querySelector('input[name="password"]');
      const emailErr = document.getElementById('loginEmailError');
      const passErr = document.getElementById('loginPasswordError');

      // reset errors
      [emailErr, passErr].forEach(el => {
        if (el) {
          el.style.display = 'none';
          el.textContent = '';
        }
      });

      // simple client-side validation
      let ok = true;
      if (!emailField.value || !/^\S+@\S+\.\S+$/.test(emailField.value)) {
        if (emailErr) {
          emailErr.textContent = 'Enter a valid email';
          emailErr.style.display = 'block';
        }
        ok = false;
      }
      if (!passField.value) {
        if (passErr) {
          passErr.textContent = 'Enter your password';
          passErr.style.display = 'block';
        }
        ok = false;
      }
      if (!ok) return;

      // show loading
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Signing in...';

      try {
        const fd = new FormData(loginForm);
        const resp = await fetch('../auth/login.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(fd.entries())),
        });
        const data = await resp.json();
        if (data.success) {
          try {
            const modalEl = document.getElementById('loginModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
              const modalInst =
                bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
              modalInst.hide();
            }
          } catch {}
          alert(data.message || 'Signed in');
          if (data.redirect_url) window.location.href = data.redirect_url;
        } else {
          if (data.field === 'email' && emailErr) {
            emailErr.textContent = data.message;
            emailErr.style.display = 'block';
          } else if (data.field === 'password' && passErr) {
            passErr.textContent = data.message;
            passErr.style.display = 'block';
          } else if (data.message) {
            alert(data.message);
          }
        }
      } catch (err) {
        console.error('Login AJAX error', err);
        alert('Login failed. Try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
});

// Export for potential external use
window.RegistrationFormHandler = RegistrationFormHandler;
