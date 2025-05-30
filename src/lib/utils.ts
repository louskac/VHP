// Utility functions for VHP
export const generateToken = (prefix: string = 'vhp'): string => {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  export const validateNocenaId = (id: string): boolean => {
    // Basic validation for Nocena ID format
    return /^[a-zA-Z0-9_-]{3,20}$/.test(id);
  };
  
  export const formatError = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  };