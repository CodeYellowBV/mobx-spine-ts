import type {Config} from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
    verbose: true,
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    rootDir: "src/",
    testPathIgnorePatterns: [
        "/src/__tests__/fixtures/",
        "/src/__tests__/helpers/"
    ],
};
export default config;
