'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  // Hooks for getting auth status and router instance
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // This effect will run when the component mounts or when isAuthenticated changes.
  // It's the perfect place to handle our redirection logic.
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/timeline');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // While the redirection is happening, we can show a simple loading state.
  // This prevents any weird flashing of content.
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p>
    </div>
  );
}