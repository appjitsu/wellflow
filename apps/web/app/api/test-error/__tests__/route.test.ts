import { POST } from '../route';
import { NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('/api/test-error', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should successfully proxy request to API endpoint', async () => {
    const mockResponseData = {
      message: 'Test error triggered',
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponseData),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await POST();

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/test-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(NextResponse.json).toHaveBeenCalledWith(mockResponseData);
  });

  it('should use default API_BASE_URL when environment variable is not set', async () => {
    // Ensure environment variable is not set
    delete process.env.NEXT_PUBLIC_API_URL;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'success' }),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await POST();

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/test-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should handle API response errors', async () => {
    const errorText = 'Internal Server Error';

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(errorText),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await POST();

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'API request failed', details: errorText },
      { status: 500 }
    );
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await POST();

    expect(consoleSpy).toHaveBeenCalledWith('Error calling API test-error endpoint:', networkError);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to call API endpoint', details: networkError },
      { status: 500 }
    );

    consoleSpy.mockRestore();
  });

  it('should handle API response with different status codes', async () => {
    const errorText = 'Bad Request';

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve(errorText),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await POST();

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'API request failed', details: errorText },
      { status: 400 }
    );
  });

  it('should handle empty error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve(''),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await POST();

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'API request failed', details: '' },
      { status: 404 }
    );
  });

  it('should handle JSON parsing errors from API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await POST();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error calling API test-error endpoint:',
      expect.any(Error)
    );
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to call API endpoint', details: expect.any(Error) },
      { status: 500 }
    );

    consoleSpy.mockRestore();
  });
});
