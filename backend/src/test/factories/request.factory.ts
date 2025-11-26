/**
 * Test factories for Express Request/Response objects.
 */
import { vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

/**
 * Creates a mock Express Request object.
 */
export const createMockRequest = <T = Record<string, unknown>>(
  overrides: Partial<Request> & { body?: T } = {}
): Partial<Request> => ({
  body: {} as T,
  params: {},
  query: {},
  headers: {},
  get: vi.fn((name: string) => (overrides.headers as Record<string, string>)?.[name.toLowerCase()]),
  ...overrides,
});

/**
 * Creates a mock Express Response object.
 */
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.set = vi.fn().mockReturnValue(res);
  res.write = vi.fn().mockReturnValue(true);
  res.end = vi.fn().mockReturnValue(res);
  res.on = vi.fn().mockReturnValue(res);
  res.once = vi.fn().mockReturnValue(res);
  res.flushHeaders = vi.fn();
  res.headersSent = false;
  return res;
};

/**
 * Creates a mock NextFunction.
 */
export const createMockNext = (): NextFunction => vi.fn();

/**
 * Creates a complete set of request, response, and next for controller tests.
 */
export const createMockRequestContext = <T = Record<string, unknown>>(
  requestOverrides: Partial<Request> & { body?: T } = {}
): {
  req: Partial<Request>;
  res: Partial<Response>;
  next: NextFunction;
} => ({
  req: createMockRequest<T>(requestOverrides),
  res: createMockResponse(),
  next: createMockNext(),
});
