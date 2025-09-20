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

describe('/api/test-sentry', () => {
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
    const mockResponseData = { message: 'Sentry test triggered', eventId: 'abc123' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponseData),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await POST();

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/test-sentry', {
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

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/test-sentry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should handle API response errors', async () => {
    const errorText = 'Sentry configuration error';

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
    const networkError = new Error('Connection timeout');
    mockFetch.mockRejectedValueOnce(networkError);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await POST();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error calling API test-sentry endpoint:',
      networkError
    );
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to call API endpoint', details: networkError },
      { status: 500 }
    );

    consoleSpy.mockRestore();
  });

  it('should handle unauthorized API responses', async () => {
    const errorText = 'Unauthorized';

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve(errorText),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await POST();

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'API request failed', details: errorText },
      { status: 401 }
    );
  });

  it('should handle service unavailable responses', async () => {
    const errorText = 'Service Unavailable';

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: () => Promise.resolve(errorText),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await POST();

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'API request failed', details: errorText },
      { status: 503 }
    );
  });

  it('should handle malformed JSON responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Unexpected token in JSON')),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await POST();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error calling API test-sentry endpoint:',
      expect.any(Error)
    );
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to call API endpoint', details: expect.any(Error) },
      { status: 500 }
    );

    consoleSpy.mockRestore();
  });

  it('should handle empty response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(''),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await POST();

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'API request failed', details: '' },
      { status: 500 }
    );
  });

  it('should handle successful response with complex data', async () => {
    const complexResponseData = {
      message: 'Sentry test completed',
      eventId: 'abc123def456',
      timestamp: '2024-01-01T00:00:00.000Z',
      metadata: {
        environment: 'test',
        release: '1.0.0',
        tags: ['test', 'sentry'],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(complexResponseData),
    } as Response);

    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await POST();

    expect(NextResponse.json).toHaveBeenCalledWith(complexResponseData);
  });
});
