'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Film,
  Music,
  Tv,
  Shield,
  User,
  LogOut,
  Search,
  Menu,
  X,
  Compass,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/', icon: Compass },
    { label: 'Movies', href: '/movies', icon: Film },
    { label: 'Songs', href: '/songs', icon: Music },
    { label: 'Web Series', href: '/series', icon: Tv },
  ];

  const industries = [
    { name: 'Bollywood', color: 'from-orange-500/20 to-red-500/20' },
    { name: 'Hollywood', color: 'from-blue-500/20 to-red-500/20' },
    { name: 'Bhojpuri', color: 'from-yellow-500/20 to-red-500/20' },
    { name: 'Tollywood', color: 'from-red-600/20 to-amber-500/20' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-dark via-primary to-red-400 flex items-center justify-center shadow-red-glow transition-transform duration-300 group-hover:scale-105">
              <span className="font-black text-black text-lg tracking-tighter">R</span>
            </div>
            <div className="flex items-baseline tracking-tighter">
              <span className="font-extrabold text-2xl text-white tracking-wider">
                REEL
              </span>
              <span className="font-black text-2xl text-primary tracking-wider group-hover:text-red-400 transition-colors">
                BEAT
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white bg-white/10 shadow-sm border border-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Quick industry tags on larger screens */}
          <div className="hidden xl:flex items-center space-x-1 text-xs">
            {industries.map((ind) => (
              <Link
                key={ind.name}
                href={`/movies/${ind.name.toLowerCase()}`}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-red-300 border border-white/5 transition-all"
              >
                {ind.name}
              </Link>
            ))}
          </div>

          {/* Admin Panel Direct Button (if Admin or show Login link) */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-primary/20 hover:bg-primary text-red-300 hover:text-white border border-primary/40 transition-all shadow-red-glow"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </Link>
          )}

          {/* User Auth Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-white/5 border border-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-surface-card border border-primary/40 flex items-center justify-center text-xs font-bold text-red-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-card border border-white/10 shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-red-400">
                      {user.role}
                    </span>
                  </div>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/5 mt-1"
                    >
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 mt-1 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary-dark text-white transition-all shadow-red-glow"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-surface border-b border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm bg-white/5 text-gray-200 hover:bg-primary/20 hover:text-white"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/5">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-mono">
              Industries
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {industries.map((ind) => (
                <Link
                  key={ind.name}
                  href={`/movies/${ind.name.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs py-1.5 px-3 rounded bg-white/5 text-gray-300 hover:text-red-400"
                >
                  {ind.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
