'use client';

import Link from 'next/link';
import { Users, Settings, Activity, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

/**
 * Dashboard Home Page
 *
 * Overview page with quick access to main features
 */
export default function DashboardPage() {
  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground'>
          Welcome to WellFlow - Your oil & gas management platform
        </p>
      </div>

      {/* Quick Stats */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12</div>
            <p className='text-xs text-muted-foreground'>+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Wells</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>45</div>
            <p className='text-xs text-muted-foreground'>+5 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Production</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1,234</div>
            <p className='text-xs text-muted-foreground'>barrels this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Compliance</CardTitle>
            <Settings className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>98%</div>
            <p className='text-xs text-muted-foreground'>compliance rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage users, roles, and permissions for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                Add new users, assign roles, and manage access permissions. Keep your team organized
                and secure.
              </p>
              <Link href='/dashboard/users'>
                <Button>
                  <Users className='mr-2 h-4 w-4' />
                  Manage Users
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure system preferences and organization settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                Customize your organization settings, preferences, and system configurations.
              </p>
              <Link href='/dashboard/settings'>
                <Button variant='outline'>
                  <Settings className='mr-2 h-4 w-4' />
                  View Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and changes in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center space-x-4'>
              <div className='h-2 w-2 rounded-full bg-blue-500'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>New user invited</p>
                <p className='text-xs text-muted-foreground'>
                  john.doe@example.com was invited to join as Manager
                </p>
              </div>
              <div className='text-xs text-muted-foreground'>2 hours ago</div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='h-2 w-2 rounded-full bg-green-500'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>User role updated</p>
                <p className='text-xs text-muted-foreground'>
                  jane.smith@example.com was promoted to Owner
                </p>
              </div>
              <div className='text-xs text-muted-foreground'>1 day ago</div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='h-2 w-2 rounded-full bg-yellow-500'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>System maintenance</p>
                <p className='text-xs text-muted-foreground'>
                  Scheduled maintenance completed successfully
                </p>
              </div>
              <div className='text-xs text-muted-foreground'>3 days ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
