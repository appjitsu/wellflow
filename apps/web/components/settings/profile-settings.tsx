'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, User as UserIcon } from 'lucide-react';
import { useProfile, useUpdateProfile } from '../../hooks/use-auth';
import type { User } from '../../types/user';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';

// Profile form validation schema
const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name cannot exceed 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name cannot exceed 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s\-\(\)]+$/.test(val), {
      message: 'Please enter a valid phone number',
    }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileSettingsProps {
  className?: string;
}

/**
 * ProfileSettings Component
 *
 * Allows users to edit their profile information including:
 * - First and last name
 * - Email address
 * - Phone number
 * - Profile avatar (future enhancement)
 */
export function ProfileSettings({ className }: ProfileSettingsProps) {
  const { data: currentUser, isLoading: profileLoading, error } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (currentUser) {
      form.reset({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      });
    }
  }, [currentUser, form]);

  const onSubmit = async (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const getUserInitials = (user: User) => {
    const first = user.firstName || '';
    const last = user.lastName || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  if (profileLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-center'>
          <p className='text-destructive'>Failed to load profile information</p>
          <p className='text-sm text-muted-foreground mt-2'>
            {error instanceof Error ? error.message : 'Please try again later'}
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className='flex items-center justify-center py-8'>
        <p className='text-muted-foreground'>No profile data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className='space-y-6'>
        {/* Profile Avatar Section */}
        <div className='flex items-center space-x-4'>
          <Avatar className='h-20 w-20'>
            <AvatarFallback className='text-lg'>{getUserInitials(currentUser)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className='text-lg font-medium'>
              {currentUser.firstName} {currentUser.lastName}
            </h3>
            <p className='text-sm text-muted-foreground'>{currentUser.email}</p>
            <Button variant='outline' size='sm' className='mt-2' disabled>
              <UserIcon className='h-4 w-4 mr-2' />
              Change Avatar (Coming Soon)
            </Button>
          </div>
        </div>

        {/* Profile Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* First Name */}
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter your first name'
                        {...field}
                        disabled={updateProfileMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter your last name'
                        {...field}
                        disabled={updateProfileMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='Enter your email address'
                      {...field}
                      disabled={updateProfileMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    This email will be used for login and notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type='tel'
                      placeholder='Enter your phone number'
                      {...field}
                      disabled={updateProfileMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Used for account recovery and notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className='flex justify-end'>
              <Button type='submit' disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4 mr-2' />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
