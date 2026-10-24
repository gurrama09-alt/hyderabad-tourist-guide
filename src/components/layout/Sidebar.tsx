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
  Calculator,
  BookmarkCheck,
  ShieldCheck,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { TRAVEL_ALERTS } from '@/lib/data/seedData';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useApp();

  const navLinks = [
    { href: '/', label: t.navHome, icon: Home },
    { href: '/explore', label: t.navExplore, icon: Map },
    { href: '/routes', label: t.navRoutes, icon: Navigation },
    { href: '/trip-planner', label: t.navTripPlanner, icon: CalendarDays },
    { href: '/cost-calculator', label: t.navCostCalc, icon: Calculator },
    { href: '/my-trip', label: t.navMyTrip, icon: BookmarkCheck },
    { href: '/admin', label: t.navAdmin, icon: ShieldCheck },
  ];

  const activeAlert = TRAVEL_ALERTS.find(a => a.is_active);

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border/40 p-4 shrink-0 h-[calc(100vh-4rem)] sticky top-16 bg-card/30">
      
      {/* Nav List */}
      <nav className="space-y-1.5 flex-1" aria-label="Main Navigation">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-muted-foreground'}`} />
              <span>{item.label}</span>
              {item.href === '/trip-planner' && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-nizami/20 text-nizami-gold border border-nizami/30">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Travel Alert Banner */}
      {activeAlert && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mt-auto">
          <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Transport Advisory</span>
          </div>
          <p className="line-clamp-2 text-muted-foreground text-[11px] leading-relaxed">
            {activeAlert.message}
          </p>
          <div className="mt-2 text-[10px] text-amber-400/80 font-mono">
            Source: {activeAlert.source}
          </div>
        </div>
      )}

      {/* Hyderabad Quote / Culture Card */}
      <div className="mt-3 p-3 rounded-xl border border-border/40 bg-card/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-nizami-gold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>City of Pearls</span>
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          "Where 430 years of royal Qutb Shahi splendor meets futuristic Cyberabad."
        </p>
      </div>

    </aside>
  );
}
