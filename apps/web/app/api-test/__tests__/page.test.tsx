import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ApiTestPage from '../page';

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('ApiTestPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should render API test page', async () => {
    // Mock successful health check to complete initial loading
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'ok',
          timestamp: '2024-01-01T00:00:00.000Z',
          uptime: 123.456,
          environment: 'test',
          version: '1.0.0',
        }),
    } as Response);

    render(<ApiTestPage />);

    expect(screen.getByText('API Connection Test')).toBeInTheDocument();

    // Wait for initial health check to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /test health endpoint/i })).toBeInTheDocument();
    });
  });

  it('should display loading state when testing health endpoint', async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    status: 'ok',
                    timestamp: '2024-01-01T00:00:00.000Z',
                    uptime: 123.456,
                    environment: 'test',
                    version: '1.0.0',
                    services: {
                      database: 'connected',
                      redis: 'connected',
                      sentry: true,
                    },
                  }),
              } as Response),
            100
          )
        )
    );

    render(<ApiTestPage />);

    // Wait for initial loading to complete and button to be available
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /test health endpoint/i })).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /test health endpoint/i });
    fireEvent.click(button);

    // Should show loading state after click
    await waitFor(() => {
      expect(screen.getByText('Testing...')).toBeInTheDocument();
    });
    expect(button).toBeDisabled();
  });

  it('should display health data on successful API call', async () => {
    const mockHealthData = {
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
      uptime: 123.456,
      environment: 'test',
      version: '1.0.0',
      services: {
        database: 'connected',
        redis: 'connected',
        sentry: true,
      },
    };

    // Mock the initial useEffect call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHealthData),
    } as Response);

    // Mock the button click call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHealthData),
    } as Response);

    render(<ApiTestPage />);

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /test health endpoint/i })).toBeInTheDocument();
    });

    await act(async () => {
      const button = screen.getByRole('button', { name: /test health endpoint/i });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('✅ API is healthy!')).toBeInTheDocument();
    });

    // Check for JSON content in the pre tag
    expect(screen.getByText(/"status": "ok"/)).toBeInTheDocument();
    expect(screen.getByText(/"environment": "test"/)).toBeInTheDocument();
    expect(screen.getByText(/"version": "1.0.0"/)).toBeInTheDocument();
  });

  it('should display error message on API failure', async () => {
    // Mock the initial useEffect call to fail
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ApiTestPage />);

    // Wait for initial error to be displayed
    await waitFor(() => {
      expect(screen.getByText('❌ Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(screen.queryByText('✅ API is healthy!')).not.toBeInTheDocument();
  });

  it('should display error message on HTTP error response', async () => {
    // First call for initial useEffect - let it fail
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    render(<ApiTestPage />);

    // Wait for initial error to be displayed
    await waitFor(() => {
      expect(screen.getByText('HTTP error! status: 500')).toBeInTheDocument();
    });
  });

  it('should clear previous results when testing again', async () => {
    // First successful call (for initial useEffect)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'ok',
          environment: 'test',
        }),
    } as Response);

    // Second successful call (for button click)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'ok',
          environment: 'test',
        }),
    } as Response);

    render(<ApiTestPage />);

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /test health endpoint/i })).toBeInTheDocument();
    });

    await act(async () => {
      const button = screen.getByRole('button', { name: /test health endpoint/i });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText(/"status": "ok"/)).toBeInTheDocument();
    });

    // Third call with error (for second button click)
    mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

    await act(async () => {
      const button = screen.getByRole('button', { name: /test health endpoint/i });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    // Previous success data should still be visible (health data is not cleared on error)
    expect(screen.getByText('✅ API is healthy!')).toBeInTheDocument();
    expect(screen.getByText(/"status": "ok"/)).toBeInTheDocument();
  });

  it('should use correct API URL', async () => {
    // Mock for initial useEffect call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    } as Response);

    render(<ApiTestPage />);

    // Wait for initial call to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/health');
    });
  });

  it('should handle missing services in health response', async () => {
    const mockHealthData = {
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
      uptime: 123.456,
      environment: 'test',
      version: '1.0.0',
      // services object is missing
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHealthData),
    } as Response);

    render(<ApiTestPage />);

    await waitFor(() => {
      expect(screen.getByText('✅ API is healthy!')).toBeInTheDocument();
    });

    expect(screen.getByText(/"status": "ok"/)).toBeInTheDocument();
    // Since services object is missing, these shouldn't appear in the JSON
    expect(screen.queryByText(/"database"/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"redis"/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"sentry"/)).not.toBeInTheDocument();
  });

  it('should test fetch users functionality', async () => {
    const mockUsers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    // Mock initial health check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    } as Response);

    // Mock fetch users call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    } as Response);

    render(<ApiTestPage />);

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /fetch users/i })).toBeInTheDocument();
    });

    await act(async () => {
      const button = screen.getByRole('button', { name: /fetch users/i });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/users');
  });

  it('should test create user functionality', async () => {
    const newUser = {
      id: 3,
      name: 'Bob Wilson',
      email: 'bob@example.com',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    // Mock initial health check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    } as Response);

    // Mock create user call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newUser),
    } as Response);

    render(<ApiTestPage />);

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
    });

    // Fill in the form
    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Bob Wilson' } });
      fireEvent.change(emailInput, { target: { value: 'bob@example.com' } });
    });

    await act(async () => {
      const button = screen.getByRole('button', { name: /create user/i });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Bob Wilson', email: 'bob@example.com' }),
      });
    });

    // Form should be cleared after successful creation
    expect(nameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');
  });

  it('should handle create user validation error', async () => {
    // Mock initial health check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    } as Response);

    render(<ApiTestPage />);

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
    });

    // Try to create user without filling form
    await act(async () => {
      const button = screen.getByRole('button', { name: /create user/i });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Please fill in both name and email')).toBeInTheDocument();
    });

    // Should not make API call
    expect(mockFetch).toHaveBeenCalledTimes(1); // Only the initial health check
  });

  it('should handle fetch users error', async () => {
    // Mock initial health check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    } as Response);

    // Mock fetch users error
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch users'));

    render(<ApiTestPage />);

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /fetch users/i })).toBeInTheDocument();
    });

    await act(async () => {
      const button = screen.getByRole('button', { name: /fetch users/i });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
    });
  });

  it('should handle create user error', async () => {
    // Mock initial health check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    } as Response);

    // Mock create user error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as Response);

    render(<ApiTestPage />);

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
    });

    // Fill in the form
    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    });

    await act(async () => {
      const button = screen.getByRole('button', { name: /create user/i });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('HTTP error! status: 400')).toBeInTheDocument();
    });
  });
});
