/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)','<rootDir>/test/unit/**/*.test.ts?(x)'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'automatic' } },
          target: 'es2022',
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(?:.*\\/)?config/env(?:\\.ts)?$':
      '<rootDir>/src/shared/config/__mocks__/env.ts',
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.ts',
    '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/styleMock.ts',
  },
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
    '!src/main.tsx',
    '!src/__mocks__/**',
    '!src/setupTests.ts',
    '!src/shared/config/env.ts',
  ],
  reporters: [
    'default',
    [
      '@casualbot/jest-sonar-reporter',
      {
        outputDirectory: '.',
        outputName: 'sonar-report.xml',
        relativePaths: true,
      },
    ],
  ],
};

module.exports = config;
