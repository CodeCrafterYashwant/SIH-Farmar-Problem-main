'use client';

import { useState, useEffect, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function getRouteRequirement(pathname) {
  if (!pathname) return { isProtected: false };

  // Explicit public routes
  if (
    pathname === '/' ||
    pathname === '/centres' ||
    pathname.startsWith('/queue') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/staff/login' ||
    pathname === '/admin/login'
  ) {
    return { isProtected: false };
  }

  // Admin protected routes (except /admin/login handled above)
  if (pathname.startsWith('/admin')) {
    return { isProtected: true, allowedRoles: ['admin'] };
  }

  // Staff protected routes (except /staff/login handled above)
  if (pathname.startsWith('/staff')) {
    return { isProtected: true, allowedRoles: ['staff', 'admin'] };
  }

  // Farmer / Authenticated user protected routes
  if (
    pathname === '/my-bookings' ||
    pathname.startsWith('/my-bookings/') ||
    pathname === '/payments' ||
    pathname.startsWith('/payments/') ||
    (pathname.startsWith('/centres/') && pathname.endsWith('/book'))
  ) {
    return { isProtected: true, allowedRoles: ['farmer', 'staff', 'admin'] };
  }

  return { isProtected: false };
}

export function checkAuthSync(pathname) {
  if (typeof window === 'undefined') return false;
  const requirement = getRouteRequirement(pathname);
  if (!requirement.isProtected) return true;

  try {
    const token = localStorage.getItem('sih_token');
    const rawUser = localStorage.getItem('sih_user');
    if (!token || !rawUser) return false;

    const user = JSON.parse(rawUser);
    if (requirement.allowedRoles && !requirement.allowedRoles.includes(user.role)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const req = getRouteRequirement(pathname);

  // Mounted state to handle hydration safely
  const [mounted, setMounted] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  useEffect(() => {
    setMounted(true);

    const handleAuthEvent = () => {
      setAuthVersion((v) => v + 1);
    };

    window.addEventListener('authChange', handleAuthEvent);
    window.addEventListener('storage', handleAuthEvent);

    return () => {
      window.removeEventListener('authChange', handleAuthEvent);
      window.removeEventListener('storage', handleAuthEvent);
    };
  }, []);

  // Check auth for the current route
  const isAuth = mounted ? checkAuthSync(pathname) : !req.isProtected;

  useEffect(() => {
    if (!mounted) return;

    const requirement = getRouteRequirement(pathname);
    if (!requirement.isProtected) return;

    if (!checkAuthSync(pathname)) {
      router.replace('/');
    }
  }, [pathname, mounted, authVersion, router]);

  // If public route, render immediately
  if (!req.isProtected) {
    return <>{children}</>;
  }

  // If protected route and not yet confirmed as authenticated, show redirect placeholder
  if (!mounted || !isAuth) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4 shadow-sm" />
        <p className="text-slate-300 text-sm font-semibold tracking-wide">
          Verifying authorization... Redirecting to home...
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Access to this section requires active authentication.
        </p>
      </div>
    );
  }

  // If authenticated and role confirmed, render protected page
  return <>{children}</>;
}
