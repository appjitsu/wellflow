'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, UserCheck, UserX, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { Can } from '../providers/abilities-provider';
import type { UserListProps, User, UserRole } from '../../types/user';

/**
 * UserList Component
 *
 * Displays users in a table format with:
 * - Role indicators and status badges
 * - Action menu for edit, delete, role assignment
 * - CASL-based permission controls
 * - Loading states and empty states
 */
export function UserList({
  users,
  loading,
  onEdit,
  onDelete,
  onAssignRole,
  onToggleStatus,
}: UserListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Get user initials for avatar
  const getUserInitials = (user: User): string => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    // If we have both first and last name, use their initials
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    // If we have only first name, use first two characters or first + email initial
    if (firstName) {
      return firstName.length > 1
        ? `${firstName.charAt(0)}${firstName.charAt(1)}`.toUpperCase()
        : `${firstName.charAt(0)}${user.email?.charAt(0) || 'U'}`.toUpperCase();
    }

    // If we have only last name, use first two characters or last + email initial
    if (lastName) {
      return lastName.length > 1
        ? `${lastName.charAt(0)}${lastName.charAt(1)}`.toUpperCase()
        : `${lastName.charAt(0)}${user.email?.charAt(0) || 'U'}`.toUpperCase();
    }

    // Fallback to email initial or 'U' for User
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: UserRole | null) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'pumper':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Handle role assignment with loading state
  const handleRoleAssignment = async (userId: string, role: UserRole) => {
    setActionLoading(userId);
    try {
      await onAssignRole(userId, role);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle status toggle with loading state
  const handleStatusToggle = async (userId: string, isActive: boolean) => {
    setActionLoading(userId);
    try {
      await onToggleStatus(userId, !isActive);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete with loading state
  const handleDelete = async (userId: string) => {
    setActionLoading(userId);
    try {
      await onDelete(userId);
    } finally {
      setActionLoading(null);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className='space-y-4'>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className='flex items-center space-x-4'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-[200px]' />
              <Skeleton className='h-4 w-[150px]' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='mx-auto h-12 w-12 text-muted-foreground'>
          <UserCheck className='h-12 w-12' />
        </div>
        <h3 className='mt-4 text-lg font-semibold'>No users found</h3>
        <p className='mt-2 text-muted-foreground'>No users match your current search criteria.</p>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='w-[70px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className='flex items-center space-x-3'>
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback className='text-xs'>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='font-medium'>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </div>
                    <div className='text-sm text-muted-foreground'>{user.email}</div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                {user.role && (
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                )}
              </TableCell>

              <TableCell>
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>

              <TableCell className='text-sm text-muted-foreground'>
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
              </TableCell>

              <TableCell className='text-sm text-muted-foreground'>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      className='h-8 w-8 p-0'
                      disabled={actionLoading === user.id}
                    >
                      <span className='sr-only'>Open menu</span>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <Can I='update' a='User'>
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Edit className='mr-2 h-4 w-4' />
                        Edit User
                      </DropdownMenuItem>
                    </Can>

                    <Can I='assignRole' a='User'>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Shield className='mr-2 h-4 w-4' />
                          Assign Role
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            onClick={() => handleRoleAssignment(user.id, 'owner')}
                            disabled={user.role === 'owner'}
                          >
                            Owner
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleAssignment(user.id, 'manager')}
                            disabled={user.role === 'manager'}
                          >
                            Manager
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleAssignment(user.id, 'pumper')}
                            disabled={user.role === 'pumper'}
                          >
                            Pumper
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </Can>

                    <DropdownMenuSeparator />

                    <Can I='update' a='User'>
                      <DropdownMenuItem onClick={() => handleStatusToggle(user.id, user.isActive)}>
                        {user.isActive ? (
                          <>
                            <UserX className='mr-2 h-4 w-4' />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className='mr-2 h-4 w-4' />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </Can>

                    <Can I='delete' a='User'>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(user.id)}
                        className='text-destructive'
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete User
                      </DropdownMenuItem>
                    </Can>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
