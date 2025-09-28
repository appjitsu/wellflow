import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
} from '../form';

// Mock React.useId
jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    useId: jest.fn(() => 'test-id'),
  };
});

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useForm: jest.fn(() => ({
    control: {},
    handleSubmit: jest.fn(),
    watch: jest.fn(),
    getValues: jest.fn(),
    setValue: jest.fn(),
    formState: {},
  })),
  useFormContext: jest.fn(),
  FormProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='form-provider'>{children}</div>
  ),
  Controller: ({ render }: any) => render({ field: {}, fieldState: {}, formState: {} }),
}));

// Mock Radix UI components
jest.mock('@radix-ui/react-label', () => ({
  Root: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: any) => React.cloneElement(children, props),
}));

// Mock the Label component
jest.mock('../label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

describe('Form', () => {
  it('renders FormProvider wrapper', () => {
    const methods = useForm();
    render(
      <Form {...methods}>
        <div>Form content</div>
      </Form>
    );

    expect(screen.getByTestId('form-provider')).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });
});

describe('FormItem', () => {
  it('renders with default props', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn(),
      formState: {},
    });

    render(
      <FormItem>
        <div>Item content</div>
      </FormItem>
    );

    const item = screen.getByText('Item content');
    expect(item).toBeInTheDocument();
    expect(item.parentElement).toHaveClass('space-y-2');
  });

  it('applies custom className', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn(),
      formState: {},
    });

    render(
      <FormItem className='custom-item'>
        <div>Item content</div>
      </FormItem>
    );

    const item = screen.getByText('Item content');
    expect(item.parentElement).toHaveClass('custom-item');
  });

  it('forwards additional props', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn(),
      formState: {},
    });

    render(
      <FormItem data-testid='form-item'>
        <div>Item content</div>
      </FormItem>
    );

    expect(screen.getByTestId('form-item')).toBeInTheDocument();
  });
});

describe('FormLabel', () => {
  it('renders with default props when no error', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: false,
        error: null,
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormLabel>Label text</FormLabel>
          </FormItem>
        )}
      />
    );

    const label = screen.getByText('Label text');
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveClass('text-destructive');
  });

  it('renders with error styling when error exists', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: true,
        error: { message: 'Required field' },
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormLabel>Label text</FormLabel>
          </FormItem>
        )}
      />
    );

    const label = screen.getByText('Label text');
    expect(label).toHaveClass('text-destructive');
  });

  it('applies custom className', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: false,
        error: null,
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormLabel className='custom-label'>Label text</FormLabel>
          </FormItem>
        )}
      />
    );

    const label = screen.getByText('Label text');
    expect(label).toHaveClass('custom-label');
  });
});

describe('FormControl', () => {
  it('renders with default props when no error', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: false,
        error: null,
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormControl>
              <input type='text' />
            </FormControl>
          </FormItem>
        )}
      />
    );

    const control = screen.getByRole('textbox');
    expect(control).toHaveAttribute('id', expect.stringContaining('form-item'));
    expect(control).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('form-item-description')
    );
    expect(control).toHaveAttribute('aria-invalid', 'false');
  });

  it('renders with error attributes when error exists', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: true,
        error: { message: 'Required field' },
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormControl>
              <input type='text' />
            </FormControl>
          </FormItem>
        )}
      />
    );

    const control = screen.getByRole('textbox');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('form-item-description')
    );
  });
});

describe('FormDescription', () => {
  it('renders with default props', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: false,
        error: null,
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormDescription>Description text</FormDescription>
          </FormItem>
        )}
      />
    );

    const description = screen.getByText('Description text');
    expect(description).toBeInTheDocument();
    expect(description).toHaveAttribute('id', expect.stringContaining('form-item-description'));
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('applies custom className', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: false,
        error: null,
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormDescription className='custom-description'>Description text</FormDescription>
          </FormItem>
        )}
      />
    );

    const description = screen.getByText('Description text');
    expect(description).toHaveClass('custom-description');
  });
});

describe('FormMessage', () => {
  it('renders error message when error exists', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: true,
        error: { message: 'This field is required' },
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
    );

    const message = screen.getByText('This field is required');
    expect(message).toBeInTheDocument();
    expect(message).toHaveAttribute('id', expect.stringContaining('form-item-message'));
    expect(message).toHaveClass('text-sm', 'font-medium', 'text-destructive');
  });

  it('renders children when no error but children provided', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: false,
        error: null,
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormMessage>Custom message</FormMessage>
          </FormItem>
        )}
      />
    );

    const message = screen.getByText('Custom message');
    expect(message).toBeInTheDocument();
  });

  it('renders nothing when no error and no children', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: false,
        error: null,
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />
    );

    // Should not render anything
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: true,
        error: { message: 'Error message' },
      }),
      formState: {},
    });

    render(
      <FormField
        name='test'
        render={() => (
          <FormItem>
            <FormMessage className='custom-message'>Error message</FormMessage>
          </FormItem>
        )}
      />
    );

    const message = screen.getByText('Error message');
    expect(message).toHaveClass('custom-message');
  });
});

describe('FormField', () => {
  it('provides field context to children', () => {
    const mockRender = jest.fn().mockReturnValue(<div>Field content</div>);

    render(<FormField name='testField' render={mockRender} />);

    expect(mockRender).toHaveBeenCalledWith({
      field: {},
      fieldState: {},
      formState: {},
    });
  });
});

describe('useFormField', () => {
  it('throws error when used outside FormField', () => {
    const TestComponent = () => {
      useFormField();
      return null;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useFormField should be used within <FormField>'
    );
  });

  it('returns field information when used within FormField', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: false,
        isTouched: false,
        isDirty: false,
        error: null,
      }),
      formState: {},
    });

    let fieldInfo: any;

    const TestComponent = () => {
      fieldInfo = useFormField();
      return <div>Test</div>;
    };

    render(
      <FormField
        name='testField'
        render={() => (
          <FormItem>
            <TestComponent />
          </FormItem>
        )}
      />
    );

    expect(fieldInfo).toHaveProperty('name', 'testField');
    expect(fieldInfo).toHaveProperty('id');
    expect(fieldInfo).toHaveProperty('formItemId');
    expect(fieldInfo).toHaveProperty('formDescriptionId');
    expect(fieldInfo).toHaveProperty('formMessageId');
  });
});

describe('Form composition', () => {
  it('renders a complete form structure', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: false,
        isTouched: false,
        isDirty: false,
        error: null,
      }),
      formState: {},
    });

    const methods = useForm();

    render(
      <Form {...methods}>
        <FormField
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <input {...field} type='email' placeholder='Enter your email' />
              </FormControl>
              <FormDescription>We'll never share your email.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByText("We'll never share your email.")).toBeInTheDocument();
  });

  it('renders form with error state', () => {
    const { useFormContext } = require('react-hook-form');
    (useFormContext as jest.Mock).mockReturnValue({
      getFieldState: jest.fn().mockReturnValue({
        invalid: true,
        isTouched: true,
        isDirty: true,
        error: { message: 'Email is required' },
      }),
      formState: {},
    });

    const methods = useForm();

    render(
      <Form {...methods}>
        <FormField
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <input {...field} type='email' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    );

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });
});
