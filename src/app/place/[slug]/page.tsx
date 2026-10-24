'use client';

import React, { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { TOURIST_PLACES, SAMPLE_REVIEWS } from '@/lib/data/seedData';
import { TouristPlace, Review } from '@/types';
import {
  Clock,
  IndianRupee,
  MapPin,
  Star,
  Navigation,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Train,
  Bus,
  Accessibility,
  Share2,
  AlertTriangle,
  Send,
  CheckCircle2,
  Phone,
  Globe,
  ArrowLeft,
  Info
} from 'lucide-react';

export default function PlaceDetailsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { t, isPlaceSaved, toggleSavePlace, places } = useApp();

  const place: TouristPlace | undefined =
    (places || TOURIST_PLACES).find((p) => p.slug === slug) ||
    TOURIST_PLACES.find((p) => p.slug === slug);

  if (!place) {
    return notFound();
  }

  const [activePhoto, setActivePhoto] = useState<string>(place.cover_image);

  // Sync activePhoto if admin updates place cover_image
  React.useEffect(() => {
    if (place?.cover_image) {
      setActivePhoto(place.cover_image);
    }
  }, [place?.cover_image]);
  const [reviews, setReviews] = useState<Review[]>(
    SAMPLE_REVIEWS.filter((r) => r.place_id === place.id)
  );

  // Review submission state
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>('inaccurate_route');
  const [reportDesc, setReportDesc] = useState<string>('');
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);

  // Copied share link state
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const review: Review = {
      id: `rev_${Date.now()}`,
      place_id: place.id,
      user_name: reviewerName.trim() || 'Tourist Visitor',
      rating: newRating,
      comment: newComment.trim(),
      verified_visit: true,
      created_at: new Date().toISOString(),
    };

    setReviews([review, ...reviews]);
    setNewComment('');
    setReviewerName('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc.trim()) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      setReportDesc('');
    }, 2000);
  };

  // Nearby attractions in same neighbourhood
  const nearbyPlaces = TOURIST_PLACES.filter(
    (p) => p.id !== place.id && p.neighbourhood.split('/')[0] === place.neighbourhood.split('/')[0]
  ).slice(0, 3);

  const saved = isPlaceSaved(place.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Attractions</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-card/80 text-xs font-medium transition-colors"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => toggleSavePlace(place.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              saved
                ? 'bg-nizami/20 text-nizami-gold border-nizami/40 font-semibold'
                : 'bg-card border-border/60 hover:text-foreground'
            }`}
          >
            {saved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>{t.saved}</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>{t.savePlace}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Showcase Gallery */}
      <div className="space-y-3">
        <div className="relative h-64 sm:h-96 w-full rounded-3xl overflow-hidden bg-muted border border-border/60 shadow-xl">
          <img
            src={activePhoto}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Badge Overlays */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
              {place.neighbourhood}
            </span>
            {place.wheelchair_accessible && (
              <span className="px-2.5 py-1 rounded-full bg-black/60 text-emerald-400 text-xs font-medium flex items-center gap-1 backdrop-blur-sm border border-emerald-500/30">
                <Accessibility className="w-3.5 h-3.5" />
                <span>Accessible</span>
              </span>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1 text-amber-300 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{place.rating}</span>
              </div>
              <span className="text-xs text-zinc-300">
                ({place.review_count.toLocaleString()} Google & Visitor Ratings)
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
              {place.name}
            </h1>
          </div>
        </div>

        {/* Thumbnails list */}
        {place.photos && place.photos.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {place.photos.map((url, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(url)}
                className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  activePhoto === url ? 'border-nizami-gold scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Key Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border/60 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <Clock className="w-4 h-4 text-nizami-gold" />
            <span>{t.openingHours}</span>
          </div>
          <div className="font-semibold text-xs sm:text-sm text-foreground">
            {place.opening_hours}
          </div>
          {place.closed_on && (
            <div className="text-[10px] text-rose-400 font-medium mt-1">
              Closed every {place.closed_on}
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/60 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <IndianRupee className="w-4 h-4 text-emerald-500" />
            <span>{t.entryFee}</span>
          </div>
          <div className="font-semibold text-xs sm:text-sm text-foreground">
            {place.entry_fee_inr === 0 ? 'Free Entry' : `₹${place.entry_fee_inr} (Indians)`}
          </div>
          {place.entry_fee_foreign_inr && place.entry_fee_foreign_inr > 0 && (
            <div className="text-[10px] text-muted-foreground mt-1">
              ₹{place.entry_fee_foreign_inr} for Foreign Nationals
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/60 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <Info className="w-4 h-4 text-sky-400" />
            <span>{t.visitDuration}</span>
          </div>
          <div className="font-semibold text-xs sm:text-sm text-foreground">
            ~{place.estimated_duration_mins} Minutes
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Recommended exploration time
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs mb-1">
            <Navigation className="w-4 h-4" />
            <span>Plan Route</span>
          </div>
          <Link
            href={`/routes?dest=${place.id}`}
            className="w-full text-center py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            {t.getDirections} →
          </Link>
        </div>
      </div>

      {/* Description & History Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Description & History */}
        <div className="lg:col-span-2 space-y-6">
          <section className="p-6 rounded-3xl bg-card border border-border/60 space-y-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
              About This Monument
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {place.description}
            </p>

            {place.history && (
              <div className="pt-3 border-t border-border/40 space-y-2">
                <h3 className="font-serif font-bold text-sm text-nizami-gold">
                  Historical Background
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {place.history}
                </p>
              </div>
            )}
          </section>

          {/* Visitor Tips Section */}
          {place.visitor_tips.length > 0 && (
            <section className="p-6 rounded-3xl bg-nizami/10 border border-nizami/25 space-y-3">
              <h2 className="font-serif text-lg font-bold text-nizami-gold flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>{t.visitorTips}</span>
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                {place.visitor_tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-nizami-gold shrink-0 mt-1.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Accessibility Info */}
          {place.accessibility_info && (
            <section className="p-5 rounded-3xl bg-card border border-border/60 flex items-start gap-3">
              <Accessibility className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-foreground">
                  Accessibility & Wheelchair Mobility
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {place.accessibility_info}
                </p>
              </div>
            </section>
          )}

          {/* User Reviews Section */}
          <section className="p-6 rounded-3xl bg-card border border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                Verified Visitor Reviews ({reviews.length})
              </h2>
              <div className="flex items-center gap-1 text-sm font-bold text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{place.rating} / 5</span>
              </div>
            </div>

            {/* Submit New Review Form */}
            <form onSubmit={handleAddReview} className="p-4 rounded-2xl bg-background border border-border/60 space-y-3">
              <div className="text-xs font-semibold text-foreground">Write a Review</div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{newRating} Stars</span>
              </div>

              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Your Name (e.g. Rahul S.)"
                className="w-full bg-card border border-border/70 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nizami-gold"
              />

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience, ticketing tips, crowd timing, or best photo spots..."
                rows={3}
                className="w-full bg-card border border-border/70 rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nizami-gold"
              />

              <div className="flex items-center justify-between pt-1">
                {reviewSubmitted && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Review submitted successfully!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="ml-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>

            {/* Existing Reviews List */}
            <div className="space-y-3 pt-2">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-card/60 border border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">{rev.user_name}</span>
                      {rev.verified_visit && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                          Verified Visit
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-amber-400 text-xs">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Col: Transit Details & Actions */}
        <div className="space-y-6">
          
          {/* Public Transit Hubs */}
          <div className="p-6 rounded-3xl bg-card border border-border/60 space-y-4">
            <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>How To Reach</span>
            </h3>

            {place.nearest_metro_station && (
              <div className="p-3 rounded-2xl bg-background border border-border/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Train className="w-4 h-4 text-metro-blue" />
                  <span>{t.nearestMetro}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  {place.nearest_metro_station}
                </p>
              </div>
            )}

            {place.nearest_bus_stop && (
              <div className="p-3 rounded-2xl bg-background border border-border/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Bus className="w-4 h-4 text-tgsrtc" />
                  <span>{t.nearestBus}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  {place.nearest_bus_stop}
                </p>
              </div>
            )}

            <div className="pt-2">
              <Link
                href={`/routes?dest=${place.id}`}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs text-center flex items-center justify-center gap-2 transition-colors shadow-green-glow"
              >
                <Navigation className="w-4 h-4" />
                <span>Compare Metro, Bus & Cab Routes</span>
              </Link>
            </div>
          </div>

          {/* Contact and Location Specs */}
          <div className="p-5 rounded-3xl bg-card border border-border/60 space-y-3 text-xs">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Location Details
            </h4>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{place.address}</span>
            </div>
            {place.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-nizami-gold shrink-0" />
                <span>{place.phone}</span>
              </div>
            )}
            {place.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                <a
                  href={place.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-nizami-gold hover:underline truncate"
                >
                  Official Tourism Portal
                </a>
              </div>
            )}
          </div>

          {/* Data Integrity & Report Error Widget */}
          <div className="p-4 rounded-2xl bg-card/60 border border-border/40 space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Source: {place.source}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {new Date(place.last_updated).toLocaleDateString()}
              </span>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="w-full text-left pt-2 text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors flex items-center gap-1 border-t border-border/30"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Notice an inaccurate route or closed hours? Report correction</span>
            </button>
          </div>

          {/* Nearby In Same Area */}
          {nearbyPlaces.length > 0 && (
            <div className="p-5 rounded-3xl bg-card border border-border/60 space-y-3">
              <h4 className="font-serif font-bold text-sm text-foreground">
                Nearby in {place.neighbourhood.split('/')[0]}
              </h4>
              <div className="space-y-2">
                {nearbyPlaces.map((np) => (
                  <Link
                    key={np.id}
                    href={`/place/${np.slug}`}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-card/80 transition-colors group"
                  >
                    <img
                      src={np.cover_image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-semibold text-xs text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                        {np.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {np.entry_fee_inr === 0 ? 'Free' : `₹${np.entry_fee_inr}`} • ~{np.estimated_duration_mins}m
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif font-bold text-base text-foreground">
              Report Correction for {place.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Help fellow travelers keep accurate timetables and transport directions.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Issue Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground focus:outline-none"
                >
                  <option value="inaccurate_route">Inaccurate Route or Bus/Metro Stop</option>
                  <option value="wrong_hours">Changed Opening / Closing Hours</option>
                  <option value="place_correction">Updated Ticket Price / Fee</option>
                  <option value="other">Other Correction</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Description & Suggested Fix</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Describe the change (e.g. Entry fee is now ₹30, or the north gate is currently under restoration)..."
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none"
                  required
                />
              </div>

              {reportSubmitted ? (
                <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 font-semibold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Report submitted to admin for verification!</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-xl bg-card border border-border font-medium hover:bg-card/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                  >
                    Send Report
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
