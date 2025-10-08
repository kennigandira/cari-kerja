/**
 * Input Validation Utilities
 *
 * Comprehensive server-side validation for all inputs
 * Prevents injection attacks and ensures data integrity
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate UUID format
 */
export function validateUuid(value: string): ValidationResult {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    return { valid: false, errors: ['Invalid UUID format'] };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  // Trim and lowercase
  const normalized = email.trim().toLowerCase();

  // Length check
  if (normalized.length < 3 || normalized.length > 254) {
    errors.push('Email must be between 3 and 254 characters');
  }

  // Format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName = 'Field'
): ValidationResult {
  const errors: string[] = [];

  if (value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters`);
  }

  if (value.length > max) {
    errors.push(`${fieldName} must be at most ${max} characters`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate text input (safe for database storage)
 * Maximum 50KB to prevent DoS
 */
export function validateTextInput(text: string, maxLength = 50000): ValidationResult {
  const errors: string[] = [];

  // Null/undefined check
  if (!text) {
    errors.push('Text cannot be empty');
    return { valid: false, errors };
  }

  // Length check
  if (text.length > maxLength) {
    errors.push(`Text too long (max ${maxLength} characters)`);
  }

  // Check for null bytes (can cause issues in databases)
  if (text.includes('\0')) {
    errors.push('Text contains invalid null bytes');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate job parsing request
 */
export function validateJobParseRequest(request: {
  url?: string;
  text?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Must have either url or text
  if (!request.url && !request.text) {
    errors.push('Either url or text must be provided');
  }

  // Cannot have both
  if (request.url && request.text) {
    errors.push('Provide only url OR text, not both');
  }

  // Validate URL if provided
  if (request.url) {
    if (request.url.length > 2000) {
      errors.push('URL too long (max 2000 characters)');
    }

    try {
      const parsed = new URL(request.url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.push('Only HTTP(S) URLs allowed');
      }
    } catch {
      errors.push('Invalid URL format');
    }
  }

  // Validate text if provided
  if (request.text) {
    const textValidation = validateTextInput(request.text, 50000);
    if (!textValidation.valid) {
      errors.push(...textValidation.errors);
    }

    // Minimum text length
    if (request.text.trim().length < 50) {
      errors.push('Text too short (minimum 50 characters)');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string for safe storage
 * Removes control characters except newlines and tabs
 */
export function sanitizeForStorage(value: string): string {
  // Remove null bytes
  let sanitized = value.replace(/\0/g, '');

  // Remove other control characters except \n, \r, \t
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize whitespace
  sanitized = sanitized.replace(/\r\n/g, '\n'); // Normalize line endings

  // Trim excessive whitespace
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines

  return sanitized.trim();
}

/**
 * Validate numeric value
 */
export function validateNumber(
  value: any,
  min?: number,
  max?: number,
  fieldName = 'Value'
): ValidationResult {
  const errors: string[] = [];

  const num = Number(value);

  if (isNaN(num)) {
    errors.push(`${fieldName} must be a valid number`);
    return { valid: false, errors };
  }

  if (min !== undefined && num < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    errors.push(`${fieldName} must be at most ${max}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate integer value
 */
export function validateInteger(
  value: any,
  min?: number,
  max?: number,
  fieldName = 'Value'
): ValidationResult {
  const errors: string[] = [];

  const num = Number(value);

  if (isNaN(num)) {
    errors.push(`${fieldName} must be a valid number`);
    return { valid: false, errors };
  }

  if (!Number.isInteger(num)) {
    errors.push(`${fieldName} must be an integer`);
    return { valid: false, errors };
  }

  if (min !== undefined && num < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    errors.push(`${fieldName} must be at most ${max}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  allowedValues: T[],
  fieldName = 'Value'
): ValidationResult {
  if (!allowedValues.includes(value as T)) {
    return {
      valid: false,
      errors: [`${fieldName} must be one of: ${allowedValues.join(', ')}`]
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate object has required fields
 */
export function validateRequiredFields(
  obj: Record<string, any>,
  requiredFields: string[]
): ValidationResult {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
