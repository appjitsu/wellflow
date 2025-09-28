import React from 'react';
import { render, screen } from '@testing-library/react';
import { AbilitiesProvider, useAbilities } from '../abilities-provider';

// Test component that uses the abilities context
const TestComponent = () => {
  const { ability, Can } = useAbilities();

  return (
    <div>
      <div data-testid='ability-exists'>{ability ? 'true' : 'false'}</div>
      <Can I='read' a='Well'>
        <div data-testid='can-read-well'>Can read well</div>
      </Can>
      <Can I='create' a='Well'>
        <div data-testid='can-create-well'>Can create well</div>
      </Can>
    </div>
  );
};

describe('AbilitiesProvider', () => {
  it('should provide guest abilities when no user is provided', () => {
    render(
      <AbilitiesProvider>
        <TestComponent />
      </AbilitiesProvider>
    );

    expect(screen.getByTestId('ability-exists')).toHaveTextContent('true');
    expect(screen.queryByTestId('can-read-well')).not.toBeInTheDocument();
    expect(screen.queryByTestId('can-create-well')).not.toBeInTheDocument();
  });

  it('should provide user abilities when user is provided', () => {
    const user = {
      id: 'admin-1',
      email: 'admin@example.com',
      roles: ['ADMIN'],
      operatorId: 'operator-1',
      organizationId: 'org-1',
    };

    render(
      <AbilitiesProvider user={user}>
        <TestComponent />
      </AbilitiesProvider>
    );

    expect(screen.getByTestId('ability-exists')).toHaveTextContent('true');
    expect(screen.getByTestId('can-read-well')).toBeInTheDocument();
    expect(screen.getByTestId('can-create-well')).toBeInTheDocument();
  });

  it('should update abilities when user changes', () => {
    const adminUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      roles: ['ADMIN'],
      operatorId: 'operator-1',
      organizationId: 'org-1',
    };

    const viewerUser = {
      id: 'viewer-1',
      email: 'viewer@example.com',
      roles: ['VIEWER'],
      operatorId: 'operator-1',
      organizationId: 'org-1',
    };

    const { rerender } = render(
      <AbilitiesProvider user={adminUser}>
        <TestComponent />
      </AbilitiesProvider>
    );

    // Admin can create wells
    expect(screen.getByTestId('can-create-well')).toBeInTheDocument();

    // Change to viewer user
    rerender(
      <AbilitiesProvider user={viewerUser}>
        <TestComponent />
      </AbilitiesProvider>
    );

    // Viewer cannot create wells
    expect(screen.queryByTestId('can-create-well')).not.toBeInTheDocument();
    // But can still read wells
    expect(screen.getByTestId('can-read-well')).toBeInTheDocument();
  });

  it('should throw error when useAbilities is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAbilities must be used within an AbilitiesProvider');

    consoleSpy.mockRestore();
  });

  it('should handle conditional rendering with Can component', () => {
    const operatorUser = {
      id: 'operator-1',
      email: 'operator@example.com',
      roles: ['OPERATOR'],
      operatorId: 'operator-1',
      organizationId: 'org-1',
    };

    const ConditionalComponent = () => {
      const { Can } = useAbilities();

      return (
        <div>
          <Can I='read' a='Well'>
            <button data-testid='read-button'>Read Wells</button>
          </Can>
          <Can I='create' a='Well'>
            <button data-testid='create-button'>Create Well</button>
          </Can>
          <Can I='delete' a='Well'>
            <button data-testid='delete-button'>Delete Well</button>
          </Can>
        </div>
      );
    };

    render(
      <AbilitiesProvider user={operatorUser}>
        <ConditionalComponent />
      </AbilitiesProvider>
    );

    // Operator can read and create wells
    expect(screen.getByTestId('read-button')).toBeInTheDocument();
    expect(screen.getByTestId('create-button')).toBeInTheDocument();

    // But cannot delete wells
    expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
  });

  it('should handle basic operator permissions', () => {
    const operatorUser = {
      id: 'operator-1',
      email: 'operator@example.com',
      roles: ['OPERATOR'],
      operatorId: 'operator-1',
      organizationId: 'org-1',
    };

    const BasicPermissionsComponent = () => {
      const { Can } = useAbilities();

      return (
        <div>
          <Can I='update' a='Well'>
            <div data-testid='can-update-well'>Can update wells</div>
          </Can>
          <Can I='delete' a='Well'>
            <div data-testid='can-delete-well'>Can delete wells</div>
          </Can>
          <Can I='audit' a='Well'>
            <div data-testid='can-audit-well'>Can audit wells</div>
          </Can>
        </div>
      );
    };

    render(
      <AbilitiesProvider user={operatorUser}>
        <BasicPermissionsComponent />
      </AbilitiesProvider>
    );

    // Operator can update wells
    expect(screen.getByTestId('can-update-well')).toBeInTheDocument();

    // Operator cannot delete wells (regulatory requirement)
    expect(screen.queryByTestId('can-delete-well')).not.toBeInTheDocument();

    // Operator cannot audit wells
    expect(screen.queryByTestId('can-audit-well')).not.toBeInTheDocument();
  });
});
