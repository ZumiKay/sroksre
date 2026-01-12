import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!(jose)/)"],
  moduleNameMapper: {
    "^jose$": "<rootDir>/node_modules/jose/dist/node/cjs/index.js",
    "^@/(.*)$": "<rootDir>/$1",
    "\\.mjs$": "<rootDir>/jest.setup.ts", // Mock all .mjs files
  },
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/app/**/action*.ts",
    "!src/**/*.d.ts",
    "!src/**/types.ts",
  ],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "mjs"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
