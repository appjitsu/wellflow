'use client';

/* eslint-disable sonarjs/deprecation, sonarjs/prefer-read-only-props */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Alert, AlertDescription } from '../ui/alert';
import type { InviteUserFormProps, InviteFormData } from '../../types/user';

// Validation schema for user invitation
const inviteUserSchema = z.object({
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
  role: z.enum(['owner', 'manager', 'pumper'] as const),
  organizationId: z
    .string()
    .min(1, 'Organization ID is required')
    .uuid('Invalid organization ID format'),
});

/**
 * InviteUserForm Component
 *
 * Form for inviting new users with:
 * - Email invitation functionality
 * - Role selection
 * - Form validation with Zod
 * - Loading states and success feedback
 */
export function InviteUserForm({ onSubmit, onCancel, loading = false }: InviteUserFormProps) {
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'pumper',
      organizationId: '',
    },
  });

  const handleSubmit = async (data: InviteFormData) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch {
      // Error handling is done in the parent component
    }
  };

  return (
    <div className='space-y-6'>
      {/* Information Alert */}
      <Alert>
        <Mail className='h-4 w-4' />
        <AlertDescription>
          An invitation email will be sent to the user with instructions to set up their account.
          The user will be created with inactive status until they accept the invitation.
        </AlertDescription>
      </Alert>

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
                  <Input
                    type='email'
                    placeholder='user@example.com'
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormDescription>
                  The invitation will be sent to this email address.
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a role' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='owner'>
                      <div className='flex flex-col items-start'>
                        <span className='font-medium'>Owner</span>
                        <span className='text-xs text-muted-foreground'>
                          Full access to all features and settings
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value='manager'>
                      <div className='flex flex-col items-start'>
                        <span className='font-medium'>Manager</span>
                        <span className='text-xs text-muted-foreground'>
                          Manage operations and view reports
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value='pumper'>
                      <div className='flex flex-col items-start'>
                        <span className='font-medium'>Pumper</span>
                        <span className='text-xs text-muted-foreground'>
                          Field operations and data entry
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The role determines the user&apos;s permissions and access level.
                </FormDescription>
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
                <FormDescription>The organization this user will belong to.</FormDescription>
                <FormMessage />
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
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Send className='mr-2 h-4 w-4' />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
