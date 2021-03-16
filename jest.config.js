module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // testSequencer: "./jest.sequencer.js",
  collectCoverage: true,
  coverageReporters: ["text", "text-summary"],
  testPathIgnorePatterns: [".d.ts", ".js"],
  testTimeout: 20000
};