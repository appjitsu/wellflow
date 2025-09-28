import { render, screen, fireEvent } from '@testing-library/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '../dialog';

// Mock Radix UI components
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, onOpenChange }: any) => (
    <div data-testid='dialog-root' data-open={open} data-onopenchange={!!onOpenChange}>
      {children}
    </div>
  ),
  Trigger: ({ children, ...props }: any) => (
    <button data-testid='dialog-trigger' {...props}>
      {children}
    </button>
  ),
  Portal: ({ children }: any) => <div data-testid='dialog-portal'>{children}</div>,
  Overlay: ({ className, ...props }: any) => (
    <div data-testid='dialog-overlay' className={className} {...props} />
  ),
  Content: ({ children, className, ...props }: any) => (
    <div data-testid='dialog-content' className={className} {...props}>
      {children}
    </div>
  ),
  Close: ({ children, className, ...props }: any) => (
    <button data-testid='dialog-close' className={className} {...props}>
      {children}
    </button>
  ),
  Title: ({ children, className, ...props }: any) => (
    <h2 data-testid='dialog-title' className={className} {...props}>
      {children}
    </h2>
  ),
  Description: ({ children, className, ...props }: any) => (
    <p data-testid='dialog-description' className={className} {...props}>
      {children}
    </p>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <span data-testid='x-icon'>×</span>,
}));

describe('Dialog', () => {
  it('renders Dialog root with open state and onOpenChange', () => {
    const onOpenChange = jest.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <div>Dialog content</div>
      </Dialog>
    );

    const root = screen.getByTestId('dialog-root');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('data-open', 'true');
    expect(root).toHaveAttribute('data-onopenchange', 'true');
  });
});

describe('DialogTrigger', () => {
  it('renders trigger button', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    );

    const trigger = screen.getByTestId('dialog-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Open Dialog');
  });
});

describe('DialogContent', () => {
  it('renders content with overlay and close button', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <div>Dialog content</div>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-close')).toBeInTheDocument();
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent className='custom-dialog'>
          <div>Dialog content</div>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByTestId('dialog-content');
    expect(content).toHaveClass('custom-dialog');
  });
});

describe('DialogHeader', () => {
  it('renders header with default styling', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>Header content</DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const header = screen.getByText('Header content');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'text-center', 'sm:text-left');
  });

  it('applies custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader className='custom-header'>Header content</DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const header = screen.getByText('Header content');
    expect(header).toHaveClass('custom-header');
  });
});

describe('DialogTitle', () => {
  it('renders title with default styling', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const title = screen.getByTestId('dialog-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Dialog Title');
    expect(title).toHaveClass('text-lg', 'font-semibold', 'leading-none', 'tracking-tight');
  });

  it('applies custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle className='custom-title'>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const title = screen.getByTestId('dialog-title');
    expect(title).toHaveClass('custom-title');
  });
});

describe('DialogDescription', () => {
  it('renders description with default styling', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogDescription>Dialog description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const description = screen.getByTestId('dialog-description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent('Dialog description text');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('applies custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogDescription className='custom-description'>Dialog description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const description = screen.getByTestId('dialog-description');
    expect(description).toHaveClass('custom-description');
  });
});

describe('DialogFooter', () => {
  it('renders footer with default styling', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogFooter>Footer content</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const footer = screen.getByText('Footer content');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass(
      'flex',
      'flex-col-reverse',
      'sm:flex-row',
      'sm:justify-end',
      'sm:space-x-2'
    );
  });

  it('applies custom className', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogFooter className='custom-footer'>Footer content</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const footer = screen.getByText('Footer content');
    expect(footer).toHaveClass('custom-footer');
  });
});

describe('DialogClose', () => {
  it('renders close button', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogClose>Custom Close</DialogClose>
        </DialogContent>
      </Dialog>
    );

    const close = screen.getByText('Custom Close');
    expect(close).toBeInTheDocument();
  });
});

describe('Dialog composition', () => {
  it('renders a complete dialog structure', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>Are you sure you want to perform this action?</DialogDescription>
          </DialogHeader>
          <div>Dialog body content</div>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId('dialog-trigger')).toHaveTextContent('Open Dialog');
    expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Confirm Action');
    expect(screen.getByTestId('dialog-description')).toHaveTextContent(
      'Are you sure you want to perform this action?'
    );
    expect(screen.getByText('Dialog body content')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
  });
});
