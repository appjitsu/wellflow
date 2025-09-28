'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { Calendar, Clock, MapPin, Monitor, RefreshCw, Filter, ArrowUpDown } from 'lucide-react';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useActivityHistory } from '../../hooks/use-auth';
import type { ActivityEvent } from '../../types/user';

// Create column helper for TanStack Table
const columnHelper = createColumnHelper<ActivityEvent>();

interface ActivityHistoryProps {
  readonly className?: string;
}

/**
 * ActivityHistory Component
 *
 * Displays user account activity including:
 * - Login/logout events
 * - Profile changes
 * - Security events
 * - Account modifications
 */
export function ActivityHistory({ className }: ActivityHistoryProps) {
  const { data: activities = [], isLoading, error, refetch } = useActivityHistory();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filter, setFilter] = useState<string>('all');

  // Helper functions
  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'login':
      case 'logout':
        return <Monitor className='h-4 w-4' />;
      case 'password_change':
        return <Clock className='h-4 w-4' />;
      case 'profile_update':
        return <Calendar className='h-4 w-4' />;
      case 'security_event':
        return <MapPin className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const getActivityBadge = (activity: ActivityEvent) => {
    if (!activity.success) {
      return <Badge variant='destructive'>Failed</Badge>;
    }

    switch (activity.type) {
      case 'login':
        return <Badge variant='default'>Login</Badge>;
      case 'logout':
        return <Badge variant='secondary'>Logout</Badge>;
      case 'password_change':
        return <Badge variant='outline'>Security</Badge>;
      case 'profile_update':
        return <Badge variant='secondary'>Profile</Badge>;
      case 'security_event':
        return <Badge variant='destructive'>Security</Badge>;
      default:
        return <Badge variant='secondary'>Activity</Badge>;
    }
  };

  // Define table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-auto p-0 font-semibold'
          >
            Activity
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => {
          const activity = row.original;
          return (
            <div className='flex items-center space-x-3'>
              {getActivityIcon(activity.type)}
              <div>
                <p className='font-medium'>{activity.description}</p>
                {activity.ipAddress && (
                  <p className='text-sm text-muted-foreground'>IP: {activity.ipAddress}</p>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('timestamp', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='h-auto p-0 font-semibold'
          >
            Date & Time
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        ),
        cell: ({ getValue }) => {
          const timestamp = getValue();
          return (
            <div>
              <p className='font-medium'>{format(timestamp, 'MMM d, yyyy')}</p>
              <p className='text-sm text-muted-foreground'>{format(timestamp, 'h:mm a')}</p>
            </div>
          );
        },
        sortingFn: 'datetime',
      }),
      columnHelper.accessor('location', {
        header: 'Location',
        cell: ({ getValue }) => {
          const location = getValue();
          return (
            <div className='flex items-center space-x-2'>
              <MapPin className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>{location || 'Unknown'}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('success', {
        header: 'Status',
        cell: ({ row }) => getActivityBadge(row.original),
        filterFn: (row, columnId, filterValue) => {
          if (filterValue === 'all') return true;
          if (filterValue === 'failed') return !row.getValue(columnId);
          if (filterValue === 'security') {
            const type = row.original.type;
            return type === 'password_change' || type === 'security_event';
          }
          return row.original.type === filterValue;
        },
      }),
    ],
    []
  );

  // Filter data based on selected filter
  const filteredData = useMemo(() => {
    return activities.filter((activity) => {
      if (filter === 'all') return true;
      if (filter === 'security')
        return activity.type === 'password_change' || activity.type === 'security_event';
      if (filter === 'failed') return !activity.success;
      return activity.type === filter;
    });
  }, [activities, filter]);

  // Create table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
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
          <p className='text-destructive'>Failed to load activity history</p>
          <p className='text-sm text-muted-foreground mt-2'>
            {error instanceof Error ? error.message : 'Please try again later'}
          </p>
          <Button variant='outline' onClick={handleRefresh} className='mt-4'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className='space-y-6'>
        {/* Activity Summary */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Monitor className='h-5 w-5 text-green-500' />
                <div>
                  <p className='text-sm font-medium'>Recent Logins</p>
                  <p className='text-2xl font-bold'>
                    {activities.filter((a) => a.type === 'login' && a.success).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Clock className='h-5 w-5 text-blue-500' />
                <div>
                  <p className='text-sm font-medium'>Security Events</p>
                  <p className='text-2xl font-bold'>
                    {
                      activities.filter(
                        (a) => a.type === 'password_change' || a.type === 'security_event'
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <MapPin className='h-5 w-5 text-red-500' />
                <div>
                  <p className='text-sm font-medium'>Failed Attempts</p>
                  <p className='text-2xl font-bold'>
                    {activities.filter((a) => !a.success).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Table */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your account activity and security events from the last 30 days.
                </CardDescription>
              </div>
              <div className='flex items-center space-x-2'>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className='w-[150px]'>
                    <Filter className='h-4 w-4 mr-2' />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Activity</SelectItem>
                    <SelectItem value='login'>Logins</SelectItem>
                    <SelectItem value='security'>Security</SelectItem>
                    <SelectItem value='profile_update'>Profile</SelectItem>
                    <SelectItem value='failed'>Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant='outline' size='sm' onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {table.getRowModel().rows.length === 0 ? (
              <div className='text-center py-8'>
                <Clock className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-medium'>No activity found</h3>
                <p className='text-muted-foreground'>
                  {filter === 'all'
                    ? 'No recent activity to display.'
                    : `No ${filter} activity found.`}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
