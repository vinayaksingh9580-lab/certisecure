import { type ReactNode } from 'react';
import Navbar from '../components/Navbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-800/60 py-6 text-center text-sm text-gray-500 bg-[#080b12]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-400">CertiSecure2</span>
            <span>— Cryptographic Certificate Integrity System (SIH 2026)</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Ed25519 Signatures</span>
            <span>•</span>
            <span>SHA-256 Hashes</span>
            <span>•</span>
            <span>MySQL Backend</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
