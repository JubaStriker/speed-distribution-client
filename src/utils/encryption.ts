import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_PASSWORD_ENCRYPTION_KEY;

/**
 * Encrypt data using AES encryption
 * @param data - Data to encrypt (string)
 * @returns Encrypted string
 */
export const encryptData = (data: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};


export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
};

/**
 * Encrypt password specifically for API transmission
 * @param password - Plain text password
 * @returns Encrypted password
 */
export const encryptPassword = (password: string): string => {
  return encryptData(password);
};
