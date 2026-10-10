'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UploadCloud,
  Film,
  LogOut,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Upload Media', href: '/admin/upload', icon: UploadCloud },
    { label: 'Manage Catalog', href: '/admin/content', icon: Film },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-white/5 flex flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Brand */}
        <div className="flex items-center space-x-2.5 px-3 py-4 border-b border-white/5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-black text-base shadow-red-glow">
            R
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="font-extrabold text-base text-white">REEL</span>
              <span className="font-black text-base text-primary">BEAT</span>
            </div>
            <p className="text-[10px] text-red-400 font-mono uppercase tracking-wider">
              Admin Portal
            </p>
          </div>
        </div>

        {/* Links */}
        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href === '/admin/content' && pathname === '/admin/manage');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/20 text-white border border-primary/40 shadow-red-glow'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User and Exit */}
      <div className="pt-6 border-t border-white/5 space-y-3">
        <Link
          href="/"
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Return to Streaming</span>
        </Link>

        <div className="px-3 py-2 rounded-xl bg-surface-card border border-white/5 flex items-center justify-between">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-semibold text-white truncate">
              {user?.name || 'Administrator'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
