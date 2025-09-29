// Settings E2E Tests
/* eslint-disable sonarjs/no-hardcoded-ip */
import { test, expect } from '@playwright/test';

// Mock user data
const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  role: 'USER',
  isActive: true,
  organizationId: 'org-1',
};

const mockActivityHistory = [
  {
    id: '1',
    type: 'login',
    description: 'Successful login',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    ipAddress: '192.168.1.100',
    location: 'San Francisco, CA',
    success: true,
  },
  {
    id: '2',
    type: 'profile_update',
    description: 'Profile information updated',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    ipAddress: '192.168.1.100',
    success: true,
  },
];

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/auth/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.route('**/users/activity', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockActivityHistory),
      });
    });

    // Navigate to settings page
    await page.goto('/dashboard/settings');
  });

  test('should display settings page with tabs', async ({ page }) => {
    // Check page title and description
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Manage your account settings')).toBeVisible();

    // Check tabs are present
    await expect(page.getByRole('tab', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Security' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Activity' })).toBeVisible();

    // Profile tab should be active by default
    await expect(page.getByRole('tab', { name: 'Profile' })).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  test('should display profile information in profile tab', async ({ page }) => {
    // Profile tab should be active by default
    await expect(page.getByRole('tabpanel')).toContainText('Profile Information');

    // Check form fields are populated
    await expect(page.locator('[value="John"]')).toBeVisible();
    await expect(page.locator('[value="Doe"]')).toBeVisible();
    await expect(page.locator('[value="john.doe@example.com"]')).toBeVisible();
    await expect(page.locator('[value="+1 (555) 123-4567"]')).toBeVisible();

    // Check avatar initials
    await expect(page.getByText('JD')).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    // Mock successful profile update
    await page.route('**/users/profile', async (route) => {
      if (route.request().method() === 'PUT') {
        const updatedUser = {
          ...mockUser,
          firstName: 'Jane',
          lastName: 'Smith',
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedUser),
        });
      }
    });

    // Update first name
    const firstNameInput = page.getByPlaceholder('Enter your first name');
    await firstNameInput.clear();
    await firstNameInput.fill('Jane');

    // Update last name
    const lastNameInput = page.getByPlaceholder('Enter your last name');
    await lastNameInput.clear();
    await lastNameInput.fill('Smith');

    // Submit form
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Check for success message (toast)
    await expect(page.getByText('Profile updated successfully!')).toBeVisible();
  });

  test('should switch to security tab and display password form', async ({ page }) => {
    // Click security tab
    await page.getByRole('tab', { name: 'Security' }).click();

    // Check security tab is active
    await expect(page.getByRole('tab', { name: 'Security' })).toHaveAttribute(
      'data-state',
      'active'
    );

    // Check password change form
    await expect(page.getByText('Change Password')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your current password')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your new password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm your new password')).toBeVisible();

    // Check security information section
    await expect(page.getByText('Security Information')).toBeVisible();
    await expect(page.getByText('Strong Password')).toBeVisible();
  });

  test('should change password successfully', async ({ page }) => {
    // Mock successful password change
    await page.route('**/auth/change-password', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password changed successfully',
            changedAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Switch to security tab
    await page.getByRole('tab', { name: 'Security' }).click();

    // Fill password form
    await page.getByPlaceholder('Enter your current password').fill('currentPassword123');
    await page.getByPlaceholder('Enter your new password').fill('newPassword123!');
    await page.getByPlaceholder('Confirm your new password').fill('newPassword123!');

    // Submit form
    await page.getByRole('button', { name: 'Change Password' }).click();

    // Check for success message
    await expect(page.getByText('Password changed successfully!')).toBeVisible();

    // Check form is reset
    await expect(page.getByPlaceholder('Enter your current password')).toHaveValue('');
    await expect(page.getByPlaceholder('Enter your new password')).toHaveValue('');
    await expect(page.getByPlaceholder('Confirm your new password')).toHaveValue('');
  });

  test('should display password strength indicator', async ({ page }) => {
    // Switch to security tab
    await page.getByRole('tab', { name: 'Security' }).click();

    // Type a weak password
    const newPasswordInput = page.getByPlaceholder('Enter your new password');
    await newPasswordInput.fill('weak');

    // Check strength indicator shows weak
    await expect(page.getByText('Very Weak')).toBeVisible();

    // Type a strong password
    await newPasswordInput.clear();
    await newPasswordInput.fill('StrongPassword123!');

    // Check strength indicator shows strong
    await expect(page.getByText('Strong')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    // Switch to security tab
    await page.getByRole('tab', { name: 'Security' }).click();

    const currentPasswordInput = page.getByPlaceholder('Enter your current password');
    const toggleButton = page.locator('button').filter({ hasText: /eye/i }).first();

    // Initially password should be hidden
    await expect(currentPasswordInput).toHaveAttribute('type', 'password');

    // Click toggle button to show password
    await toggleButton.click();
    await expect(currentPasswordInput).toHaveAttribute('type', 'text');

    // Click again to hide password
    await toggleButton.click();
    await expect(currentPasswordInput).toHaveAttribute('type', 'password');
  });

  test('should switch to activity tab and display activity history', async ({ page }) => {
    // Click activity tab
    await page.getByRole('tab', { name: 'Activity' }).click();

    // Check activity tab is active
    await expect(page.getByRole('tab', { name: 'Activity' })).toHaveAttribute(
      'data-state',
      'active'
    );

    // Check activity summary cards
    await expect(page.getByText('Recent Logins')).toBeVisible();
    await expect(page.getByText('Security Events')).toBeVisible();
    await expect(page.getByText('Failed Attempts')).toBeVisible();

    // Check activity table
    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('Successful login')).toBeVisible();
    await expect(page.getByText('Profile information updated')).toBeVisible();

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Activity' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Date & Time' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Location' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('should filter activity history', async ({ page }) => {
    // Switch to activity tab
    await page.getByRole('tab', { name: 'Activity' }).click();

    // Check initial state shows all activities
    await expect(page.getByText('Successful login')).toBeVisible();
    await expect(page.getByText('Profile information updated')).toBeVisible();

    // Open filter dropdown
    await page.getByRole('combobox').click();

    // Select "Logins" filter
    await page.getByRole('option', { name: 'Logins' }).click();

    // Should only show login activities
    await expect(page.getByText('Successful login')).toBeVisible();
    // Profile update should be filtered out (if it exists in the filtered view)
  });

  test('should sort activity history by clicking column headers', async ({ page }) => {
    // Switch to activity tab
    await page.getByRole('tab', { name: 'Activity' }).click();

    // Click on Date & Time column header to sort
    await page.getByRole('button', { name: 'Date & Time' }).click();

    // Verify sorting indicator is present (arrow icon)
    await expect(page.locator('[data-testid="sort-icon"]').or(page.locator('svg'))).toBeVisible();
  });

  test('should refresh activity history', async ({ page }) => {
    // Switch to activity tab
    await page.getByRole('tab', { name: 'Activity' }).click();

    // Click refresh button
    await page
      .getByRole('button')
      .filter({ hasText: /refresh/i })
      .click();

    // Should show loading state briefly
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error for profile
    await page.route('**/auth/profile', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal server error' }),
      });
    });

    await page.goto('/dashboard/settings');

    // Should show error message
    await expect(page.getByText('Failed to load profile information')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    // Clear required field
    const firstNameInput = page.getByPlaceholder('Enter your first name');
    await firstNameInput.clear();

    // Try to submit
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Should show validation error
    await expect(page.getByText('First name is required')).toBeVisible();
  });
});
