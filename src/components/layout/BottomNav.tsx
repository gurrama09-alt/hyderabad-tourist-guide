'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Home,
  Map,
  Navigation,
  CalendarDays,
  BookmarkCheck
} from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useApp();

  const navLinks = [
    { href: '/', label: t.navHome, icon: Home },
    { href: '/explore', label: t.navExplore, icon: Map },
    { href: '/routes', label: t.navRoutes, icon: Navigation },
    { href: '/trip-planner', label: t.navTripPlanner, icon: CalendarDays },
    { href: '/my-trip', label: t.navMyTrip, icon: BookmarkCheck },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 glass-panel pb-safe"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
