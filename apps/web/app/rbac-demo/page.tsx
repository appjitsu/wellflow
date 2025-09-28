'use client';

import { useState } from 'react';
import { createAbilityForUser } from '../../lib/abilities';

interface User {
  id: string;
  email: string;
  organizationId: string;
  roles: string[];
}

const mockUsers: User[] = [
  {
    id: 'owner-1',
    email: 'owner@example.com',
    organizationId: 'org-123',
    roles: ['owner'],
  },
  {
    id: 'manager-1',
    email: 'manager@example.com',
    organizationId: 'org-123',
    roles: ['manager'],
  },
  {
    id: 'pumper-1',
    email: 'pumper@example.com',
    organizationId: 'org-123',
    roles: ['pumper'],
  },
];

export default function RBACDemo() {
  const [selectedUser, setSelectedUser] = useState<User>(mockUsers[0]!);
  const ability = createAbilityForUser(selectedUser);

  const testPermissions = [
    { action: 'create', subject: 'Well', description: 'Create Wells' },
    { action: 'read', subject: 'Well', description: 'Read Wells' },
    { action: 'update', subject: 'Well', description: 'Update Wells' },
    { action: 'delete', subject: 'Well', description: 'Delete Wells' },
    { action: 'assignRole', subject: 'User', description: 'Assign User Roles' },
    { action: 'inviteUser', subject: 'User', description: 'Invite Users' },
    { action: 'create', subject: 'Production', description: 'Create Production Data' },
    { action: 'read', subject: 'Production', description: 'Read Production Data' },
    { action: 'approve', subject: 'Afe', description: 'Approve AFEs' },
    { action: 'read', subject: 'OwnerPayment', description: 'Read Financial Data' },
    { action: 'create', subject: 'OwnerPayment', description: 'Create Financial Data' },
    { action: 'audit', subject: 'Well', description: 'Access Audit Logs' },
  ];

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>RBAC Demo - Owner/Manager/Pumper Roles</h1>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Select User Role</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {mockUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedUser.id === user.id ? '#007bff' : '#f8f9fa',
                color: selectedUser.id === user.id ? 'white' : 'black',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {user.roles[0]?.toUpperCase()} ({user.email})
            </button>
          ))}
        </div>

        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            marginBottom: '2rem',
          }}
        >
          <h3>Current User Details</h3>
          <p>
            <strong>ID:</strong> {selectedUser.id}
          </p>
          <p>
            <strong>Email:</strong> {selectedUser.email}
          </p>
          <p>
            <strong>Organization:</strong> {selectedUser.organizationId}
          </p>
          <p>
            <strong>Roles:</strong> {selectedUser.roles.join(', ')}
          </p>
        </div>
      </div>

      <div>
        <h2>Permission Test Results</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {testPermissions.map((permission, index) => {
            const canPerform = ability.can(permission.action as any, permission.subject as any);

            return (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  backgroundColor: canPerform ? '#d4edda' : '#f8d7da',
                  borderColor: canPerform ? '#c3e6cb' : '#f5c6cb',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <strong>{permission.description}</strong>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor: canPerform ? '#155724' : '#721c24',
                      color: 'white',
                    }}
                  >
                    {canPerform ? 'ALLOWED' : 'DENIED'}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                  {permission.action} {permission.subject}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
        }}
      >
        <h3>Role Hierarchy Summary</h3>
        <ul>
          <li>
            <strong>Owner:</strong> Full access to all resources within their organization
          </li>
          <li>
            <strong>Manager:</strong> Operational access - can manage wells, production data, and
            approve AFEs, but limited financial access
          </li>
          <li>
            <strong>Pumper:</strong> Limited access - can only manage production data for wells
            assigned to them
          </li>
        </ul>
      </div>
    </div>
  );
}
