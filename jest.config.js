module.exports = {
  preset: 'ts-jest',
  roots: ["tests/"], // should not run tests in `lib/tests/`, this is an unfortunate byproduct of having typescript lint things in vscode and i am lazy
  testEnvironment: 'node'
};