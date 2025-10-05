export function translateSupabaseError(error: any): string {
  if (!error) return 'An unknown error occurred';

  const message = error.message?.toLowerCase() || '';
  const code = error.code;

  // Network errors
  if (message.includes('fetch') || message.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // RLS errors
  if (code === '42501' || message.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }

  // Constraint violations
  if (code === '23505' || message.includes('duplicate') || message.includes('unique')) {
    return 'A profile with this name already exists.';
  }

  if (code === '23503' || message.includes('foreign key')) {
    return 'Referenced record does not exist.';
  }

  if (code === '23514' || message.includes('check constraint')) {
    return 'Invalid data: please check your input values.';
  }

  // Version conflicts
  if (code === '40001' || message.includes('conflict') || message.includes('version')) {
    return 'This profile was modified by another session. Please refresh and try again.';
  }

  // Default
  return error.message || 'An unexpected error occurred';
}
