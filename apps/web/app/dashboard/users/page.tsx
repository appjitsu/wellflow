'use client';

'use client';

import { useState } from 'react';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { useUsers } from '../../../hooks/use-users';
import { UserList } from '../../../components/user-management/user-list';
import { UserForm } from '../../../components/user-management/user-form';
import { InviteUserForm } from '../../../components/user-management/invite-user-form';
import { AbilitiesProvider, useAbilities } from '../../../components/providers/abilities-provider';
import type { User, UserFormData, InviteFormData, UserRole } from '../../../types/user';

/**
 * User Management Dashboard Page
 *
 * Features:
 * - User list with role indicators and status badges
 * - User invitation system
 * - Role assignment interface
 * - Account status management
 * - CASL-based permission controls
 */
export default function UserManagementPage() {
  // Mock user for testing - in a real app this would come from authentication
  const mockUser = {
    id: '1',
    email: 'admin@example.com',
    organizationId: 'org-1',
    roles: ['owner'],
  };

  return (
    <AbilitiesProvider user={mockUser}>
      <UserManagementPageContent />
    </AbilitiesProvider>
  );
}

function UserManagementPageContent() {
  const { Can } = useAbilities();

  const {
    users,
    loading,
    error,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    inviteUser,
    assignRole,
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  // Handle user creation
  const handleCreateUser = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);
      await createUser({
        organizationId: data.organizationId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone,
        isActive: data.isActive,
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
      // Error is handled by the hook and displayed in the UI
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user update
  const handleUpdateUser = async (data: UserFormData) => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      await updateUser(selectedUser.id, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone,
        isActive: data.isActive,
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast.success('User updated successfully!', {
        description: `${data.firstName} ${data.lastName}'s information has been updated`,
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user invitation
  const handleInviteUser = async (data: InviteFormData) => {
    try {
      setIsSubmitting(true);
      await inviteUser(data);
      setIsInviteDialogOpen(false);
      toast.success('User invitation sent successfully!', {
        description: `Invitation sent to ${data.email}`,
      });
    } catch (error) {
      console.error('Failed to invite user:', error);
      toast.error('Failed to send invitation', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUser(userId);
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    }
  };

  // Handle role assignment
  const handleAssignRole = async (userId: string, role: UserRole) => {
    try {
      await assignRole(userId, role);
      toast.success('Role updated successfully!', {
        description: `User role changed to ${role}`,
      });
    } catch (error) {
      console.error('Failed to assign role:', error);
      toast.error('Failed to update role', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await updateUser(userId, { isActive });
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      toast.error('Failed to update user status', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  // Handle refresh with toast notification
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('User list refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh user list:', error);
      toast.error('Failed to refresh user list', {
        description: 'Please try again later',
      });
    }
  };

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>User Management</h1>
          <p className='text-muted-foreground'>
            Manage users, roles, and permissions for your organization
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Can I='inviteUser' a='User'>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size='sm'>
                  <Plus className='h-4 w-4 mr-2' />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a new user to join your organization.
                  </DialogDescription>
                </DialogHeader>
                <InviteUserForm
                  onSubmit={handleInviteUser}
                  onCancel={() => setIsInviteDialogOpen(false)}
                  loading={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </Can>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{users.filter((user) => user.isActive).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {users.filter((user) => user.role === 'owner').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {users.filter((user) => user.role === 'manager').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4 mb-6'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
              <Input
                placeholder='Search users by name, email, or role...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className='mb-4 p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-md'>
              {error}
            </div>
          )}

          {/* User List */}
          <UserList
            users={filteredUsers}
            loading={loading}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onAssignRole={handleAssignRole}
            onToggleStatus={handleToggleStatus}
          />
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              user={selectedUser}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
              }}
              loading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
