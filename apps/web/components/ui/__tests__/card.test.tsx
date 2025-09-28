import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card', () => {
  it('renders with default props', () => {
    render(<Card>Card content</Card>);
    const card = screen.getByText('Card content');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass(
      'rounded-lg',
      'border',
      'bg-card',
      'text-card-foreground',
      'shadow-sm'
    );
  });

  it('applies custom className', () => {
    render(<Card className='custom-class'>Card content</Card>);
    const card = screen.getByText('Card content');
    expect(card).toHaveClass('custom-class');
  });

  it('forwards additional props', () => {
    render(<Card data-testid='card-test'>Card content</Card>);
    const card = screen.getByTestId('card-test');
    expect(card).toBeInTheDocument();
  });
});

describe('CardHeader', () => {
  it('renders with default props', () => {
    render(<CardHeader>Header content</CardHeader>);
    const header = screen.getByText('Header content');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
  });

  it('applies custom className', () => {
    render(<CardHeader className='custom-header'>Header content</CardHeader>);
    const header = screen.getByText('Header content');
    expect(header).toHaveClass('custom-header');
  });
});

describe('CardTitle', () => {
  it('renders with default props', () => {
    render(<CardTitle>Card Title</CardTitle>);
    const title = screen.getByText('Card Title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
  });

  it('applies custom className', () => {
    render(<CardTitle className='custom-title'>Card Title</CardTitle>);
    const title = screen.getByText('Card Title');
    expect(title).toHaveClass('custom-title');
  });
});

describe('CardDescription', () => {
  it('renders with default props', () => {
    render(<CardDescription>Card description</CardDescription>);
    const description = screen.getByText('Card description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('applies custom className', () => {
    render(<CardDescription className='custom-description'>Card description</CardDescription>);
    const description = screen.getByText('Card description');
    expect(description).toHaveClass('custom-description');
  });
});

describe('CardContent', () => {
  it('renders with default props', () => {
    render(<CardContent>Content</CardContent>);
    const content = screen.getByText('Content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('p-6', 'pt-0');
  });

  it('applies custom className', () => {
    render(<CardContent className='custom-content'>Content</CardContent>);
    const content = screen.getByText('Content');
    expect(content).toHaveClass('custom-content');
  });
});

describe('CardFooter', () => {
  it('renders with default props', () => {
    render(<CardFooter>Footer content</CardFooter>);
    const footer = screen.getByText('Footer content');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('applies custom className', () => {
    render(<CardFooter className='custom-footer'>Footer content</CardFooter>);
    const footer = screen.getByText('Footer content');
    expect(footer).toHaveClass('custom-footer');
  });
});

describe('Card composition', () => {
  it('renders a complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Well Information</CardTitle>
          <CardDescription>Details about the oil well</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Well data goes here</p>
        </CardContent>
        <CardFooter>
          <button>View Details</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Well Information')).toBeInTheDocument();
    expect(screen.getByText('Details about the oil well')).toBeInTheDocument();
    expect(screen.getByText('Well data goes here')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });
});
