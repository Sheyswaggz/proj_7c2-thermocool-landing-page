/**
 * Form Validation Module
 * 
 * Provides comprehensive client-side validation for the contact form with:
 * - Real-time field validation
 * - Accessible error messaging with ARIA attributes
 * - Progressive enhancement (works without JavaScript)
 * - Email and phone format validation
 * - Required field validation
 * - Form submission handling
 * 
 * @generated-from: task-id:TASK-004
 * @modifies: index.html contact form
 * @dependencies: []
 */

(function() {
  'use strict';

  // Validation patterns
  const VALIDATION_PATTERNS = Object.freeze({
    EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    PHONE: /^[\d\s\-\(\)\+\.]+$/,
    NAME: /^[a-zA-Z\s\-'\.]+$/
  });

  // Validation error messages
  const ERROR_MESSAGES = Object.freeze({
    REQUIRED: 'This field is required',
    EMAIL_INVALID: 'Please enter a valid email address',
    PHONE_INVALID: 'Please enter a valid phone number',
    NAME_INVALID: 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)',
    MESSAGE_TOO_SHORT: 'Message must be at least 10 characters long',
    PHONE_TOO_SHORT: 'Phone number must be at least 10 digits',
    PHONE_TOO_LONG: 'Phone number must not exceed 20 digits'
  });

  // Field validation rules
  const FIELD_RULES = Object.freeze({
    name: {
      required: true,
      pattern: VALIDATION_PATTERNS.NAME,
      minLength: 2,
      maxLength: 100,
      errorMessages: {
        required: ERROR_MESSAGES.REQUIRED,
        pattern: ERROR_MESSAGES.NAME_INVALID,
        minLength: 'Name must be at least 2 characters long',
        maxLength: 'Name must not exceed 100 characters'
      }
    },
    email: {
      required: true,
      pattern: VALIDATION_PATTERNS.EMAIL,
      maxLength: 254,
      errorMessages: {
        required: ERROR_MESSAGES.REQUIRED,
        pattern: ERROR_MESSAGES.EMAIL_INVALID,
        maxLength: 'Email must not exceed 254 characters'
      }
    },
    phone: {
      required: true,
      pattern: VALIDATION_PATTERNS.PHONE,
      minLength: 10,
      maxLength: 20,
      errorMessages: {
        required: ERROR_MESSAGES.REQUIRED,
        pattern: ERROR_MESSAGES.PHONE_INVALID,
        minLength: ERROR_MESSAGES.PHONE_TOO_SHORT,
        maxLength: ERROR_MESSAGES.PHONE_TOO_LONG
      }
    },
    service: {
      required: true,
      errorMessages: {
        required: ERROR_MESSAGES.REQUIRED
      }
    },
    message: {
      required: true,
      minLength: 10,
      maxLength: 1000,
      errorMessages: {
        required: ERROR_MESSAGES.REQUIRED,
        minLength: ERROR_MESSAGES.MESSAGE_TOO_SHORT,
        maxLength: 'Message must not exceed 1000 characters'
      }
    }
  });

  /**
   * Validates a single field based on its rules
   * @param {HTMLElement} field - The form field to validate
   * @param {Object} rules - Validation rules for the field
   * @returns {Object} Validation result with isValid and error message
   */
  function validateField(field, rules) {
    const value = field.value.trim();
    const fieldType = field.type;

    // Required field validation
    if (rules.required && !value) {
      return {
        isValid: false,
        error: rules.errorMessages.required
      };
    }

    // Skip further validation if field is empty and not required
    if (!value && !rules.required) {
      return { isValid: true, error: null };
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return {
        isValid: false,
        error: rules.errorMessages.pattern
      };
    }

    // Min length validation
    if (rules.minLength !== undefined) {
      const length = fieldType === 'tel' ? value.replace(/\D/g, '').length : value.length;
      if (length < rules.minLength) {
        return {
          isValid: false,
          error: rules.errorMessages.minLength
        };
      }
    }

    // Max length validation
    if (rules.maxLength !== undefined) {
      const length = fieldType === 'tel' ? value.replace(/\D/g, '').length : value.length;
      if (length > rules.maxLength) {
        return {
          isValid: false,
          error: rules.errorMessages.maxLength
        };
      }
    }

    return { isValid: true, error: null };
  }

  /**
   * Displays error message for a field with ARIA attributes
   * @param {HTMLElement} field - The form field
   * @param {string} errorMessage - The error message to display
   */
  function showError(field, errorMessage) {
    const fieldContainer = field.closest('.form-group') || field.parentElement;
    let errorElement = fieldContainer.querySelector('.error-message');

    // Create error element if it doesn't exist
    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.className = 'error-message';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'polite');
      fieldContainer.appendChild(errorElement);
    }

    errorElement.textContent = errorMessage;
    errorElement.style.display = 'block';

    // Update field ARIA attributes
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errorElement.id || `${field.id}-error`);
    if (!errorElement.id) {
      errorElement.id = `${field.id}-error`;
    }

    // Add error styling to field
    field.classList.add('field-error');
    fieldContainer.classList.add('has-error');

    // Log validation error for debugging
    if (typeof console !== 'undefined' && console.debug) {
      console.debug(`Validation error for ${field.name}:`, errorMessage);
    }
  }

  /**
   * Clears error message for a field
   * @param {HTMLElement} field - The form field
   */
  function clearError(field) {
    const fieldContainer = field.closest('.form-group') || field.parentElement;
    const errorElement = fieldContainer.querySelector('.error-message');

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }

    // Update field ARIA attributes
    field.setAttribute('aria-invalid', 'false');
    field.removeAttribute('aria-describedby');

    // Remove error styling
    field.classList.remove('field-error');
    fieldContainer.classList.remove('has-error');
  }

  /**
   * Validates a form field and displays/clears errors
   * @param {HTMLElement} field - The form field to validate
   * @returns {boolean} True if field is valid
   */
  function validateAndDisplayError(field) {
    const fieldName = field.name;
    const rules = FIELD_RULES[fieldName];

    if (!rules) {
      return true;
    }

    const result = validateField(field, rules);

    if (!result.isValid) {
      showError(field, result.error);
      return false;
    }

    clearError(field);
    return true;
  }

  /**
   * Validates entire form
   * @param {HTMLFormElement} form - The form to validate
   * @returns {boolean} True if all fields are valid
   */
  function validateForm(form) {
    let isValid = true;
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach(function(field) {
      if (field.name && FIELD_RULES[field.name]) {
        const fieldValid = validateAndDisplayError(field);
        if (!fieldValid) {
          isValid = false;
          
          // Focus first invalid field
          if (isValid === false && field === fields[0]) {
            field.focus();
          }
        }
      }
    });

    return isValid;
  }

  /**
   * Handles form submission
   * @param {Event} event - The submit event
   */
  function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const isValid = validateForm(form);

    if (!isValid) {
      // Find first error and focus it
      const firstError = form.querySelector('.field-error');
      if (firstError) {
        firstError.focus();
      }

      // Log validation failure
      if (typeof console !== 'undefined' && console.info) {
        console.info('Form validation failed');
      }

      return false;
    }

    // Form is valid - prepare for submission
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Log successful validation
    if (typeof console !== 'undefined' && console.info) {
      console.info('Form validation successful', data);
    }

    // Display success message
    displaySuccessMessage(form);

    // Here you would typically send data to server
    // Example: submitToServer(data);

    return false;
  }

  /**
   * Displays success message after form submission
   * @param {HTMLFormElement} form - The form element
   */
  function displaySuccessMessage(form) {
    const formContainer = form.parentElement;
    let successMessage = formContainer.querySelector('.success-message');

    if (!successMessage) {
      successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.setAttribute('role', 'status');
      successMessage.setAttribute('aria-live', 'polite');
      formContainer.insertBefore(successMessage, form);
    }

    successMessage.textContent = 'Thank you for your message! We will contact you soon.';
    successMessage.style.display = 'block';

    // Reset form after short delay
    setTimeout(function() {
      form.reset();
      successMessage.style.display = 'none';
      
      // Clear all error states
      const fields = form.querySelectorAll('input, select, textarea');
      fields.forEach(clearError);
    }, 5000);
  }

  /**
   * Debounces a function call
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
      const context = this;
      const args = arguments;
      
      const later = function() {
        timeout = null;
        func.apply(context, args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Initializes form validation
   */
  function initFormValidation() {
    const form = document.querySelector('#contact-form');

    if (!form) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Contact form not found');
      }
      return;
    }

    // Add novalidate to disable browser validation
    form.setAttribute('novalidate', 'novalidate');

    // Add submit event listener
    form.addEventListener('submit', handleFormSubmit);

    // Add real-time validation to fields
    const fields = form.querySelectorAll('input, select, textarea');
    
    fields.forEach(function(field) {
      if (field.name && FIELD_RULES[field.name]) {
        // Validate on blur
        field.addEventListener('blur', function() {
          validateAndDisplayError(field);
        });

        // Validate on input with debounce
        const debouncedValidation = debounce(function() {
          // Only validate if field has been touched (has value or had error)
          if (field.value || field.classList.contains('field-error')) {
            validateAndDisplayError(field);
          }
        }, 500);

        field.addEventListener('input', debouncedValidation);

        // Clear error on focus if field is empty
        field.addEventListener('focus', function() {
          if (!field.value) {
            clearError(field);
          }
        });
      }
    });

    // Log initialization
    if (typeof console !== 'undefined' && console.info) {
      console.info('Form validation initialized');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormValidation);
  } else {
    initFormValidation();
  }

  // Export for testing purposes
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      validateField: validateField,
      validateForm: validateForm,
      VALIDATION_PATTERNS: VALIDATION_PATTERNS,
      ERROR_MESSAGES: ERROR_MESSAGES,
      FIELD_RULES: FIELD_RULES
    };
  }
})();