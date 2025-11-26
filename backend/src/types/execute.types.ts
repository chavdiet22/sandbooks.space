import { z } from 'zod';

// Supported languages
export const SupportedLanguage = z.enum(['python', 'javascript', 'typescript', 'bash', 'go']);
export type SupportedLanguage = z.infer<typeof SupportedLanguage>;

// Default timeouts per language (in seconds)
// These are sensible defaults that users can override
export const DEFAULT_TIMEOUTS: Record<SupportedLanguage, number> = {
  python: 900,      // 15 min - allows for pip install of large packages
  javascript: 60,   // 1 min
  typescript: 60,   // 1 min
  bash: 900,        // 15 min - shell scripts including package installs
  go: 60,           // 1 min
};

// Maximum allowed timeout (15 minutes) - supports pip install
export const MAX_TIMEOUT_SECONDS = 900;

// Request schema with validation
export const ExecuteRequestSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty').max(100000, 'Code too long'),
  language: SupportedLanguage,
  // Optional user-specified timeout (capped at MAX_TIMEOUT_SECONDS)
  timeout: z.number().int().min(1).max(MAX_TIMEOUT_SECONDS).optional()
});

export type ExecuteRequest = z.infer<typeof ExecuteRequestSchema>;

// Rich output types
export interface RichOutput {
  type: string;
  data: string;
}

// Response interface
export interface ExecuteResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  richOutputs?: RichOutput[];
  error?: string;
}
