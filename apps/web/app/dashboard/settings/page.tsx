'use client';

import { useState } from 'react';
import { User, Shield, Activity, Settings as SettingsIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ProfileSettings } from '../../../components/settings/profile-settings';
import { SecuritySettings } from '../../../components/settings/security-settings';
import { ActivityHistory } from '../../../components/settings/activity-history';

/**
 * Settings Page
 *
 * Provides user profile management functionality including:
 * - Profile editing
 * - Password change
 * - Activity history
 * - Account settings
 */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex items-center space-x-2'>
        <SettingsIcon className='h-6 w-6' />
        <h1 className='text-3xl font-bold'>Settings</h1>
      </div>

      <p className='text-muted-foreground'>
        Manage your account settings, profile information, and security preferences.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='profile' className='flex items-center space-x-2'>
            <User className='h-4 w-4' />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value='security' className='flex items-center space-x-2'>
            <Shield className='h-4 w-4' />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value='activity' className='flex items-center space-x-2'>
            <Activity className='h-4 w-4' />
            <span>Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='profile' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='security' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='activity' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>
                View your recent account activity and login history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
