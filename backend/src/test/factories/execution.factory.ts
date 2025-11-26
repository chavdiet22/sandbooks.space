/**
 * Test factories for code execution types.
 */
import { faker } from '@faker-js/faker';
import type { ExecuteRequest, ExecuteResponse, SupportedLanguage } from '../../types/execute.types';

const LANGUAGES: SupportedLanguage[] = ['python', 'javascript', 'typescript', 'bash', 'go'];

/**
 * Creates a mock ExecuteRequest.
 */
export const createExecuteRequest = (
  overrides: Partial<ExecuteRequest> = {}
): ExecuteRequest => ({
  code: overrides.code ?? 'print("Hello")',
  language: overrides.language ?? faker.helpers.arrayElement(LANGUAGES),
  timeout: overrides.timeout,
  ...overrides,
});

/**
 * Creates a successful ExecuteResponse.
 */
export const createExecuteResponse = (
  overrides: Partial<ExecuteResponse> = {}
): ExecuteResponse => ({
  stdout: overrides.stdout ?? 'Hello\n',
  stderr: overrides.stderr ?? '',
  exitCode: overrides.exitCode ?? 0,
  executionTime: overrides.executionTime ?? faker.number.int({ min: 10, max: 500 }),
  richOutputs: overrides.richOutputs,
  error: overrides.error,
  ...overrides,
});

/**
 * Creates an error ExecuteResponse.
 */
export const createErrorExecuteResponse = (
  error = 'Execution failed',
  stderr = ''
): ExecuteResponse => ({
  stdout: '',
  stderr: stderr || error,
  exitCode: 1,
  executionTime: 0,
  error,
});

/**
 * Creates a timeout ExecuteResponse.
 */
export const createTimeoutExecuteResponse = (): ExecuteResponse => ({
  stdout: '',
  stderr: 'Process terminated: execution timeout',
  exitCode: 124,
  executionTime: 30000,
  error: 'Execution timeout',
});

/**
 * Code samples for different languages.
 */
export const codeSamples: Record<SupportedLanguage, string> = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!");',
  typescript: 'const msg: string = "Hello"; console.log(msg);',
  bash: 'echo "Hello, World!"',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello")\n}',
};
