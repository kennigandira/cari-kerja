/**
 * Input Validation Composables
 *
 * Provides secure input validation utilities with allowlist-based approaches
 * and sanitization to prevent injection attacks.
 */

import { ref, computed, type Ref } from 'vue';

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * URL Validation with allowlist support
 */
export function useUrlValidation(allowedDomains?: string[]) {
  const validateUrl = (url: string): ValidationResult => {
    const errors: string[] = [];

    try {
      const parsed = new URL(url);

      // Must be HTTPS in production
      if (import.meta.env.PROD && parsed.protocol !== 'https:') {
        errors.push('URL must use HTTPS protocol');
      }

      // Check against allowlist if provided
      if (allowedDomains && allowedDomains.length > 0) {
        const isAllowed = allowedDomains.some(domain =>
          parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
        );

        if (!isAllowed) {
          errors.push(`Domain ${parsed.hostname} is not in the allowlist`);
        }
      }

      // Prevent javascript: and data: URLs
      if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
        errors.push('JavaScript and data URLs are not allowed');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch {
      return {
        isValid: false,
        errors: ['Invalid URL format'],
      };
    }
  };

  return { validateUrl };
}

/**
 * String sanitization to prevent XSS
 */
export function useSanitization() {
  /**
   * Sanitizes a string by encoding HTML entities
   * Use this before rendering user-provided content
   * Replaces potentially dangerous characters with HTML entities
   */
  const sanitizeHtml = (str: string): string => {
    return str.replace(/[&<>"']/g, (char) => {
      const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return escapeMap[char] || char;
    });
  };

  /**
   * Strips all HTML tags from a string
   * Uses DOMParser for safe HTML parsing without XSS risks
   */
  const stripHtml = (str: string): string => {
    const doc = new DOMParser().parseFromString(str, 'text/html');
    return doc.body.textContent || '';
  };

  /**
   * Sanitizes a string for use in URLs
   */
  const sanitizeUrl = (str: string): string => {
    return encodeURIComponent(str);
  };

  /**
   * Validates and sanitizes an email address
   */
  const sanitizeEmail = (email: string): string => {
    // Remove any whitespace
    const trimmed = email.trim().toLowerCase();

    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(trimmed)) {
      throw new Error('Invalid email format');
    }

    return trimmed;
  };

  return {
    sanitizeHtml,
    stripHtml,
    sanitizeUrl,
    sanitizeEmail,
  };
}

/**
 * Input validation composable with common validation rules
 */
export function useInputValidation() {
  /**
   * Validates required field
   */
  const required = (message = 'This field is required'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== null && value !== undefined;
    },
    message,
  });

  /**
   * Validates minimum length
   */
  const minLength = (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  });

  /**
   * Validates maximum length
   */
  const maxLength = (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length <= max,
    message: message || `Must be at most ${max} characters`,
  });

  /**
   * Validates email format
   */
  const email = (message = 'Invalid email format'): ValidationRule => ({
    validate: (value: string) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(value);
    },
    message,
  });

  /**
   * Validates URL format
   */
  const url = (message = 'Invalid URL format'): ValidationRule => ({
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  });

  /**
   * Validates against a regex pattern
   */
  const pattern = (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    validate: (value: string) => regex.test(value),
    message,
  });

  /**
   * Validates that value is in allowlist
   */
  const oneOf = (allowedValues: any[], message?: string): ValidationRule => ({
    validate: (value: any) => allowedValues.includes(value),
    message: message || `Must be one of: ${allowedValues.join(', ')}`,
  });

  /**
   * Validates UUID format
   */
  const uuid = (message = 'Invalid UUID format'): ValidationRule => ({
    validate: (value: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    },
    message,
  });

  /**
   * Validates numeric value
   */
  const numeric = (message = 'Must be a number'): ValidationRule => ({
    validate: (value: any) => !isNaN(Number(value)),
    message,
  });

  /**
   * Validates integer value
   */
  const integer = (message = 'Must be an integer'): ValidationRule => ({
    validate: (value: any) => Number.isInteger(Number(value)),
    message,
  });

  /**
   * Validates minimum value
   */
  const min = (minValue: number, message?: string): ValidationRule => ({
    validate: (value: number) => value >= minValue,
    message: message || `Must be at least ${minValue}`,
  });

  /**
   * Validates maximum value
   */
  const max = (maxValue: number, message?: string): ValidationRule => ({
    validate: (value: number) => value <= maxValue,
    message: message || `Must be at most ${maxValue}`,
  });

  return {
    required,
    minLength,
    maxLength,
    email,
    url,
    pattern,
    oneOf,
    uuid,
    numeric,
    integer,
    min,
    max,
  };
}

/**
 * Form validation composable
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: Partial<Record<keyof T, ValidationRule[]>>
) {
  const values = ref<T>(initialValues) as Ref<T>;
  const errors = ref<Partial<Record<keyof T, string[]>>>({});
  const touched = ref<Partial<Record<keyof T, boolean>>>({});

  const validate = (field?: keyof T): boolean => {
    const fieldsToValidate = field ? [field] : Object.keys(rules);

    let isValid = true;

    for (const fieldName of fieldsToValidate) {
      const fieldRules = rules[fieldName as keyof T];
      if (!fieldRules) continue;

      const fieldErrors: string[] = [];
      const value = values.value[fieldName as keyof T];

      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          fieldErrors.push(rule.message);
          isValid = false;
        }
      }

      errors.value[fieldName as keyof T] = fieldErrors;
    }

    return isValid;
  };

  const touch = (field: keyof T) => {
    touched.value[field] = true;
  };

  const reset = () => {
    values.value = { ...initialValues };
    errors.value = {};
    touched.value = {};
  };

  const isFormValid = computed(() => {
    return Object.values(errors.value).every(errs => !errs || (Array.isArray(errs) && errs.length === 0));
  });

  return {
    values,
    errors,
    touched,
    validate,
    touch,
    reset,
    isFormValid,
  };
}
