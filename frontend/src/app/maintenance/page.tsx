import React from 'react';
import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-10 flex flex-col items-center">
      <Link href="/" className="self-start text-blue-400 font-mono text-sm tracking-wider mb-8 hover:text-blue-300">
        &larr; BACK TO HUB
      </Link>
      
      <div className="max-w-2xl text-center mt-20">
        <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Maintenance Dispatch</h1>
        <p className="text-slate-400 text-lg">
          The Twilio Voice integration and block failure triggering system will be built here next.
        </p>
      </div>
    </div>
  );
}
