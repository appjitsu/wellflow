import { GET } from '../route';
import { NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date to have consistent timestamps in tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return health status with correct structure', async () => {
    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await GET();

    expect(NextResponse.json).toHaveBeenCalledWith({
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
      service: 'web',
      version: '1.0.0',
    });
  });

  it('should return status ok', async () => {
    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await GET();

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.status).toBe('ok');
  });

  it('should return current timestamp', async () => {
    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await GET();

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.timestamp).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should return service name as web', async () => {
    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await GET();

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.service).toBe('web');
  });

  it('should return version 1.0.0', async () => {
    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    await GET();

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.version).toBe('1.0.0');
  });

  it('should handle multiple concurrent requests', async () => {
    const mockJson = jest.fn();
    (NextResponse.json as jest.Mock).mockReturnValue({ json: mockJson });

    // Make multiple concurrent requests
    const promises = [GET(), GET(), GET()];
    await Promise.all(promises);

    expect(NextResponse.json).toHaveBeenCalledTimes(3);
    
    // All calls should have the same structure
    const calls = (NextResponse.json as jest.Mock).mock.calls;
    calls.forEach(call => {
      expect(call[0]).toEqual({
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
        service: 'web',
        version: '1.0.0',
      });
    });
  });
});
