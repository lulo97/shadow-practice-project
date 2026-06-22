import { test, expect } from '@playwright/test';
import { BASE_URL } from './utils/utils';

test('health check returns status 200 and message ok', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/v1/health`);

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toEqual({ message: 'ok' });
});