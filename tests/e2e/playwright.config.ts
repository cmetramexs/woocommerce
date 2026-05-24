import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    timeout: 30_1000,
    retries: 0,
    use: {
        baseURL: 'http://localhost:8888',
        headless: true,
        viewport: { width: 1280, height: 720 },
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
});