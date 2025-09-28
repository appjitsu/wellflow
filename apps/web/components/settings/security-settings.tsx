'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useChangePassword } from '../../hooks/use-auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';

// Password change validation schema
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .max(128, 'New password cannot exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      ),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

interface SecuritySettingsProps {
  className?: string;
}

/**
 * SecuritySettings Component
 *
 * Provides security-related settings including:
 * - Password change functionality
 * - Account security information
 * - Security recommendations
 */
export function SecuritySettings({ className }: SecuritySettingsProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const changePasswordMutation = useChangePassword();

  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordChangeFormData) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        // Reset form on success
        form.reset();
      },
    });
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    return strength;
  };

  const getPasswordStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { label: 'Very Weak', color: 'text-red-500' };
      case 2:
        return { label: 'Weak', color: 'text-orange-500' };
      case 3:
        return { label: 'Fair', color: 'text-yellow-500' };
      case 4:
        return { label: 'Good', color: 'text-blue-500' };
      case 5:
        return { label: 'Strong', color: 'text-green-500' };
      default:
        return { label: '', color: '' };
    }
  };

  const newPassword = form.watch('newPassword');
  const passwordStrength = getPasswordStrength(newPassword);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return (
    <div className={className}>
      <div className='space-y-6'>
        {/* Password Change Section */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Lock className='h-5 w-5' />
              <span>Change Password</span>
            </CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                {/* Current Password */}
                <FormField
                  control={form.control}
                  name='currentPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder='Enter your current password'
                            {...field}
                            disabled={changePasswordMutation.isPending}
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            disabled={changePasswordMutation.isPending}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* New Password */}
                <FormField
                  control={form.control}
                  name='newPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder='Enter your new password'
                            {...field}
                            disabled={changePasswordMutation.isPending}
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            disabled={changePasswordMutation.isPending}
                          >
                            {showNewPassword ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      {newPassword && (
                        <div className='flex items-center space-x-2 mt-2'>
                          <div className='flex space-x-1'>
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-2 w-4 rounded-full ${
                                  level <= passwordStrength
                                    ? passwordStrength <= 2
                                      ? 'bg-red-500'
                                      : passwordStrength <= 3
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`text-sm ${strengthInfo.color}`}>
                            {strengthInfo.label}
                          </span>
                        </div>
                      )}
                      <FormDescription>
                        Password must contain at least 8 characters with uppercase, lowercase,
                        number, and special character.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder='Confirm your new password'
                            {...field}
                            disabled={changePasswordMutation.isPending}
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={changePasswordMutation.isPending}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className='flex justify-end'>
                  <Button type='submit' disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Shield className='h-4 w-4 mr-2' />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card>
          <CardHeader>
            <CardTitle>Security Information</CardTitle>
            <CardDescription>Keep your account secure with these recommendations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-start space-x-3'>
                <Shield className='h-5 w-5 text-green-500 mt-0.5' />
                <div>
                  <h4 className='font-medium'>Strong Password</h4>
                  <p className='text-sm text-muted-foreground'>
                    Use a unique password that's at least 8 characters long with a mix of letters,
                    numbers, and symbols.
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <Shield className='h-5 w-5 text-blue-500 mt-0.5' />
                <div>
                  <h4 className='font-medium'>Regular Updates</h4>
                  <p className='text-sm text-muted-foreground'>
                    Change your password regularly and never reuse passwords from other accounts.
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <Shield className='h-5 w-5 text-orange-500 mt-0.5' />
                <div>
                  <h4 className='font-medium'>Account Monitoring</h4>
                  <p className='text-sm text-muted-foreground'>
                    Monitor your account activity regularly and report any suspicious activity
                    immediately.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
