/**
 * Duplicate Detection Service — SHA-256 + content hashing.
 */
import { createHash } from "crypto"

export class DuplicateDetectionService {
  static generateFileHash(fileBuffer: Buffer): string {
    return createHash("sha256").update(fileBuffer).digest("hex")
  }

  static generateContentHash(text: string): string {
    const normalizedText = text.replace(/\s+/g, " ").toLowerCase().trim()
    return createHash("md5").update(normalizedText).digest("hex")
  }
}
