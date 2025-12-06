'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VolunteerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Discord auth page
    router.push('/auth/discord');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-xl">Redirecting...</div>
    </div>
  );
}
