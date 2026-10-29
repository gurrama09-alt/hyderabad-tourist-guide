'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { TOURIST_PLACES, TRANSPORT_LINES, TRAVEL_ALERTS } from '@/lib/data/seedData';
import { TouristPlace, UserReport, TravelAlert } from '@/types';
import {
  ShieldCheck,
  Lock,
  Plus,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  IndianRupee,
  RefreshCw,
  Search,
  Check,
  X,
  Database,
  Train,
  MapPin,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  LogOut,
  UserCheck
} from 'lucide-react';

const INITIAL_REPORTS: UserReport[] = [
  {
    id: 'rep_1',
    report_type: 'wrong_hours',
    target_type: 'place',
    target_id: 'salar-jung-museum',
    description: 'Ticket counter closes at 4:30 PM, half an hour before museum gates close at 5:00 PM.',
    suggested_fix: 'Add note: Ticket counter closes at 04:30 PM.',
    status: 'pending',
    created_at: '2026-10-23T14:00:00Z',
  },
  {
    id: 'rep_2',
    report_type: 'inaccurate_route',
    target_type: 'route',
    target_id: 'bus_65',
    description: 'Charminar pedestrianization zone reroutes Bus 65 boarding point 150m south towards Nayapul bridge.',
    suggested_fix: 'Board Bus 65 at Nayapul bus stop instead of monument circle.',
    status: 'investigating',
    created_at: '2026-10-24T09:30:00Z',
  },
];

const PRESET_IMAGES = [
  { label: 'Charminar Heritage', url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Golconda Fort Citadel', url: 'https://images.unsplash.com/photo-1590766940554-634a7ed41450?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Hussain Sagar Buddha', url: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Chowmahalla Durbar', url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Salar Jung Art Museum', url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Birla Mandir Marble', url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Mecca Masjid Courtyard', url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Durgam Cheruvu Bridge', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' },
];

export default function AdminPage() {
  const { offlineLastUpdated, places, updatePlace, resetPlaces } = useApp();

  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isSavingPlace, setIsSavingPlace] = useState<boolean>(false);

  // Check stored admin session on mount
  useEffect(() => {
    const session = localStorage.getItem('hyd_admin_authenticated');
    if (session === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  // Tabs
  const [activeTab, setActiveTab] = useState<'places' | 'reports' | 'alerts' | 'routes'>('places');

  const [reports, setReports] = useState<UserReport[]>(INITIAL_REPORTS);
  const [alerts, setAlerts] = useState<TravelAlert[]>(TRAVEL_ALERTS);

  // Edit place modal
  const [editingPlace, setEditingPlace] = useState<TouristPlace | null>(null);
  const [newGalleryPhotoUrl, setNewGalleryPhotoUrl] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // New alert form
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertMsg, setNewAlertMsg] = useState('');
  const [newAlertSeverity, setNewAlertSeverity] = useState<'info' | 'warning' | 'critical'>('info');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanPass = adminPassword.trim();

    // Superadmin accounts
    const SUPERADMINS = [
      { email: 'gurrama09@gmail.com', password: 'Anilgoud@123' },
      { email: 'aashishlade0@gmail.com', password: 'Anilgoud@123' },
    ];

    const isSuperAdmin = SUPERADMINS.some(
      (sa) => cleanEmail === sa.email && cleanPass === sa.password
    );

    // Authenticate with superadmin, official admin credentials, or quick PIN 1591
    if (
      isSuperAdmin ||
      (cleanEmail === 'admin@hyderabadtourism.gov.in' && (cleanPass === 'Nizam2026!' || cleanPass === 'admin' || cleanPass === '1591')) ||
      cleanPass === '1591' ||
      cleanPass === 'nizam'
    ) {
      setIsAdminAuthenticated(true);
      setAuthError('');
      localStorage.setItem('hyd_admin_authenticated', 'true');
      if (isSuperAdmin) {
        localStorage.setItem('hyd_admin_role', 'superadmin');
        localStorage.setItem('hyd_admin_email', cleanEmail);
      }
    } else {
      setAuthError('Invalid credentials. Please check your email and password.');
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('hyd_admin_authenticated');
    localStorage.removeItem('hyd_admin_role');
    localStorage.removeItem('hyd_admin_email');
  };

  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;

    setIsSavingPlace(true);
    const photosList = editingPlace.photos && editingPlace.photos.length > 0
      ? editingPlace.photos
      : [editingPlace.cover_image];

    const finalPhotos = photosList.includes(editingPlace.cover_image)
      ? photosList
      : [editingPlace.cover_image, ...photosList];

    const updated: TouristPlace = {
      ...editingPlace,
      photos: finalPhotos,
      verified: true,
      last_updated: new Date().toISOString(),
    };
    await updatePlace(updated);

    setIsSavingPlace(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setEditingPlace(null);
    }, 1800);
  };

  // Add photo to current editing place gallery
  const handleAddGalleryPhoto = () => {
    if (!editingPlace || !newGalleryPhotoUrl.trim()) return;
    const currentPhotos = editingPlace.photos || [editingPlace.cover_image];
    setEditingPlace({
      ...editingPlace,
      photos: [...currentPhotos, newGalleryPhotoUrl.trim()],
    });
    setNewGalleryPhotoUrl('');
  };

  // Remove photo from gallery
  const handleRemoveGalleryPhoto = (indexToRemove: number) => {
    if (!editingPlace || !editingPlace.photos) return;
    setEditingPlace({
      ...editingPlace,
      photos: editingPlace.photos.filter((_, idx) => idx !== indexToRemove),
    });
  };

  // Set photo as cover
  const handleSetCoverPhoto = (url: string) => {
    if (!editingPlace) return;
    setEditingPlace({
      ...editingPlace,
      cover_image: url,
    });
  };

  const handleUpdateReportStatus = (reportId: string, status: UserReport['status']) => {
    setReports(reports.map((r) => (r.id === reportId ? { ...r, status } : r)));
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTitle.trim() || !newAlertMsg.trim()) return;

    const alertItem: TravelAlert = {
      id: `alert_${Date.now()}`,
      title: newAlertTitle,
      message: newAlertMsg,
      severity: newAlertSeverity,
      affected_transport_line: 'Hyderabad Traffic & Transit',
      valid_from: new Date().toISOString(),
      is_active: true,
      source: 'Admin Verified Notice',
      verified: true,
      last_updated: new Date().toISOString(),
    };

    setAlerts([alertItem, ...alerts]);
    setNewAlertTitle('');
    setNewAlertMsg('');
  };

  // Render Login Screen if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-emerald-500/30 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="font-serif font-bold text-2xl text-foreground">
              Official Admin Authentication
            </h1>
            <p className="text-xs text-muted-foreground">
              Hyderabad Tourism & HMRL Transit Administration
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left text-xs">
            <div>
              <label className="font-semibold block mb-1 text-foreground">Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Enter your official admin email"
                autoComplete="off"
                className="w-full bg-background border border-border/80 rounded-xl p-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-foreground">
                Passcode / Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter your admin passcode"
                autoComplete="new-password"
                className="w-full bg-background border border-border/80 rounded-xl p-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-400 font-semibold p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-green-glow transition-all"
            >
              Sign In to Admin Portal
            </button>
          </form>

          <div className="pt-2 text-[11px] text-muted-foreground border-t border-border/40">
            Protected under Telangana State Tourism Department Security Protocol
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Admin Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-3xl bg-card border border-emerald-500/30 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-emerald-500" />
              <span>Admin Management Dashboard</span>
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>Super Admin</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage attraction imagery, update opening hours, monitor data freshness, and broadcast transit alerts
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 text-xs font-semibold hover:bg-card/80 text-rose-400 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Admin Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
          <div className="text-muted-foreground uppercase text-[10px]">Total Attractions</div>
          <div className="font-serif font-bold text-xl text-foreground">{places.length}</div>
          <div className="text-[10px] text-emerald-400">Custom image management enabled</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
          <div className="text-muted-foreground uppercase text-[10px]">User Reports</div>
          <div className="font-serif font-bold text-xl text-amber-400">
            {reports.filter((r) => r.status === 'pending').length} Pending
          </div>
          <div className="text-[10px] text-muted-foreground">{reports.length} total logged</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
          <div className="text-muted-foreground uppercase text-[10px]">Active Alerts</div>
          <div className="font-serif font-bold text-xl text-emerald-400">
            {alerts.filter((a) => a.is_active).length} Active
          </div>
          <div className="text-[10px] text-muted-foreground">Traffic & metro notices</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
          <div className="text-muted-foreground uppercase text-[10px]">Data Freshness</div>
          <div className="font-bold text-xs sm:text-sm text-foreground truncate">
            {new Date(offlineLastUpdated).toLocaleDateString()}
          </div>
          <div className="text-[10px] text-emerald-400">HMRL & SCR Timetables Sync</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab('places')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'places'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Attractions & Images ({places.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'reports'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          User Reports ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'alerts'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Travel Advisories ({alerts.length})
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'routes'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Transit Schedules
        </button>
      </div>

      {/* Tab 1: Attractions & Image Editor */}
      {activeTab === 'places' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif font-bold text-lg text-foreground">
                Attraction Management & Photo Gallery Editor
              </h2>
              <p className="text-xs text-muted-foreground">
                Click "Edit / Photos" to change cover images, add gallery photos, or adjust visiting hours.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all attractions and photos back to official seed defaults?')) {
                    resetPlaces();
                  }
                }}
                className="px-3 py-2 rounded-xl border border-border/80 hover:bg-card/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                title="Restore default photos and data"
              >
                Reset to Defaults
              </button>

              <button
                onClick={() => {
                setEditingPlace({
                  id: `place_${Date.now()}`,
                  name: 'New Hyderabad Attraction',
                  slug: `new-place-${Date.now()}`,
                  category_id: 'cat_historical',
                  description: 'Detailed description of the new tourist destination...',
                  address: 'Hyderabad, Telangana 500001',
                  neighbourhood: 'Central Hyderabad',
                  latitude: 17.385,
                  longitude: 78.486,
                  entry_fee_inr: 25,
                  opening_hours: '09:00 AM - 05:30 PM (Daily)',
                  opening_time_mins: 540,
                  closing_time_mins: 1050,
                  estimated_duration_mins: 90,
                  visitor_tips: ['Wear comfortable walking shoes'],
                  wheelchair_accessible: true,
                  is_popular: false,
                  rating: 4.8,
                  review_count: 0,
                  cover_image: PRESET_IMAGES[0].url,
                  photos: [PRESET_IMAGES[0].url],
                  source: 'Admin Verified Entry',
                  verified: true,
                  last_updated: new Date().toISOString(),
                });
              }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Attraction</span>
              </button>
            </div>
          </div>

          {/* Places Table */}
          <div className="overflow-x-auto rounded-3xl border border-border/60 bg-card shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 uppercase tracking-wider text-[10px] text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="p-3.5">Attraction & Photo</th>
                  <th className="p-3.5">Neighbourhood</th>
                  <th className="p-3.5">Timings</th>
                  <th className="p-3.5">Entry Fee</th>
                  <th className="p-3.5">Gallery Photos</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {places.map((place) => (
                  <tr key={place.id} className="hover:bg-card/80 transition-colors">
                    <td className="p-3.5 font-semibold text-foreground flex items-center gap-3">
                      <img
                        src={place.cover_image}
                        alt={place.name}
                        className="w-12 h-10 rounded-xl object-cover shrink-0 border border-border/60"
                      />
                      <div>
                        <div className="font-bold text-sm text-foreground">{place.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">ID: {place.id}</div>
                      </div>
                    </td>
                    <td className="p-3.5 text-muted-foreground">{place.neighbourhood}</td>
                    <td className="p-3.5">{place.opening_hours.split('(')[0]}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">
                      {place.entry_fee_inr === 0 ? 'Free' : `₹${place.entry_fee_inr}`}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-semibold">
                        {(place.photos || [place.cover_image]).length} Images
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setEditingPlace(place)}
                        className="px-3 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-semibold transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Edit / Photos</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 2: User Reports */}
      {activeTab === 'reports' && (
        <section className="space-y-4">
          <h2 className="font-serif font-bold text-lg text-foreground">
            User Route Inaccuracy & Timing Reports
          </h2>
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-3xl bg-card border border-border/60 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-mono uppercase text-[10px] font-bold ${
                        rep.report_type === 'inaccurate_route'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {rep.report_type.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-foreground">Target: {rep.target_id}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full uppercase text-[10px] font-bold ${
                      rep.status === 'resolved'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : rep.status === 'investigating'
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>

                <p className="text-muted-foreground leading-relaxed">{rep.description}</p>

                {rep.suggested_fix && (
                  <div className="p-3 rounded-2xl bg-background border border-border/40 text-foreground">
                    <span className="font-semibold text-emerald-400">Suggested Fix: </span>
                    <span>{rep.suggested_fix}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Logged: {new Date(rep.created_at).toLocaleString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateReportStatus(rep.id, 'investigating')}
                      className="px-3 py-1 rounded-lg border border-border hover:bg-card/80 text-[11px] font-medium"
                    >
                      Investigate
                    </button>
                    <button
                      onClick={() => handleUpdateReportStatus(rep.id, 'resolved')}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                    >
                      Mark Resolved ✓
                    </button>
                    <button
                      onClick={() => handleUpdateReportStatus(rep.id, 'dismissed')}
                      className="px-3 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground text-[11px]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 3: Travel Alerts */}
      {activeTab === 'alerts' && (
        <section className="space-y-6">
          <form
            onSubmit={handleAddAlert}
            className="p-6 rounded-3xl bg-card border border-border/70 space-y-4 text-xs"
          >
            <h3 className="font-serif font-bold text-base text-foreground">
              Broadcast Real-Time Travel Advisory
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Alert Headline</label>
                <input
                  type="text"
                  value={newAlertTitle}
                  onChange={(e) => setNewAlertTitle(e.target.value)}
                  placeholder="e.g. Tank Bund Sunday Evening Pedestrian Protocol"
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Severity</label>
                <select
                  value={newAlertSeverity}
                  onChange={(e) => setNewAlertSeverity(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground focus:outline-none"
                >
                  <option value="info">Info Advisory</option>
                  <option value="warning">Warning / Detour</option>
                  <option value="critical">Critical Closure</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Detailed Message</label>
              <textarea
                value={newAlertMsg}
                onChange={(e) => setNewAlertMsg(e.target.value)}
                placeholder="Details of traffic diverts, last train times, or metro frequency changes..."
                rows={2}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm"
            >
              Broadcast Alert
            </button>
          </form>

          {/* Active Alerts List */}
          <div className="space-y-3">
            {alerts.map((al) => (
              <div
                key={al.id}
                className="p-4 rounded-2xl bg-card border border-border/60 flex items-start justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        al.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-400'
                      }`}
                    />
                    <span>{al.title}</span>
                  </div>
                  <p className="text-muted-foreground">{al.message}</p>
                  <div className="text-[10px] text-muted-foreground font-mono pt-1">
                    Source: {al.source} • {new Date(al.valid_from).toLocaleDateString()}
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono text-[10px]">
                  Active Broadcast
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 4: Transit Schedules */}
      {activeTab === 'routes' && (
        <section className="space-y-4">
          <h2 className="font-serif font-bold text-lg text-foreground">
            Hyderabad Metro & MMTS Local Rail Timetables
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {TRANSPORT_LINES.map((line) => (
              <div key={line.id} className="p-5 rounded-3xl bg-card border border-border/60 space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: line.color_hex }}
                  />
                  <h3 className="font-bold text-sm text-foreground">{line.name}</h3>
                </div>
                <p className="text-muted-foreground">{line.description}</p>
                <div className="space-y-1 pt-2 border-t border-border/40 text-[11px]">
                  <div>Operating Hours: {line.first_time} - {line.last_time}</div>
                  <div>Frequency: Every {line.frequency_mins} mins</div>
                  <div>Station Count: {line.stations.length} stops</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal: Edit Attraction & Image Gallery Manager */}
      {editingPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="font-serif font-bold text-xl text-foreground">
                  Edit Attraction & Images
                </h3>
                <p className="text-xs text-muted-foreground">
                  Update monument photos, cover imagery, and ticketing info
                </p>
              </div>
              <button
                onClick={() => setEditingPlace(null)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlace} className="space-y-5 text-xs">
              
              {/* Image Manager Section */}
              <div className="p-4 rounded-2xl bg-background border border-border/70 space-y-4">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                  <ImageIcon className="w-4 h-4" />
                  <span>Cover Photo & Gallery Manager</span>
                </div>

                {/* Primary Cover Image */}
                <div className="space-y-2">
                  <label className="font-semibold block text-foreground">
                    Main Cover Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editingPlace.cover_image}
                      onChange={(e) =>
                        setEditingPlace({ ...editingPlace, cover_image: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 bg-card border border-border rounded-xl p-2.5 text-foreground"
                      required
                    />
                  </div>

                  {/* Cover Photo Preview */}
                  {editingPlace.cover_image && (
                    <div className="relative h-44 rounded-2xl overflow-hidden border border-border/60 mt-2 bg-muted">
                      <img
                        src={editingPlace.cover_image}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/70 text-emerald-400 text-[10px] font-semibold">
                        Current Cover Photo
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Preset Image Selectors */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Quick Preset Images:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSetCoverPhoto(preset.url)}
                        className="px-2.5 py-1 rounded-lg bg-card border border-border hover:border-emerald-500 text-[10px] text-foreground transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gallery Photos List */}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <label className="font-semibold block text-foreground">
                    Photo Gallery Images ({(editingPlace.photos || []).length})
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(editingPlace.photos || [editingPlace.cover_image]).map((photoUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden h-24 border border-border/60 bg-muted"
                      >
                        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          <button
                            type="button"
                            onClick={() => handleSetCoverPhoto(photoUrl)}
                            className="px-1.5 py-1 rounded bg-emerald-600 text-white text-[9px] font-bold"
                            title="Set as Cover"
                          >
                            Set Cover
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryPhoto(idx)}
                            className="p-1 rounded bg-rose-600 text-white text-[9px]"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Gallery Photo Input */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="url"
                      value={newGalleryPhotoUrl}
                      onChange={(e) => setNewGalleryPhotoUrl(e.target.value)}
                      placeholder="Paste additional image URL (https://...)"
                      className="flex-1 bg-card border border-border rounded-xl p-2.5 text-foreground"
                    />
                    <button
                      type="button"
                      onClick={handleAddGalleryPhoto}
                      disabled={!newGalleryPhotoUrl.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-xs"
                    >
                      + Add Photo
                    </button>
                  </div>
                </div>

              </div>

              {/* Basic Place Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Place Name</label>
                  <input
                    type="text"
                    value={editingPlace.name}
                    onChange={(e) => setEditingPlace({ ...editingPlace, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Neighbourhood</label>
                  <input
                    type="text"
                    value={editingPlace.neighbourhood}
                    onChange={(e) =>
                      setEditingPlace({ ...editingPlace, neighbourhood: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Entry Fee (₹ INR for Indians)</label>
                  <input
                    type="number"
                    value={editingPlace.entry_fee_inr}
                    onChange={(e) =>
                      setEditingPlace({
                        ...editingPlace,
                        entry_fee_inr: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Opening Hours String</label>
                  <input
                    type="text"
                    value={editingPlace.opening_hours}
                    onChange={(e) =>
                      setEditingPlace({ ...editingPlace, opening_hours: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  value={editingPlace.description}
                  onChange={(e) =>
                    setEditingPlace({ ...editingPlace, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="wheelchair"
                  checked={editingPlace.wheelchair_accessible}
                  onChange={(e) =>
                    setEditingPlace({
                      ...editingPlace,
                      wheelchair_accessible: e.target.checked,
                    })
                  }
                  className="accent-emerald-500 w-4 h-4 rounded"
                />
                <label htmlFor="wheelchair" className="font-medium cursor-pointer">
                  Verified Wheelchair Accessible
                </label>
              </div>

              {saveSuccess ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Attraction & Photos Saved & Synced Across All Devices!</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setEditingPlace(null)}
                    className="px-4 py-2.5 rounded-xl bg-card border border-border font-medium hover:bg-card/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPlace}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold shadow-green-glow flex items-center gap-2"
                  >
                    {isSavingPlace ? 'Syncing to Cloud...' : 'Save & Verify Attraction'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
