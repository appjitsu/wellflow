// ProfileSettings Component Tests
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ProfileSettings } from '../profile-settings';
import { useProfile, useUpdateProfile } from '../../../hooks/use-auth';

// Mock the hooks
jest.mock('../../../hooks/use-auth');
const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;
const mockUseUpdateProfile = useUpdateProfile as jest.MockedFunction<typeof useUpdateProfile>;

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode | any }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  role: 'USER' as const,
  isActive: true,
  organizationId: 'org-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('ProfileSettings', () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseProfile.mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as any);

    mockUseUpdateProfile.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: false,
      isError: false,
    } as any);
  });

  it('should render profile form with user data', () => {
    render(<ProfileSettings />, { wrapper: createWrapper() });

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1 (555) 123-4567')).toBeInTheDocument();
  });

  it('should display user avatar with initials', () => {
    render(<ProfileSettings />, { wrapper: createWrapper() });

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false,
    } as any);

    render(<ProfileSettings />, { wrapper: createWrapper() });

    // Check for loading spinner element
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const error = new Error('Failed to load profile');
    mockUseProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      isSuccess: false,
      isError: true,
    } as any);

    render(<ProfileSettings />, { wrapper: createWrapper() });

    expect(screen.getByText('Failed to load profile information')).toBeInTheDocument();
    expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />, { wrapper: createWrapper() });

    // Update first name
    const firstNameInput = screen.getByDisplayValue('John');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jane');

    // Update last name
    const lastNameInput = screen.getByDisplayValue('Doe');
    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'Smith');

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />, { wrapper: createWrapper() });

    // Clear required field
    const firstNameInput = screen.getByDisplayValue('John');
    await user.clear(firstNameInput);

    // Try to submit
    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });

    // Should not call mutate with invalid data
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should validate phone number format', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />, { wrapper: createWrapper() });

    // Enter invalid phone number
    const phoneInput = screen.getByDisplayValue('+1 (555) 123-4567');
    await user.clear(phoneInput);
    await user.type(phoneInput, 'invalid-phone');

    // Try to submit
    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });

  it('should disable form during submission', () => {
    mockUseUpdateProfile.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isSuccess: false,
      isError: false,
    } as any);

    render(<ProfileSettings />, { wrapper: createWrapper() });

    // All inputs should be disabled
    expect(screen.getByDisplayValue('John')).toBeDisabled();
    expect(screen.getByDisplayValue('Doe')).toBeDisabled();
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeDisabled();
    expect(screen.getByDisplayValue('+1 (555) 123-4567')).toBeDisabled();

    // Submit button should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should handle empty phone number', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />, { wrapper: createWrapper() });

    // Clear phone number (optional field)
    const phoneInput = screen.getByDisplayValue('+1 (555) 123-4567');
    await user.clear(phoneInput);

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '',
    });
  });

  it('should show no data message when user is null', () => {
    mockUseProfile.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    } as any);

    render(<ProfileSettings />, { wrapper: createWrapper() });

    expect(screen.getByText('No profile data available')).toBeInTheDocument();
  });

  it('should display form descriptions', () => {
    render(<ProfileSettings />, { wrapper: createWrapper() });

    expect(
      screen.getByText('This email will be used for login and notifications.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Optional. Used for account recovery and notifications.')
    ).toBeInTheDocument();
  });

  it('should show change avatar button as disabled', () => {
    render(<ProfileSettings />, { wrapper: createWrapper() });

    const changeAvatarButton = screen.getByRole('button', { name: 'Change Avatar (Coming Soon)' });
    expect(changeAvatarButton).toBeDisabled();
  });
});
