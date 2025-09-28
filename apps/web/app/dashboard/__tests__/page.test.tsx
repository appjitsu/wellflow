import { render, screen } from '@testing-library/react';
import DashboardPage from '../page';

describe('DashboardPage', () => {
  it('renders the dashboard title and description', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText('Welcome to WellFlow - Your oil & gas management platform')
    ).toBeInTheDocument();
  });

  it('renders quick stats cards', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Active Wells')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('98%')).toBeInTheDocument();
  });

  it('renders quick actions cards', () => {
    render(<DashboardPage />);
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('View Settings')).toBeInTheDocument();
  });

  it('renders recent activity section', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('New user invited')).toBeInTheDocument();
    expect(screen.getByText('User role updated')).toBeInTheDocument();
    expect(screen.getByText('System maintenance')).toBeInTheDocument();
  });

  it('renders links to other pages', () => {
    render(<DashboardPage />);
    const manageUsersLink = screen.getByRole('link', { name: /manage users/i });
    expect(manageUsersLink).toHaveAttribute('href', '/dashboard/users');

    const viewSettingsLink = screen.getByRole('link', { name: /view settings/i });
    expect(viewSettingsLink).toHaveAttribute('href', '/dashboard/settings');
  });
});
