'use client';

import dynamic from 'next/dynamic';

const MainApp = dynamic(() => import('@/components/app/main-app'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <img src="/trishul-logo.png" alt="Trishul AI Helper" className="h-14 sm:h-16 w-auto object-contain mx-auto mb-4" />
        <div className="h-6 w-6 animate-spin mx-auto text-primary border-2 border-primary border-t-transparent rounded-full" />
      </div>
    </div>
  ),
});

export default function Home() {
  return <MainApp />;
}
