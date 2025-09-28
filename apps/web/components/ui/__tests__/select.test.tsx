/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '../select';

// Mock Radix UI components
jest.mock('@radix-ui/react-select', () => ({
  Root: ({ children, value, onValueChange }: any) => (
    <div data-testid='select-root' data-value={value} data-onchange={!!onValueChange}>
      {children}
    </div>
  ),
  Trigger: ({ children, className, asChild, ...props }: any) => {
    if (asChild) {
      return React.cloneElement(children, {
        'data-testid': 'select-trigger',
        className: className
          ? `${children.props.className || ''} ${className}`.trim()
          : children.props.className,
        ...props,
      });
    }
    return (
      <button data-testid='select-trigger' className={className} {...props}>
        {children}
      </button>
    );
  },
  Value: ({ placeholder }: any) => (
    <span data-testid='select-value' data-placeholder={placeholder}>
      {placeholder}
    </span>
  ),
  Portal: ({ children }: any) => <div data-testid='select-portal'>{children}</div>,
  Content: ({ children, className, ...props }: any) => (
    <div data-testid='select-content' className={className} {...props}>
      {children}
    </div>
  ),
  Viewport: ({ children, className }: any) => (
    <div data-testid='select-viewport' className={className}>
      {children}
    </div>
  ),
  Item: ({ children, value, className, ...props }: any) => (
    <div data-testid={`select-item-${value}`} className={className} data-value={value} {...props}>
      {children}
    </div>
  ),
  ItemText: ({ children }: any) => <span data-testid='select-item-text'>{children}</span>,
  ItemIndicator: ({ children }: any) => <span data-testid='select-item-indicator'>{children}</span>,
  Label: ({ children, className, ...props }: any) => (
    <div data-testid='select-label' className={className} {...props}>
      {children}
    </div>
  ),
  Group: ({ children }: any) => <div data-testid='select-group'>{children}</div>,
  Separator: ({ className, ...props }: any) => (
    <div data-testid='select-separator' className={className} {...props} />
  ),
  ScrollUpButton: ({ children, className, ...props }: any) => (
    <div data-testid='select-scroll-up' className={className} {...props}>
      {children}
    </div>
  ),
  ScrollDownButton: ({ children, className, ...props }: any) => (
    <div data-testid='select-scroll-down' className={className} {...props}>
      {children}
    </div>
  ),
  Icon: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return React.cloneElement(children, {
        'data-testid': 'select-icon',
        ...props,
      });
    }
    return (
      <span data-testid='select-icon' {...props}>
        {children}
      </span>
    );
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: () => <span data-testid='check-icon'>✓</span>,
  ChevronDown: () => <span data-testid='chevron-down-icon'>↓</span>,
  ChevronUp: () => <span data-testid='chevron-up-icon'>↑</span>,
}));

describe('Select', () => {
  it('renders Select root with value and onValueChange', () => {
    const onValueChange = jest.fn();
    render(
      <Select value='option1' onValueChange={onValueChange}>
        <div>Content</div>
      </Select>
    );

    const root = screen.getByTestId('select-root');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('data-value', 'option1');
    expect(root).toHaveAttribute('data-onchange', 'true');
  });
});

describe('SelectTrigger', () => {
  it('renders with default props', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass('flex', 'h-10', 'w-full', 'items-center', 'justify-between');
  });

  it('applies custom className', () => {
    render(
      <Select>
        <SelectTrigger className='custom-trigger'>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toHaveClass('custom-trigger');
  });

  it('renders with chevron icon', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
  });
});

describe('SelectValue', () => {
  it('renders placeholder when no value selected', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
      </Select>
    );

    const value = screen.getByTestId('select-value');
    expect(value).toBeInTheDocument();
    expect(value).toHaveAttribute('data-placeholder', 'Select an option');
  });
});

describe('SelectContent', () => {
  it('renders with default props', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='option1'>Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const content = screen.getByTestId('select-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass(
      'relative',
      'z-50',
      'max-h-[--radix-select-content-available-height]'
    );
  });

  it('applies custom className', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent className='custom-content'>
          <SelectItem value='option1'>Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const content = screen.getByTestId('select-content');
    expect(content).toHaveClass('custom-content');
  });

  it('renders scroll buttons', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='option1'>Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId('select-scroll-up')).toBeInTheDocument();
    expect(screen.getByTestId('select-scroll-down')).toBeInTheDocument();
  });
});

describe('SelectItem', () => {
  it('renders with value and text', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='option1'>Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const item = screen.getByTestId('select-item-option1');
    expect(item).toBeInTheDocument();
    expect(item).toHaveAttribute('data-value', 'option1');
    expect(screen.getByTestId('select-item-text')).toHaveTextContent('Option 1');
  });

  it('applies custom className', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='option1' className='custom-item'>
            Option 1
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const item = screen.getByTestId('select-item-option1');
    expect(item).toHaveClass('custom-item');
  });
});

describe('SelectLabel', () => {
  it('renders with text', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          <SelectLabel>Group Label</SelectLabel>
          <SelectItem value='option1'>Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const label = screen.getByTestId('select-label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Group Label');
  });

  it('applies custom className', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          <SelectLabel className='custom-label'>Group Label</SelectLabel>
          <SelectItem value='option1'>Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    const label = screen.getByTestId('select-label');
    expect(label).toHaveClass('custom-label');
  });
});

describe('SelectGroup', () => {
  it('renders grouped items', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Group 1</SelectLabel>
            <SelectItem value='option1'>Option 1</SelectItem>
            <SelectItem value='option2'>Option 2</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    const group = screen.getByTestId('select-group');
    expect(group).toBeInTheDocument();
    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByTestId('select-item-option1')).toBeInTheDocument();
    expect(screen.getByTestId('select-item-option2')).toBeInTheDocument();
  });
});

describe('SelectSeparator', () => {
  it('renders separator', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='option1'>Option 1</SelectItem>
          <SelectSeparator />
          <SelectItem value='option2'>Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    const separator = screen.getByTestId('select-separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('-mx-1', 'my-1', 'h-px', 'bg-muted');
  });

  it('applies custom className', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select an option' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='option1'>Option 1</SelectItem>
          <SelectSeparator className='custom-separator' />
          <SelectItem value='option2'>Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    const separator = screen.getByTestId('select-separator');
    expect(separator).toHaveClass('custom-separator');
  });
});

describe('Select composition', () => {
  it('renders a complete select structure', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Select a fruit' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value='apple'>Apple</SelectItem>
            <SelectItem value='banana'>Banana</SelectItem>
            <SelectSeparator />
            <SelectItem value='orange'>Orange</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('select-value')).toHaveAttribute(
      'data-placeholder',
      'Select a fruit'
    );
    expect(screen.getByTestId('select-content')).toBeInTheDocument();
    expect(screen.getByTestId('select-group')).toBeInTheDocument();
    expect(screen.getByTestId('select-label')).toHaveTextContent('Fruits');
    expect(screen.getByTestId('select-item-apple')).toBeInTheDocument();
    expect(screen.getByTestId('select-item-banana')).toBeInTheDocument();
    expect(screen.getByTestId('select-item-orange')).toBeInTheDocument();
    expect(screen.getByTestId('select-separator')).toBeInTheDocument();
  });
});
