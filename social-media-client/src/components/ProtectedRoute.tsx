'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react'; // Import useState

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // --- FIX IS HERE ---
  // New state to track if the component has mounted on the client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  // --- END FIX ---

  useEffect(() => {
    if (!isLoading && !isAuthenticated && isMounted) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router, isMounted]);

  // If the component has not mounted yet, render nothing.
  // This ensures the server and initial client render are identical (both are null).
  if (!isMounted) {
    return null;
  }

  // While loading auth state, or if not authenticated, show a loader.
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If everything is fine, render the actual page content.
  return <>{children}</>;
}