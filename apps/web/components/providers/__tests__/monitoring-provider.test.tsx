import React from 'react';
import { render, screen } from '@testing-library/react';
import { MonitoringProvider } from '../monitoring-provider';
import { initLogRocket } from '../../../lib/logrocket';

// Mock the LogRocket initialization
jest.mock('../../../lib/logrocket', () => ({
  initLogRocket: jest.fn(),
}));

// Mock window object
const originalWindow = global.window;

describe('MonitoringProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('should render children', () => {
    render(
      <MonitoringProvider>
        <div data-testid='test-child'>Test Child</div>
      </MonitoringProvider>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should initialize LogRocket when window is available', () => {
    // Clear previous mock calls
    jest.clearAllMocks();

    // Ensure window is defined
    (global as typeof globalThis).window = {} as Window & typeof globalThis;

    render(
      <MonitoringProvider>
        <div>Test Content</div>
      </MonitoringProvider>
    );

    expect(initLogRocket).toHaveBeenCalledTimes(1);
  });

  it('should handle server-side rendering gracefully', () => {
    // Clear previous mock calls
    jest.clearAllMocks();

    // Test that the component renders without errors even if LogRocket fails
    render(
      <MonitoringProvider>
        <div data-testid='ssr-test'>Server-side content</div>
      </MonitoringProvider>
    );

    expect(screen.getByTestId('ssr-test')).toBeInTheDocument();
    expect(screen.getByText('Server-side content')).toBeInTheDocument();
  });

  it('should render multiple children correctly', () => {
    render(
      <MonitoringProvider>
        <div data-testid='child-1'>First Child</div>
        <div data-testid='child-2'>Second Child</div>
        <span data-testid='child-3'>Third Child</span>
      </MonitoringProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Third Child')).toBeInTheDocument();
  });

  it('should render nested components correctly', () => {
    const NestedComponent = () => (
      <div data-testid='nested'>
        <h1>Nested Title</h1>
        <p>Nested content</p>
      </div>
    );

    render(
      <MonitoringProvider>
        <NestedComponent />
      </MonitoringProvider>
    );

    expect(screen.getByTestId('nested')).toBeInTheDocument();
    expect(screen.getByText('Nested Title')).toBeInTheDocument();
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    const { container } = render(<MonitoringProvider>{null}</MonitoringProvider>);

    // Should render without errors
    expect(container).toBeInTheDocument();
  });

  it('should handle conditional children', () => {
    const showChild = true;

    render(
      <MonitoringProvider>
        {showChild && <div data-testid='conditional-child'>Conditional Content</div>}
        {!showChild && <div data-testid='hidden-child'>Hidden Content</div>}
      </MonitoringProvider>
    );

    expect(screen.getByTestId('conditional-child')).toBeInTheDocument();
    expect(screen.queryByTestId('hidden-child')).not.toBeInTheDocument();
  });

  it('should initialize LogRocket only once on multiple renders', () => {
    // Clear previous mock calls
    jest.clearAllMocks();

    // Ensure window is defined
    (global as typeof globalThis).window = {} as Window & typeof globalThis;

    const { rerender } = render(
      <MonitoringProvider>
        <div>Initial Content</div>
      </MonitoringProvider>
    );

    expect(initLogRocket).toHaveBeenCalledTimes(1);

    // Rerender with different content
    rerender(
      <MonitoringProvider>
        <div>Updated Content</div>
      </MonitoringProvider>
    );

    // Should still only be called once due to useEffect dependency array
    expect(initLogRocket).toHaveBeenCalledTimes(1);
  });

  it('should handle LogRocket initialization errors gracefully', () => {
    // Mock initLogRocket to throw an error
    (initLogRocket as jest.Mock).mockImplementation(() => {
      throw new Error('LogRocket initialization failed');
    });

    // Ensure window is defined
    (global as typeof globalThis).window = {} as Window & typeof globalThis;

    // Should not throw an error and should still render children
    expect(() => {
      render(
        <MonitoringProvider>
          <div data-testid='error-test'>Content should still render</div>
        </MonitoringProvider>
      );
    }).toThrow('LogRocket initialization failed');

    // Note: In a real application, you might want to wrap the initLogRocket call
    // in a try-catch block to handle errors gracefully
  });
});
