import type {Config} from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
    verbose: true,
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: "src/",
    testPathIgnorePatterns: [
        "/src/__tests__/fixtures/"
    ],
};
export default config;
