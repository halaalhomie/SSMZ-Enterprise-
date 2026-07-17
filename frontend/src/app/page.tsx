'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {

    if (!isHydrated) return;

    router.push(
      isAuthenticated
        ? '/dashboard'
        : '/auth/login'
    );

  }, [isAuthenticated, isHydrated]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );
}
