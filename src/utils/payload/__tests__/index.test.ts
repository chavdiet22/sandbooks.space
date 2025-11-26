/**
 * Payload module barrel file exports test.
 */
import { describe, it, expect } from 'vitest';
import {
  // Types are tested implicitly through usage
  NodeType,
  InlineType,
  LanguageCode,
  ColorCode,
  PAYLOAD_CONSTANTS,
  PayloadError,
  PayloadEncodeError,
  PayloadDecodeError,
  PayloadTooLargeError,
  PayloadExpiredError,
  PayloadVersionError,
  // Mappers
  noteToPayload,
  payloadToNote,
  nodeToPayload,
  payloadToNode,
  inlinesToPayload,
  payloadToInlines,
  countPayloadNodes,
  validatePayloadStructure,
  // Encoder
  encodePayload,
  estimateEncodedSize,
  // Decoder
  decodePayload,
  decodePayloadToNote,
  isValidPayloadToken,
  getPayloadMetadata,
  getDecodeErrorMessage,
  // URL utilities
  parsePayloadUrl,
  isCurrentUrlPayload,
  createPayloadUrl,
  createPayloadHash,
  getBaseUrl,
  clearPayloadFromUrl,
  setPayloadInUrl,
  hasUrlHash,
  getUrlHash,
} from '../index';

describe('payload index exports', () => {
  describe('type enums and constants', () => {
    it('exports NodeType enum', () => {
      expect(NodeType).toBeDefined();
      expect(NodeType.Paragraph).toBe(0);
      expect(NodeType.Heading).toBe(1);
    });

    it('exports InlineType enum', () => {
      expect(InlineType).toBeDefined();
      expect(InlineType.Bold).toBe(0);
    });

    it('exports LanguageCode enum', () => {
      expect(LanguageCode).toBeDefined();
      expect(LanguageCode.Python).toBe(0);
    });

    it('exports ColorCode enum', () => {
      expect(ColorCode).toBeDefined();
      expect(ColorCode.Gray).toBe(0);
    });

    it('exports PAYLOAD_CONSTANTS', () => {
      expect(PAYLOAD_CONSTANTS).toBeDefined();
      expect(PAYLOAD_CONSTANTS.CURRENT_VERSION).toBe(1);
      expect(PAYLOAD_CONSTANTS.MAX_TOKEN_LENGTH).toBe(8000);
    });
  });

  describe('error classes', () => {
    it('exports PayloadError base class', () => {
      expect(PayloadError).toBeDefined();
      const error = new PayloadError('test');
      expect(error).toBeInstanceOf(Error);
    });

    it('exports PayloadEncodeError', () => {
      expect(PayloadEncodeError).toBeDefined();
      const error = new PayloadEncodeError('test');
      expect(error).toBeInstanceOf(PayloadError);
    });

    it('exports PayloadDecodeError', () => {
      expect(PayloadDecodeError).toBeDefined();
      const error = new PayloadDecodeError('test', 'user message');
      expect(error).toBeInstanceOf(PayloadError);
    });

    it('exports PayloadTooLargeError', () => {
      expect(PayloadTooLargeError).toBeDefined();
      const error = new PayloadTooLargeError(10000, 5000);
      expect(error).toBeInstanceOf(PayloadError);
    });

    it('exports PayloadExpiredError', () => {
      expect(PayloadExpiredError).toBeDefined();
      const error = new PayloadExpiredError(new Date());
      expect(error).toBeInstanceOf(PayloadError);
    });

    it('exports PayloadVersionError', () => {
      expect(PayloadVersionError).toBeDefined();
      const error = new PayloadVersionError(99, { min: 1, max: 10 });
      expect(error).toBeInstanceOf(PayloadError);
    });
  });

  describe('mapper functions', () => {
    it('exports noteToPayload', () => {
      expect(noteToPayload).toBeDefined();
      expect(typeof noteToPayload).toBe('function');
    });

    it('exports payloadToNote', () => {
      expect(payloadToNote).toBeDefined();
      expect(typeof payloadToNote).toBe('function');
    });

    it('exports nodeToPayload', () => {
      expect(nodeToPayload).toBeDefined();
      expect(typeof nodeToPayload).toBe('function');
    });

    it('exports payloadToNode', () => {
      expect(payloadToNode).toBeDefined();
      expect(typeof payloadToNode).toBe('function');
    });

    it('exports inlinesToPayload', () => {
      expect(inlinesToPayload).toBeDefined();
      expect(typeof inlinesToPayload).toBe('function');
    });

    it('exports payloadToInlines', () => {
      expect(payloadToInlines).toBeDefined();
      expect(typeof payloadToInlines).toBe('function');
    });

    it('exports countPayloadNodes', () => {
      expect(countPayloadNodes).toBeDefined();
      expect(typeof countPayloadNodes).toBe('function');
    });

    it('exports validatePayloadStructure', () => {
      expect(validatePayloadStructure).toBeDefined();
      expect(typeof validatePayloadStructure).toBe('function');
    });
  });

  describe('encoder functions', () => {
    it('exports encodePayload', () => {
      expect(encodePayload).toBeDefined();
      expect(typeof encodePayload).toBe('function');
    });

    it('exports estimateEncodedSize', () => {
      expect(estimateEncodedSize).toBeDefined();
      expect(typeof estimateEncodedSize).toBe('function');
    });
  });

  describe('decoder functions', () => {
    it('exports decodePayload', () => {
      expect(decodePayload).toBeDefined();
      expect(typeof decodePayload).toBe('function');
    });

    it('exports decodePayloadToNote', () => {
      expect(decodePayloadToNote).toBeDefined();
      expect(typeof decodePayloadToNote).toBe('function');
    });

    it('exports isValidPayloadToken', () => {
      expect(isValidPayloadToken).toBeDefined();
      expect(typeof isValidPayloadToken).toBe('function');
    });

    it('exports getPayloadMetadata', () => {
      expect(getPayloadMetadata).toBeDefined();
      expect(typeof getPayloadMetadata).toBe('function');
    });

    it('exports getDecodeErrorMessage', () => {
      expect(getDecodeErrorMessage).toBeDefined();
      expect(typeof getDecodeErrorMessage).toBe('function');
    });
  });

  describe('URL utility functions', () => {
    it('exports parsePayloadUrl', () => {
      expect(parsePayloadUrl).toBeDefined();
      expect(typeof parsePayloadUrl).toBe('function');
    });

    it('exports isCurrentUrlPayload', () => {
      expect(isCurrentUrlPayload).toBeDefined();
      expect(typeof isCurrentUrlPayload).toBe('function');
    });

    it('exports createPayloadUrl', () => {
      expect(createPayloadUrl).toBeDefined();
      expect(typeof createPayloadUrl).toBe('function');
    });

    it('exports createPayloadHash', () => {
      expect(createPayloadHash).toBeDefined();
      expect(typeof createPayloadHash).toBe('function');
    });

    it('exports getBaseUrl', () => {
      expect(getBaseUrl).toBeDefined();
      expect(typeof getBaseUrl).toBe('function');
    });

    it('exports clearPayloadFromUrl', () => {
      expect(clearPayloadFromUrl).toBeDefined();
      expect(typeof clearPayloadFromUrl).toBe('function');
    });

    it('exports setPayloadInUrl', () => {
      expect(setPayloadInUrl).toBeDefined();
      expect(typeof setPayloadInUrl).toBe('function');
    });

    it('exports hasUrlHash', () => {
      expect(hasUrlHash).toBeDefined();
      expect(typeof hasUrlHash).toBe('function');
    });

    it('exports getUrlHash', () => {
      expect(getUrlHash).toBeDefined();
      expect(typeof getUrlHash).toBe('function');
    });
  });
});
