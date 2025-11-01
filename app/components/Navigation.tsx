'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User, Menu, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface NavigationProps {
  userEmail?: string;
}

export default function Navigation({ userEmail = 'nmurray@gmail.com' }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    setDropdownOpen(false);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSettings = () => {
    setDropdownOpen(false);
    router.push('/settings');
  };

  const isActive = (path: string) => pathname === path;

  // Extract user name from email (first part before @)
  const userName = userEmail.split('@')[0].split('.').map(
    part => part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ');

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://advancedcare.com/lovable-uploads/76b12c1f-21c2-4dce-bd93-b74bb2fcf46a.png" 
                alt="AdvancedCare Logo" 
                className="h-8 w-auto" 
              />
              <h1 className="text-2xl font-bold text-gray-900">AdvancedCare - Centered Clinic</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">Live</span>
              </div>
              
              {/* User Menu Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <Menu className="w-5 h-5 text-gray-700" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900">{userName}</span>
                    <span className="text-xs text-gray-500">{userEmail}</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={handleSettings}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/"
              className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                isActive('/')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/remits"
              className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                isActive('/remits')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Remits
            </Link>
            <Link
              href="/patients"
              className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                pathname.startsWith('/patients')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Patients
            </Link>
            <Link
              href="/schedule"
              className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                pathname.startsWith('/schedule')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appointments
            </Link>
            <Link
              href="/invoices"
              className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                pathname.startsWith('/invoices')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Invoices
            </Link>
            <Link
              href="/payments"
              className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                isActive('/payments')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payments
            </Link>
            <Link
              href="/webhooks"
              className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                isActive('/webhooks')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Webhooks
            </Link>
            <Link
              href="/clinic/dashboard"
              className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                pathname.startsWith('/clinic')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Clinic
            </Link>
            <Link
              href="/lobechat"
              className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
                pathname.startsWith('/lobechat')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              AI Chat
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
