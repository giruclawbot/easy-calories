import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(jpg|jpeg|png|gif|svg|ico)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/**/page.tsx',
    '!src/lib/firebase.ts',       // Firebase singleton — browser-only, not unit-testable
    '!src/lib/firestore.ts',      // Firestore CRUD — requires Firebase emulator for integration tests
    '!src/components/AuthProvider.tsx',   // Firebase Auth context — integration test
    '!src/components/BarcodeScanner.tsx', // Camera/Quagga2 — requires real device
    '!src/components/FoodSearch.tsx',     // Complex form with external API — integration test
    '!src/app/dashboard/layout.tsx',   // Firebase Auth guard — integration test
    '!src/components/NavBar.tsx',         // Firebase signOut — integration test
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
}

export default config
