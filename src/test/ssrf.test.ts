import { describe, it, expect } from 'vitest';
import {
  validateURL,
  validateURLSync,
  validateURLs,
} from '../lib/ssrf';

describe('SSRF Protection', () => {
  describe('validateURLSync', () => {
    it('should allow valid HTTPS URLs', () => {
      const result = validateURLSync('https://example.com/path');
      expect(result.safe).toBe(true);
      expect(result.hostname).toBe('example.com');
    });

    it('should allow valid HTTP URLs', () => {
      const result = validateURLSync('http://example.com');
      expect(result.safe).toBe(true);
    });

    it('should block localhost', () => {
      expect(validateURLSync('http://localhost/path').safe).toBe(false);
      expect(validateURLSync('http://localhost:3000').safe).toBe(false);
      expect(validateURLSync('http://127.0.0.1').safe).toBe(false);
    });

    it('should block internal domains', () => {
      expect(validateURLSync('http://internal.corp').safe).toBe(false);
      expect(validateURLSync('http://service.local').safe).toBe(false);
      expect(validateURLSync('http://db.internal').safe).toBe(false);
    });

    it('should block AWS metadata endpoints', () => {
      expect(validateURLSync('http://169.254.169.254/latest/meta-data').safe).toBe(false);
      expect(validateURLSync('http://metadata.google.internal').safe).toBe(false);
    });

    it('should block file:// protocol', () => {
      expect(validateURLSync('file:///etc/passwd').safe).toBe(false);
    });

    it('should block data:// protocol', () => {
      expect(validateURLSync('data:text/html,<script>alert(1)</script>').safe).toBe(false);
    });

    it('should block invalid URLs', () => {
      expect(validateURLSync('not-a-url').safe).toBe(false);
      expect(validateURLSync('').safe).toBe(false);
    });
  });

  describe('validateURL (async)', () => {
    it('should allow public domains', async () => {
      const result = await validateURL('https://github.com');
      expect(result.safe).toBe(true);
    });

    it('should block localhost', async () => {
      const result = await validateURL('http://localhost:8080');
      expect(result.safe).toBe(false);
    });
  });

  describe('validateURLs', () => {
    it('should separate valid and invalid URLs', async () => {
      const urls = [
        'https://example.com',
        'https://github.com',
        'http://localhost',
        'ftp://invalid.com',
      ];

      const { valid, invalid } = await validateURLs(urls);

      expect(valid).toHaveLength(2);
      expect(invalid).toHaveLength(2);
      expect(valid).toContain('https://example.com');
      expect(valid).toContain('https://github.com');
    });
  });
});
