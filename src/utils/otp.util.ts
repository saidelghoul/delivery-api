import crypto from 'crypto';

export const generateOTP = (): string => {
  // Generates a random 6-digit number string
  return crypto.randomInt(100000, 999999).toString();
};
