module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/domain/**/*.js',
    'src/validators/**/*.js'
  ],
  coverageThreshold: {
    global: { statements: 60, branches: 60, functions: 60, lines: 60 }
  },
  testMatch: ['**/tests/**/*.test.js']
};
