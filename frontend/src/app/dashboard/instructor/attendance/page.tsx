'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/instructor/batches?tab=attendance');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
      <p className="text-xs font-medium">Redirecting to Batch Management Attendance...</p>
    </div>
  );
}
