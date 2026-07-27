/**
 * Unified Registration Form Handler
 * Consolidates all registration form functionality into a single file
 * Version: 2025-10-08-unified
 */

(function () {
  'use strict';

  // ===========================
  // Searchable Dropdown Component
  // ===========================
  class SearchableDropdown {
    constructor(selectElement, options = {}) {
      this.originalSelect = selectElement;
      this.options = {
        placeholder: 'Search...',
        noResultsText: 'No results found',
        popularItems: [],
        ...options,
      };

      this.isOpen = false;
      this.filteredOptions = [];
      this.allOptions = [];
      this.selectedValue = '';
      this.selectedText = '';
      this.recentSelections = this.loadRecentSelections();

      this.init();
    }

    init() {
      this.extractOptions();
      this.createDropdown();
      this.bindEvents();
      this.hideOriginalSelect();
    }

    extractOptions() {
      const options = this.originalSelect.querySelectorAll('option');
      this.allOptions = Array.from(options).map(option => ({
        value: option.value,
        text: option.textContent,
        searchText: option.textContent.toLowerCase(),
      }));
      this.filteredOptions = [...this.allOptions];
    }

    createDropdown() {
      this.container = document.createElement('div');
      this.container.className = 'searchable-dropdown-container';
      this.container.innerHTML = `
                <div class="searchable-dropdown-input" tabindex="0">
                    <span class="selected-text">${this.options.placeholder}</span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                </div>
                <div class="searchable-dropdown-menu" style="display: none;">
                    <div class="search-input-container">
                        <input type="text" class="search-input" placeholder="${this.options.placeholder}">
                        <i class="fas fa-search search-icon"></i>
                    </div>
                    <div class="dropdown-options"></div>
                </div>
            `;

      this.originalSelect.parentNode.insertBefore(this.container, this.originalSelect.nextSibling);

      this.input = this.container.querySelector('.searchable-dropdown-input');
      this.menu = this.container.querySelector('.searchable-dropdown-menu');
      this.searchInput = this.container.querySelector('.search-input');
      this.optionsContainer = this.container.querySelector('.dropdown-options');
      this.selectedTextElement = this.container.querySelector('.selected-text');
      this.arrow = this.container.querySelector('.dropdown-arrow');
    }

    renderOptions() {
      return this.filteredOptions
        .map(option => {
          const isRecent = this.recentSelections.includes(option.text);
          const isPopular = this.options.popularItems.includes(option.value);

          return `
                    <div class="dropdown-option ${isRecent ? 'recent' : ''} ${isPopular ? 'popular' : ''}" 
                         data-value="${option.value}">
                        ${option.text}
                        ${isRecent ? '<i class="fas fa-clock ms-2"></i>' : ''}
                        ${isPopular && !isRecent ? '<i class="fas fa-star ms-2"></i>' : ''}
                    </div>
                `;
        })
        .join('');
    }

    bindEvents() {
      if (!this.input) return;

      this.input.addEventListener('click', e => {
        e.stopPropagation();
        this.toggle();
      });

      this.searchInput.addEventListener('input', e => {
        this.filterOptions(e.target.value);
      });

      this.optionsContainer.addEventListener('click', e => {
        const option = e.target.closest('.dropdown-option');
        if (option) {
          const value = option.dataset.value;
          if (value) this.selectOption(value);
        }
      });

      document.addEventListener('click', e => {
        if (!this.container.contains(e.target)) {
          this.close();
        }
      });
    }

    filterOptions(searchTerm) {
      const term = searchTerm.toLowerCase().trim();

      if (!term) {
        this.filteredOptions = [...this.allOptions];
      } else {
        this.filteredOptions = this.allOptions
          .map(option => ({
            ...option,
            score: this.fuzzyScore(option.searchText, term),
          }))
          .filter(option => option.score > 0)
          .sort((a, b) => b.score - a.score);
      }

      this.renderFilteredOptions();
    }

    fuzzyScore(text, query) {
      let score = 0;
      let queryIndex = 0;

      for (let i = 0; i < text.length && queryIndex < query.length; i++) {
        if (text[i] === query[queryIndex]) {
          score += (query.length - queryIndex) * 10;
          queryIndex++;
        }
      }

      if (queryIndex !== query.length) return 0;

      if (text.startsWith(query)) score += 100;
      if (text === query) score += 200;

      score -= text.length - query.length;

      return score;
    }

    renderFilteredOptions() {
      this.optionsContainer.innerHTML = this.renderOptions();

      if (this.filteredOptions.length === 0) {
        this.optionsContainer.innerHTML = `
                    <div class="no-results">${this.options.noResultsText}</div>
                `;
      }
    }

    selectOption(value) {
      const option = this.allOptions.find(opt => opt.value === value);
      if (option) {
        this.selectedValue = value;
        this.selectedText = option.text;
        this.selectedTextElement.textContent = option.text;
        this.originalSelect.value = value;

        this.saveRecentSelection(option.text);
        this.originalSelect.dispatchEvent(new Event('change', { bubbles: true }));

        this.close();
      }
    }

    saveRecentSelection(value) {
      let recent = this.loadRecentSelections();
      recent = [value, ...recent.filter(v => v !== value)].slice(0, 5);
      localStorage.setItem('wctfe_recent_countries', JSON.stringify(recent));
      this.recentSelections = recent;
    }

    loadRecentSelections() {
      try {
        return JSON.parse(localStorage.getItem('wctfe_recent_countries') || '[]');
      } catch {
        return [];
      }
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      this.isOpen = true;
      this.menu.style.display = 'block';
      this.arrow.classList.add('rotated');
      this.input.classList.add('active');

      setTimeout(() => {
        this.searchInput.focus();
      }, 100);
    }

    close() {
      this.isOpen = false;
      this.menu.style.display = 'none';
      this.arrow.classList.remove('rotated');
      this.input.classList.remove('active');
      this.searchInput.value = '';
      this.filterOptions('');
    }

    hideOriginalSelect() {
      this.originalSelect.style.display = 'none';
    }

    getValue() {
      return this.selectedValue;
    }

    setValue(value) {
      const option = this.allOptions.find(opt => opt.value === value);
      if (option) {
        this.selectOption(value);
      }
    }
  }

  // ===========================
  // Main Registration Form Handler
  // ===========================
  class RegistrationFormHandler {
    constructor() {
      this.currentStep = 1;
      this.totalSteps = 4;
      this.form = document.getElementById('registerForm');

      if (!this.form) {
        console.warn('Registration form not found');
        return;
      }

      this.formData = {};
      this.searchableDropdowns = new Map();
      this.validationTimeouts = new Map();

      this.init();
    }

    init() {
      console.log('Initializing unified registration form handler...');

      // Load saved state first
      this.loadFormState();

      // Create top navigation controls
      this.createTopControls();
      // Create bottom navigation controls (for accessibility / UX)
      this.createBottomControls();

      // Initialize dropdowns after country data is loaded
      this.initializeDropdowns();

      // Bind all events
      this.bindEvents();

      // Update display
      this.updateStepDisplay();
      this.updateProgress();
    }

    createTopControls() {
      const pageTitle = document.querySelector('h1');
      if (!pageTitle) return;

      const topControls = document.createElement('div');
      topControls.className = 'registration-top-controls';
      topControls.innerHTML = `
                <div class="controls-left">
                    <button type="button" class="btn-control btn-prev" id="topPrev">
                        <i class="fas fa-arrow-left me-2"></i>Previous
                    </button>
                    <button type="button" class="btn-control btn-reset" id="topReset">
                        <i class="fas fa-refresh me-2"></i>Reset
                    </button>
                </div>
                <div class="controls-right">
                    <button type="button" class="btn-control btn-next" id="topNext">
                        Next<i class="fas fa-arrow-right ms-2"></i>
                    </button>
                </div>
            `;

      pageTitle.parentNode.insertBefore(topControls, pageTitle.nextSibling);

      this.topControls = topControls;
      this.topPrev = topControls.querySelector('#topPrev');
      this.topNext = topControls.querySelector('#topNext');
      this.topReset = topControls.querySelector('#topReset');

      // Bind control events
      this.topPrev.addEventListener('click', () => this.prevStep());
      this.topNext.addEventListener('click', () => this.handleNextClick());
      this.topReset.addEventListener('click', () => this.handleReset());
    }

    createBottomControls() {
      const submitBtn = document.getElementById('submitForm');
      if (!submitBtn) return;

      const bottomControls = document.createElement('div');
      bottomControls.className = 'registration-bottom-controls';
      bottomControls.innerHTML = `
                <button type="button" class="btn-control btn-prev" id="bottomPrev">
                    <i class="fas fa-arrow-left me-2"></i>Previous
                </button>
                <div style="display:flex;gap:8px;align-items:center">
                    <button type="button" class="btn-control btn-reset" id="bottomReset">
                        <i class="fas fa-refresh me-2"></i>Reset
                    </button>
                    <button type="button" class="btn-control btn-next" id="bottomNext">
                        Next<i class="fas fa-arrow-right ms-2"></i>
                    </button>
                </div>
            `;

      submitBtn.parentNode.insertBefore(bottomControls, submitBtn);

      this.bottomControls = bottomControls;
      this.bottomPrev = bottomControls.querySelector('#bottomPrev');
      this.bottomNext = bottomControls.querySelector('#bottomNext');
      this.bottomReset = bottomControls.querySelector('#bottomReset');

      // Bind events
      this.bottomPrev.addEventListener('click', () => this.prevStep());
      this.bottomNext.addEventListener('click', () => this.handleNextClick());
      this.bottomReset.addEventListener('click', () => this.handleReset());
    }

    initializeDropdowns() {
      const initDropdowns = () => {
        if (
          window.CountryData &&
          window.CountryData.countries &&
          window.CountryData.countries.length > 0
        ) {
          console.log('Initializing searchable dropdowns...');

          // Initialize country code dropdown
          const countryCodeSelect = document.getElementById('countryCodeSelect');
          if (countryCodeSelect) {
            window.CountryData.populateCountryCodes(countryCodeSelect);

            const countryCodeDropdown = new SearchableDropdown(countryCodeSelect, {
              placeholder: '+...',
              noResultsText: 'No country codes found',
            });
            this.searchableDropdowns.set('countryCode', countryCodeDropdown);
          }

          // Initialize country dropdown
          const countrySelect = document.getElementById('countrySelect');
          if (countrySelect) {
            window.CountryData.populateCountries(countrySelect);

            const countryDropdown = new SearchableDropdown(countrySelect, {
              placeholder: 'Select your country...',
              noResultsText: 'No countries found',
              popularItems: ['United States', 'United Kingdom', 'Canada', 'Australia', 'India'],
            });
            this.searchableDropdowns.set('country', countryDropdown);
          }
        } else {
          setTimeout(initDropdowns, 50);
        }
      };

      setTimeout(initDropdowns, 100);
    }

    bindEvents() {
      // Form submission
      this.form.addEventListener('submit', e => this.handleSubmit(e));

      // Live validation on input
      this.form.addEventListener('input', e => {
        this.debouncedValidate(e.target);
      });

      this.form.addEventListener('change', e => {
        this.validateField(e.target);
      });

      // Team selection
      this.bindTeamSelection();

      // Financing options
      this.bindFinancingOptions();

      // Auto-save form state
      this.setupAutoSave();
    }

    bindTeamSelection() {
      const teamOptions = document.querySelectorAll('.team-option');
      const teamSupportInput = document.getElementById('teamSupport');

      if (!teamSupportInput) return;

      teamOptions.forEach(option => {
        option.addEventListener('click', () => {
          teamOptions.forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');

          const teamName = option.dataset.team;
          teamSupportInput.value = teamName;

          this.clearFieldError('teamSupport');
          teamSupportInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    }

    bindFinancingOptions() {
      const financingRadios = document.querySelectorAll('input[name="seeking_financing"]');
      const employmentSection = document.getElementById('employmentSection');
      const loanSection = document.getElementById('loanSection');
      const bankingConsentSection = document.getElementById('bankingConsentSection');

      financingRadios.forEach(radio => {
        radio.addEventListener('change', () => {
          if (radio.value === '1') {
            if (employmentSection) employmentSection.style.display = 'block';
            if (loanSection) loanSection.style.display = 'block';
            if (bankingConsentSection) bankingConsentSection.style.display = 'block';
          } else {
            if (employmentSection) employmentSection.style.display = 'none';
            if (loanSection) loanSection.style.display = 'none';
            if (bankingConsentSection) bankingConsentSection.style.display = 'none';

            // Clear related fields
            this.clearRadioGroup('employment_status');
            this.clearRadioGroup('loan_return_period');
            const banking = document.getElementById('banking_consent');
            if (banking) banking.checked = false;
          }
        });
      });
    }

    setupAutoSave() {
      // Auto-save every 30 seconds
      setInterval(() => {
        this.saveFormState();
      }, 30000);

      // Save on step changes
      let saveTimeout;
      this.form.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          this.saveFormState();
        }, 2000);
      });
    }

    handleNextClick() {
      console.log('Next button clicked. Current step:', this.currentStep);
      if (!this.validateCurrentStep()) {
        console.log('Validation failed for step:', this.currentStep);
        this.topControls.classList.add('controls-has-error');

        const firstInvalid = document.querySelector(
          '.form-step.active input:invalid, .form-step.active select:invalid'
        );
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      this.topControls.classList.remove('controls-has-error');

      if (this.currentStep === this.totalSteps) {
        this.handleSubmit(new Event('submit'));
      } else {
        this.nextStep();
      }
    }

    handleReset() {
      if (confirm('Reset the registration form? This will clear all saved progress.')) {
        this.resetForm();
        localStorage.removeItem('wctfe_registration_data');
        localStorage.removeItem('wctfe_registration_step');
        this.topControls.classList.remove('controls-has-error');
      }
    }

    nextStep() {
      if (this.validateCurrentStep()) {
        this.saveFormState();
        this.currentStep++;
        this.updateStepDisplay();
        this.updateProgress();
      }
    }

    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
        this.updateStepDisplay();
        this.updateProgress();
      }
    }

    validateCurrentStep() {
      const currentStepElement = document.querySelector(
        `.form-step[data-step="${this.currentStep}"]`
      );
      if (!currentStepElement) return false;

      const requiredFields = currentStepElement.querySelectorAll('[required]');
      let isValid = true;

      // Special validation for Step 1 (Country Code and Country)
      if (this.currentStep === 1) {
        const countryCodeDropdown = this.searchableDropdowns.get('countryCode');
        const countryDropdown = this.searchableDropdowns.get('country');

        if (countryCodeDropdown && !countryCodeDropdown.getValue()) {
          this.showFieldError('country_code', 'Please select a country code.');
          isValid = false;
        } else if (countryCodeDropdown) {
          this.clearFieldError('country_code');
        }

        if (countryDropdown && !countryDropdown.getValue()) {
          this.showFieldError('country', 'Please select your country.');
          isValid = false;
        } else if (countryDropdown) {
          this.clearFieldError('country');
        }
      }

      // Special validation for Step 2 (Team Support)
      if (this.currentStep === 2) {
        const teamSupport = document.getElementById('teamSupport');
        if (teamSupport && !teamSupport.value) {
          this.showFieldError('teamSupport', "Please select a team you'll be supporting.");
          isValid = false;
        } else if (teamSupport) {
          this.clearFieldError('teamSupport');
        }
      }

      // Special validation for Step 3 (Financing Options)
      if (this.currentStep === 3) {
        const seekingFinancing = document.querySelector('input[name="seeking_financing"]:checked');
        if (!seekingFinancing) {
          this.showFieldError('seeking_financing', 'Please select your financing preference.');
          isValid = false;
        } else {
          this.clearFieldError('seeking_financing');

          if (seekingFinancing.value === '1') {
            const employmentStatus = document.querySelector(
              'input[name="employment_status"]:checked'
            );
            const loanPeriod = document.querySelector('input[name="loan_return_period"]:checked');

            if (!employmentStatus) {
              this.showFieldError('employment_status', 'Please select your employment status.');
              isValid = false;
            } else {
              this.clearFieldError('employment_status');
            }

            if (!loanPeriod) {
              this.showFieldError(
                'loan_return_period',
                'Please select your ideal loan return period.'
              );
              isValid = false;
            } else {
              this.clearFieldError('loan_return_period');
            }
          }
        }
      }

      // Validate all required fields
      requiredFields.forEach(field => {
        if (!this.validateField(field)) {
          isValid = false;
        }
      });

      return isValid;
    }

    debouncedValidate(field) {
      if (this.validationTimeouts.has(field)) {
        clearTimeout(this.validationTimeouts.get(field));
      }

      const timeout = setTimeout(() => {
        this.validateField(field);
        this.validationTimeouts.delete(field);
      }, 300);

      this.validationTimeouts.set(field, timeout);
    }

    validateField(field) {
      const value = field.value.trim();
      let isValid = true;
      let errorMessage = '';

      // Required field validation
      if (field.hasAttribute('required') && !value) {
        errorMessage = 'This field is required.';
        isValid = false;
      }

      // Email validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errorMessage = 'Please enter a valid email address.';
          isValid = false;
        }
      }

      // Phone validation
      if (field.type === 'tel' && value) {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 8) {
          errorMessage = 'Please enter a valid phone number (at least 8 digits).';
          isValid = false;
        }
      }

      // Date of birth validation
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
        } else if (age > 100) {
          errorMessage = 'Please enter a valid date of birth.';
          isValid = false;
        }
      }

      // Update field appearance
      if (isValid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        this.clearFieldError(field.name || field.id);
      } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        this.showFieldError(field.name || field.id, errorMessage);
      }

      return isValid;
    }

    showFieldError(fieldName, message) {
      const field =
        document.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);
      if (!field) return;

      const errorElement =
        field.parentNode.querySelector('.invalid-feedback') ||
        document.getElementById(`${fieldName}Error`);
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      }
    }

    clearFieldError(fieldName) {
      const field =
        document.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);
      if (!field) return;

      const errorElement =
        field.parentNode.querySelector('.invalid-feedback') ||
        document.getElementById(`${fieldName}Error`);
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    }

    clearRadioGroup(name) {
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      radios.forEach(r => {
        r.checked = false;
      });
    }

    updateStepDisplay() {
      const formSteps = document.querySelectorAll('.form-step');

      // Hide all steps
      formSteps.forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none';
      });

      // Show current step with animation
      const currentStepElement = document.querySelector(
        `.form-step[data-step="${this.currentStep}"]`
      );
      if (currentStepElement) {
        currentStepElement.style.display = 'block';
        currentStepElement.classList.add('active');

        // Smooth animation
        currentStepElement.style.opacity = '0';
        currentStepElement.style.transform = 'translateY(20px)';

        requestAnimationFrame(() => {
          currentStepElement.style.transition = 'all 0.3s ease';
          currentStepElement.style.opacity = '1';
          currentStepElement.style.transform = 'translateY(0)';

          setTimeout(() => {
            currentStepElement.style.transition = '';
          }, 300);
        });

        // Scroll to top of form
        currentStepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      // Update navigation buttons
      this.updateNavigationButtons();
    }

    updateNavigationButtons() {
      if (this.topPrev) {
        this.topPrev.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
      }
      if (this.bottomPrev) {
        this.bottomPrev.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
      }

      if (this.topNext) {
        if (this.currentStep === this.totalSteps) {
          this.topNext.innerHTML = '<i class="fas fa-check me-2"></i>Finish Application';
          this.topNext.classList.add('is-final');
        } else {
          this.topNext.innerHTML = 'Next<i class="fas fa-arrow-right ms-2"></i>';
          this.topNext.classList.remove('is-final');
        }
      }

      if (this.bottomNext) {
        if (this.currentStep === this.totalSteps) {
          this.bottomNext.innerHTML = '<i class="fas fa-check me-2"></i>Finish Application';
          this.bottomNext.classList.add('is-final');
        } else {
          this.bottomNext.innerHTML = 'Next<i class="fas fa-arrow-right ms-2"></i>';
          this.bottomNext.classList.remove('is-final');
        }
      }
    }

    updateProgress() {
      const percentage = (this.currentStep / this.totalSteps) * 100;

      const progressBar = document.getElementById('progressFill');
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }

      const progressPercentage = document.getElementById('progressPercentage');
      if (progressPercentage) {
        progressPercentage.textContent = `${Math.round(percentage)}%`;
      }

      const currentStepNumber = document.getElementById('currentStepNumber');
      if (currentStepNumber) {
        currentStepNumber.textContent = this.currentStep;
      }

      const estimatedTime = document.getElementById('estimatedTime');
      if (estimatedTime) {
        const remainingSteps = this.totalSteps - this.currentStep;
        const remainingTime = remainingSteps * 1;
        estimatedTime.textContent = `~${remainingTime} min remaining`;
      }
    }

    async handleSubmit(e) {
      e.preventDefault();

      if (!this.validateCurrentStep()) {
        return;
      }

      // Show loading state
      if (this.topNext) {
        this.topNext.disabled = true;
        this.topNext.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
      }
      if (this.bottomNext) {
        this.bottomNext.disabled = true;
        this.bottomNext.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
      }

      try {
        // Prepare form data
        const formData = new FormData(this.form);

        // Add hidden privacy_policy_agreed field
        const termsInput = this.form.querySelector('input[name="terms_agreed"]');
        if (termsInput && termsInput.checked) {
          formData.set('privacy_policy_agreed', '1');
        } else {
          formData.set('privacy_policy_agreed', '0');
        }

        // Ensure dropdown values are included
        const countryDropdown = this.searchableDropdowns.get('country');
        const codeDropdown = this.searchableDropdowns.get('countryCode');

        if (countryDropdown && countryDropdown.getValue()) {
          formData.set('country', countryDropdown.getValue());
        }
        if (codeDropdown && codeDropdown.getValue()) {
          formData.set('country_code', codeDropdown.getValue());
        }

        // Submit form via AJAX
        const response = await fetch(this.form.action, {
          method: 'POST',
          body: formData,
        });

        const raw = await response.text();
        let result;

        try {
          result = JSON.parse(raw);
        } catch {
          // Try to extract trailing JSON
          const jsonStart = raw.lastIndexOf('{');
          if (jsonStart !== -1) {
            result = JSON.parse(raw.substring(jsonStart));
          } else {
            throw new Error('Invalid response format');
          }
        }

        if (result.success) {
          // Clear saved form state
          localStorage.removeItem('wctfe_registration_data');
          localStorage.removeItem('wctfe_registration_step');

          // Show success message
          this.showSuccessMessage('Registration completed successfully!');

          // Redirect to fan dashboard
          setTimeout(() => {
            const redirectUrl = result.redirect_url || '../fan/dashboard.php';
            window.location.href = redirectUrl;
          }, 1500);
        } else {
          this.showErrorMessage(result.message || 'Registration failed. Please try again.');
        }
      } catch (error) {
        console.error('Registration error:', error);
        this.showErrorMessage('An error occurred. Please try again.');
      } finally {
        // Reset button state
        if (this.topNext) {
          this.topNext.disabled = false;
          this.topNext.innerHTML = '<i class="fas fa-check me-2"></i>Finish Application';
        }
        if (this.bottomNext) {
          this.bottomNext.disabled = false;
          this.bottomNext.innerHTML = '<i class="fas fa-check me-2"></i>Finish Application';
        }
      }
    }

    showSuccessMessage(message) {
      const alert = this.createAlert('success', message);
      this.form.parentNode.insertBefore(alert, this.form);

      setTimeout(() => {
        alert.remove();
      }, 3000);
    }

    showErrorMessage(message) {
      const alert = this.createAlert('danger', message);
      this.form.parentNode.insertBefore(alert, this.form);

      setTimeout(() => {
        alert.remove();
      }, 5000);
    }

    createAlert(type, message) {
      const alert = document.createElement('div');
      alert.className = `alert alert-${type} alert-dismissible fade show`;
      alert.setAttribute('role', 'alert');
      alert.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
      return alert;
    }

    saveFormState() {
      const formData = new FormData(this.form);
      this.formData = Object.fromEntries(formData.entries());

      localStorage.setItem('wctfe_registration_data', JSON.stringify(this.formData));
      localStorage.setItem('wctfe_registration_step', this.currentStep.toString());
    }

    loadFormState() {
      const savedData = localStorage.getItem('wctfe_registration_data');
      const savedStep = localStorage.getItem('wctfe_registration_step');

      if (savedData && savedStep) {
        this.formData = JSON.parse(savedData);
        this.currentStep = parseInt(savedStep);

        // Populate form fields
        Object.entries(this.formData).forEach(([name, value]) => {
          const field = document.querySelector(`[name="${name}"]`);
          if (field) {
            if (field.type === 'checkbox' || field.type === 'radio') {
              field.checked = value === '1' || value === field.value;
            } else {
              field.value = value;
            }
          }
        });

        // Update team selection
        if (this.formData.team_support) {
          const teamOption = document.querySelector(`[data-team="${this.formData.team_support}"]`);
          if (teamOption) {
            teamOption.classList.add('selected');
          }
        }
      }
    }

    resetForm() {
      this.currentStep = 1;
      this.form.reset();
      this.formData = {};

      // Clear visual selections
      document.querySelectorAll('.team-option').forEach(option => {
        option.classList.remove('selected');
      });

      // Clear validation states
      document.querySelectorAll('.is-valid, .is-invalid').forEach(field => {
        field.classList.remove('is-valid', 'is-invalid');
      });

      // Hide conditional sections
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

  // ===========================
  // Initialize when DOM is ready
  // ===========================
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('registerForm')) {
      new RegistrationFormHandler();
    }
  });

  // Export for potential external use
  window.SearchableDropdown = SearchableDropdown;
  window.RegistrationFormHandler = RegistrationFormHandler;
})();
