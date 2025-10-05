export const useDesignTokens = () => {
  const spacing = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  }

  const transitions = {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  }

  const borderRadius = {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  }

  const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  }

  const statusColors = {
    processing: {
      bg: '#f3f4f6',
      text: '#6b7280',
      border: '#d1d5db',
    },
    to_submit: {
      bg: '#eff6ff',
      text: '#3b82f6',
      border: '#93c5fd',
    },
    waiting: {
      bg: '#fffbeb',
      text: '#f59e0b',
      border: '#fcd34d',
    },
    ongoing: {
      bg: '#f5f3ff',
      text: '#8b5cf6',
      border: '#c4b5fd',
    },
    success: {
      bg: '#ecfdf5',
      text: '#10b981',
      border: '#6ee7b7',
    },
    not_now: {
      bg: '#fef2f2',
      text: '#ef4444',
      border: '#fca5a5',
    },
  }

  return {
    spacing,
    transitions,
    borderRadius,
    shadows,
    statusColors,
  }
}
