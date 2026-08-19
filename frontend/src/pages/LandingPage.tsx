import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, Key, QrCode, ArrowRight, Lock, FileCheck2, Cpu } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Navbar />

      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-cyan-500/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <Cpu className="w-4 h-4 text-cyan-400" />
            SIH 2026 Hackathon Flagship Project
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
            The Certificate <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Nobody Can Fake
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed">
            CertiSecure2 combines <strong className="text-gray-200">Ed25519 digital signatures</strong>, <strong className="text-gray-200">SHA-256 cryptographic hashes</strong>, and instant <strong className="text-gray-200">QR code verification</strong> to completely eliminate certificate fraud. No blockchain required.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 w-full">
        <div className="glass-panel rounded-2xl p-8 border border-blue-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-emerald-400">Authentic Certificate</h3>
              <p className="text-xs text-gray-400 mt-1">Full Ed25519 signature match & trusted active issuer.</p>
            </div>
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
              <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-red-400">Tamper Detection</h3>
              <p className="text-xs text-gray-400 mt-1">Single character change in PDF triggers instant mismatch alert.</p>
            </div>
            <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-amber-400">Instant Revocation</h3>
              <p className="text-xs text-gray-400 mt-1">Revoked certificates flagged immediately across all verification points.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Enterprise Cryptographic Security</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Built strictly using industry standard cryptographic primitives for maximum performance and verifiable security.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl border border-gray-800">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Ed25519 Digital Signatures</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Every institution is assigned a high-speed Ed25519 keypair. Private keys are encrypted at rest using Fernet AES-128.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-gray-800">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Canonical JSON & SHA-256</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Data fields are canonicalized into deterministic JSON before hashing. Any change to student name, roll number, or grade breaks the hash.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-gray-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Instant QR Verification</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Employers scan the embedded QR code on the PDF certificate. The system performs real-time cryptographic signature validation.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-gray-800/80 py-8 bg-[#080b12] text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>CertiSecure2 — SIH 2026 Smart India Hackathon Project</div>
          <div>Python FastAPI + MySQL + React TypeScript + ReportLab</div>
        </div>
      </footer>
    </div>
  );
}
