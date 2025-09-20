import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MonitoringTestPage from '../page';
import * as Sentry from '@sentry/nextjs';
import { captureException, addTag } from '../../../lib/logrocket';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Mock LogRocket
jest.mock('../../../lib/logrocket', () => ({
  captureException: jest.fn(),
  addTag: jest.fn(),
}));

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('MonitoringTestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    // Mock Date to have consistent timestamps
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render monitoring test page', () => {
    render(<MonitoringTestPage />);

    expect(screen.getByText('Monitoring Integration Test')).toBeInTheDocument();
    expect(screen.getByText('Frontend Tests')).toBeInTheDocument();
    expect(screen.getByText('API Tests')).toBeInTheDocument();
    expect(screen.getByText('Test Results')).toBeInTheDocument();
  });

  it('should render all test buttons', () => {
    render(<MonitoringTestPage />);

    expect(screen.getByText('Test Sentry Error')).toBeInTheDocument();
    expect(screen.getByText('Test Sentry Message')).toBeInTheDocument();
    expect(screen.getByText('Test LogRocket Exception')).toBeInTheDocument();
    expect(screen.getByText('Test LogRocket Tag')).toBeInTheDocument();
    expect(screen.getByText('Test API Error (Sentry)')).toBeInTheDocument();
    expect(screen.getByText('Test API Sentry Message')).toBeInTheDocument();
    expect(screen.getByText('Clear Results')).toBeInTheDocument();
  });

  it('should show initial empty state message', () => {
    render(<MonitoringTestPage />);

    expect(screen.getByText('No test results yet. Click the buttons above to test monitoring integrations.')).toBeInTheDocument();
  });

  it('should test Sentry error capture', async () => {
    render(<MonitoringTestPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Test Sentry Error'));
    });

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    expect(screen.getByText(/Sentry error captured/)).toBeInTheDocument();
  });

  it('should test Sentry message capture', async () => {
    render(<MonitoringTestPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Test Sentry Message'));
    });

    expect(Sentry.captureMessage).toHaveBeenCalledWith('Test Sentry message from web app', 'info');
    expect(screen.getByText(/Sentry message sent/)).toBeInTheDocument();
  });

  it('should test LogRocket exception capture', async () => {
    render(<MonitoringTestPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Test LogRocket Exception'));
    });

    expect(captureException).toHaveBeenCalledWith(expect.any(Error), { context: 'monitoring-test' });
    expect(screen.getByText(/LogRocket exception captured/)).toBeInTheDocument();
  });

  it('should test LogRocket tag addition', async () => {
    render(<MonitoringTestPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Test LogRocket Tag'));
    });

    expect(addTag).toHaveBeenCalledWith('test-feature', 'monitoring-test');
    expect(screen.getByText(/LogRocket tag added/)).toBeInTheDocument();
  });

  it('should test API error endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    render(<MonitoringTestPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Test API Error (Sentry)'));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/test-error', { method: 'POST' });
      expect(screen.getByText(/API error test completed/)).toBeInTheDocument();
    });
  });

  it('should test API Sentry endpoint success', async () => {
    const mockResponse = { message: 'Sentry test completed successfully' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    render(<MonitoringTestPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Test API Sentry Message'));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/test-sentry', { method: 'POST' });
      expect(screen.getByText(/API Sentry test: Sentry test completed successfully/)).toBeInTheDocument();
    });
  });

  it('should test API Sentry endpoint failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<MonitoringTestPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Test API Sentry Message'));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/test-sentry', { method: 'POST' });
      expect(screen.getByText(/API Sentry test failed/)).toBeInTheDocument();
    });
  });

  it('should clear test results', async () => {
    render(<MonitoringTestPage />);

    // Add some results first
    await act(async () => {
      fireEvent.click(screen.getByText('Test Sentry Error'));
    });

    expect(screen.getByText(/Sentry error captured/)).toBeInTheDocument();

    // Clear results
    await act(async () => {
      fireEvent.click(screen.getByText('Clear Results'));
    });

    expect(screen.queryByText(/Sentry error captured/)).not.toBeInTheDocument();
    expect(screen.getByText('No test results yet. Click the buttons above to test monitoring integrations.')).toBeInTheDocument();
  });

  it('should display multiple test results with timestamps', async () => {
    render(<MonitoringTestPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Test Sentry Error'));
      fireEvent.click(screen.getByText('Test Sentry Message'));
    });

    expect(screen.getByText(/Sentry error captured/)).toBeInTheDocument();
    expect(screen.getByText(/Sentry message sent/)).toBeInTheDocument();

    // Check that timestamps are present (format may vary by timezone)
    const results = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
    expect(results).toHaveLength(2);
  });

  it('should render instructions section', () => {
    render(<MonitoringTestPage />);

    expect(screen.getByText('Instructions:')).toBeInTheDocument();
    expect(screen.getByText(/Check your Sentry dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/Check your LogRocket dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/API tests will hit the backend endpoints/)).toBeInTheDocument();
    expect(screen.getByText(/Make sure environment variables are configured/)).toBeInTheDocument();
  });

  it('should handle API error with proper error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    render(<MonitoringTestPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Test API Error (Sentry)'));
    });

    await waitFor(() => {
      expect(screen.getByText(/API Error: 404/)).toBeInTheDocument();
    });
  });

  it('should handle successful API error test', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(<MonitoringTestPage />);

    await act(async () => {
      fireEvent.click(screen.getByText('Test API Error (Sentry)'));
    });

    // Should not show any error message since the API call succeeded
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/test-error', { method: 'POST' });
    });

    // The test should complete without adding an error result
    expect(screen.queryByText(/API error test completed/)).not.toBeInTheDocument();
  });
});
