import crypto, { BinaryLike } from "crypto";

/**
 * Encrypt a string with AES-256-GCM (authenticated encryption)
 * @param text - The string to encrypt
 * @param secretKey - The secret key for encryption
 * @returns Encrypted string data in a structured format
 */
export function encryptString(text: string, secretKey: string): string {
  try {
    // Convert the secret to a consistent key using key derivation
    const key = crypto.scryptSync(
      secretKey,
      "salt",
      32
    ) as unknown as BinaryLike;

    // Generate a random initialization vector
    const iv = crypto.randomBytes(12) as unknown as BinaryLike;

    // Create cipher with AES-256-GCM (authenticated encryption)
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    // Encrypt the string
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Get the authentication tag
    const authTag = cipher.getAuthTag().toString("base64");

    // Combine all components into a single string
    // Format: iv:authTag:encrypted
    const encryptedData = [iv.toString(), authTag, encrypted].join(":");

    return encryptedData;
  } catch (error) {
    throw new Error(
      `Encryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Decrypt a string that was encrypted with encryptString
 * @param encryptedData - The encrypted string data
 * @param secretKey - The same secret key used for encryption
 * @returns The original decrypted string
 */
export function decryptString(
  encryptedData: string,
  secretKey: string
): string {
  try {
    // Split the encrypted data into components
    const [ivString, authTagString, encryptedString] = encryptedData.split(":");

    // Convert components back to buffers
    const iv = Buffer.from(ivString, "base64") as unknown as BinaryLike;
    const authTag = Buffer.from(authTagString, "base64");

    // Derive the same key
    const key = crypto.scryptSync(
      secretKey,
      "salt",
      32
    ) as unknown as BinaryLike;

    // Create decipher
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag as never);

    // Decrypt
    let decrypted = decipher.update(encryptedString, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(
      `Decryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Simple usage examples
 */
function example() {
  const secretKey = "your-secure-secret-key";
  const sensitiveData = "This is sensitive information that needs encryption";

  // Encrypt
  const encrypted = encryptString(sensitiveData, secretKey);
  console.log("Encrypted:", encrypted);

  // Decrypt
  const decrypted = decryptString(encrypted, secretKey);
  console.log("Decrypted:", decrypted);
}
