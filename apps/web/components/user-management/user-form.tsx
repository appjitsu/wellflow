'use client';

/* eslint-disable sonarjs/deprecation, sonarjs/prefer-read-only-props */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import type { UserFormProps } from '../../types/user';
type UserFormData = z.infer<typeof userFormSchema>;

// Validation schema using Zod
export const userFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name cannot exceed 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name cannot exceed 100 characters'),
  role: z.enum(['owner', 'manager', 'pumper']),
  phone: z.string().max(20, 'Phone number cannot exceed 20 characters').optional(),
  organizationId: z
    .string()
    .min(1, 'Organization ID is required')
    .uuid('Invalid organization ID format'),
  isActive: z.boolean(),
});

/**
 * UserForm Component
 *
 * Form for creating and editing users with:
 * - React Hook Form with Zod validation
 * - Proper TypeScript typing
 * - Loading states and error handling
 * - Accessibility features
 */
export function UserForm({ user, onSubmit, onCancel, loading = false }: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      role: user?.role || 'pumper',
      phone: user?.phone || '',
      organizationId: user?.organizationId || '',
      isActive: user?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch {
      // Error handling is done in the parent component
    }
  };

  const isEditing = !!user;

  const submitButtonText = isEditing ? 'Update User' : 'Create User';
  const loadingButtonText = isEditing ? 'Updating...' : 'Creating...';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        {/* Email Field */}
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type='email' placeholder='user@example.com' {...field} disabled={loading} />
              </FormControl>
              <FormDescription>
                The user&apos;s email address for login and notifications.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name Fields */}
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='firstName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder='John' {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='lastName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder='Doe' {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Role Field */}
        <FormField
          control={form.control}
          name='role'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a role' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='owner'>Owner</SelectItem>
                  <SelectItem value='manager'>Manager</SelectItem>
                  <SelectItem value='pumper'>Pumper</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The user&apos;s role determines their permissions and access level.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Field */}
        <FormField
          control={form.control}
          name='phone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input type='tel' placeholder='+1 (555) 123-4567' {...field} disabled={loading} />
              </FormControl>
              <FormDescription>Optional phone number for contact purposes.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Organization ID Field */}
        <FormField
          control={form.control}
          name='organizationId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization ID</FormLabel>
              <FormControl>
                <Input
                  placeholder='123e4567-e89b-12d3-a456-426614174000'
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>The organization this user belongs to.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status Field */}
        <FormField
          control={form.control}
          name='isActive'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='text-base'>Active Status</FormLabel>
                <FormDescription>
                  Whether this user account is active and can log in.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className='flex justify-end space-x-2'>
          <Button type='button' variant='outline' onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type='submit' disabled={loading}>
            {loading ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                {loadingButtonText}
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
