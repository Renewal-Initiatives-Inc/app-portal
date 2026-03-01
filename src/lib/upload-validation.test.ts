import { describe, it, expect } from 'vitest';
import { validateMagicBytes } from './upload-validation';

// Helper to create an ArrayBuffer from byte arrays
function makeBuffer(...bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

// Valid file signatures
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
const WEBP_HEADER = [
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x00, 0x00, 0x00, 0x00, // file size (placeholder)
  0x57, 0x45, 0x42, 0x50, // WEBP
];

describe('validateMagicBytes', () => {
  describe('PNG validation', () => {
    it('accepts valid PNG', () => {
      const buffer = makeBuffer(...PNG_HEADER);
      expect(validateMagicBytes(buffer, 'image/png')).toBe(true);
    });

    it('rejects JPEG bytes with PNG mime type', () => {
      const buffer = makeBuffer(...JPEG_HEADER);
      expect(validateMagicBytes(buffer, 'image/png')).toBe(false);
    });
  });

  describe('JPEG validation', () => {
    it('accepts valid JPEG with image/jpeg', () => {
      const buffer = makeBuffer(...JPEG_HEADER);
      expect(validateMagicBytes(buffer, 'image/jpeg')).toBe(true);
    });

    it('accepts valid JPEG with image/jpg alias', () => {
      const buffer = makeBuffer(...JPEG_HEADER);
      expect(validateMagicBytes(buffer, 'image/jpg')).toBe(true);
    });

    it('rejects PNG bytes with JPEG mime type', () => {
      const buffer = makeBuffer(...PNG_HEADER);
      expect(validateMagicBytes(buffer, 'image/jpeg')).toBe(false);
    });
  });

  describe('WebP validation', () => {
    it('accepts valid WebP', () => {
      const buffer = makeBuffer(...WEBP_HEADER);
      expect(validateMagicBytes(buffer, 'image/webp')).toBe(true);
    });

    it('rejects RIFF without WEBP marker', () => {
      const riffNonWebp = [
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00,
        0x41, 0x56, 0x49, 0x20, // AVI instead of WEBP
      ];
      const buffer = makeBuffer(...riffNonWebp);
      expect(validateMagicBytes(buffer, 'image/webp')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('rejects empty buffer', () => {
      const buffer = makeBuffer();
      expect(validateMagicBytes(buffer, 'image/png')).toBe(false);
    });

    it('rejects buffer too short for signature', () => {
      const buffer = makeBuffer(0x89, 0x50);
      expect(validateMagicBytes(buffer, 'image/png')).toBe(false);
    });

    it('rejects unknown mime type', () => {
      const buffer = makeBuffer(...PNG_HEADER);
      expect(validateMagicBytes(buffer, 'image/gif')).toBe(false);
    });

    it('rejects text file disguised as PNG', () => {
      // "<!DOCTYPE" in bytes
      const htmlBytes = [0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45];
      const buffer = makeBuffer(...htmlBytes);
      expect(validateMagicBytes(buffer, 'image/png')).toBe(false);
    });
  });
});
