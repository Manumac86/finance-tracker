export const testUsers = {
  newUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    confirmPassword: 'Test123!@#',
  },
  existingUser: {
    email: 'existing@example.com',
    password: 'Test123!@#',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
  // Clerk test user with email verification code
  clerkTestUser: {
    email: 'your_email+clerk_test@example.com',
    verificationCode: '424242',
  },
};

export const errorMessages = {
  invalidCredentials: 'Invalid email or password',
  emailAlreadyExists: 'Email already exists',
  passwordMismatch: 'Passwords do not match',
  weakPassword: 'Password must be at least 8 characters',
  invalidEmail: 'Please enter a valid email',
};