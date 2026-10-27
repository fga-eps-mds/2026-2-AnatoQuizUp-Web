import { trimTrailingSlash } from "../utils/url";

const DEFAULT_API_BASE_URL = 'http://localhost:4000/api/v1';

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined || value === '') return defaultValue;

  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const apiBaseUrlFromEnv = import.meta.env?.VITE_API_URL as string | undefined;

export const API_BASE_URL: string = trimTrailingSlash(
  apiBaseUrlFromEnv && apiBaseUrlFromEnv.trim() !== ''
    ? apiBaseUrlFromEnv.trim()
    : DEFAULT_API_BASE_URL,
);

export const USE_MOCKS: boolean = parseBooleanEnv(
  import.meta.env?.VITE_USE_MOCKS as string | undefined,
  false,
);

// Senha da conta de demonstracao do mock; vazia desabilita a checagem de senha.
export const AVATAR_DEMO_PASSWORD: string =
  (import.meta.env?.VITE_AVATAR_DEMO_PASSWORD as string | undefined)?.trim() ?? '';
