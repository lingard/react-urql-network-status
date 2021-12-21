module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*'],
  roots: ['tests', 'example'],
  modulePathIgnorePatterns: ['util']
}
