import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST() {
  try {
    const response = await fetch(`${API_BASE_URL}/test-sentry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'API request failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling API test-sentry endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to call API endpoint', details: error },
      { status: 500 }
    );
  }
}
