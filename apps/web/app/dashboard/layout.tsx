'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Settings, Home, Menu } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet';
import { cn } from '../../lib/utils';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'User Management',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

interface DashboardLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * Dashboard Layout Component
 *
 * Provides a consistent layout for dashboard pages with:
 * - Sidebar navigation
 * - Mobile-responsive design
 * - Active link highlighting
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const Sidebar = () => (
    <div className='flex h-full flex-col'>
      <div className='flex h-14 items-center border-b px-4'>
        <Link href='/dashboard' className='flex items-center space-x-2'>
          <div className='h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold'>
            W
          </div>
          <span className='font-semibold'>WellFlow</span>
        </Link>
      </div>

      <nav className='flex-1 space-y-1 p-4'>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className='h-4 w-4' />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className='flex h-screen'>
      {/* Desktop Sidebar */}
      <div className='hidden w-64 border-r bg-background md:block'>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Mobile Header */}
        <div className='flex h-14 items-center border-b px-4 md:hidden'>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='ghost' size='sm'>
                <Menu className='h-4 w-4' />
                <span className='sr-only'>Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-64 p-0'>
              <Sidebar />
            </SheetContent>
          </Sheet>

          <Link href='/dashboard' className='ml-4 flex items-center space-x-2'>
            <div className='h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold'>
              W
            </div>
            <span className='font-semibold'>WellFlow</span>
          </Link>
        </div>

        {/* Page Content */}
        <main className='flex-1 overflow-y-auto'>{children}</main>
      </div>
    </div>
  );
}
