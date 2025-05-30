/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',  // The environment where your tests will run
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',  // Transform TypeScript files using ts-jest
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',  // Ensure ts-jest uses your tsconfig file
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],  // File types Jest will understand
  preset: 'ts-jest',  // Use ts-jest preset for handling TypeScript
};
