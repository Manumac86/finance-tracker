import { Page } from '@playwright/test';

export async function fillSignUpForm(
  page: Page,
  email: string,
  password: string,
  confirmPassword: string
) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm Password').fill(confirmPassword);
}

export async function fillSignInForm(
  page: Page,
  email: string,
  password: string
) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
}

export async function waitForDashboard(page: Page) {
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 5000 });
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: /user menu/i }).click();
  await page.getByRole('menuitem', { name: /sign out/i }).click();
  await page.waitForURL('**/signin', { timeout: 5000 });
}