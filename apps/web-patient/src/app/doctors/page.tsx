'use client';
import { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, Star, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useDoctors, useSpecializations, useCities } from '@/hooks/useApi';
import { debounce } from '@/lib/utils';

function DoctorCard({ doctor }: { doctor: any }) {
  const doc = doctor;
  const user = doc.user || {};
  const profilePhoto = doc.profileImage ?? user.avatar;
  return (
    <Link
      href={`/doctors/${doc.id}`}
      className="card-hover p-4 sm:p-5 flex gap-3 sm:gap-4 group min-w-0 overflow-hidden"
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {profilePhoto
          ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
          : <span className="font-display font-bold text-lg sm:text-xl text-cyan-600">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
        }
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-cyan-700 transition-colors text-sm sm:text-base break-words">
              Dr. {user.firstName} {user.lastName}
            </h3>
            <p className="text-cyan-600 text-xs sm:text-sm mt-0.5 break-words">{doc.specialization}</p>
          </div>
          {doc.isFeatured && (
            <span className="badge badge-yellow shrink-0 text-[10px] sm:text-xs">Featured</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs sm:text-sm text-gray-600">
          {doc.experienceYears > 0 && <span className="shrink-0">{doc.experienceYears} yrs exp.</span>}
          {doc.city && (
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{doc.city}</span>
            </span>
          )}
          {doc.averageRating > 0 && (
            <span className="flex items-center gap-1 text-amber-600 shrink-0">
              <Star className="w-3 h-3 fill-current" /> {Number(doc.averageRating).toFixed(1)}
              <span className="text-gray-600">({doc.totalReviews})</span>
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-3">
          <span className="font-medium text-red-600 text-sm">
            Closing soon!!
            <span className="text-gray-600 font-normal text-xs"> / visit</span>
          </span>
          <span className="text-cyan-600 text-sm flex items-center gap-1 shrink-0">
            Book <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function DoctorsPageContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    specialization: searchParams.get('specialization') ?? '',
    city: searchParams.get('city') ?? '',
    name: searchParams.get('name') ?? '',
    page: 1,
    limit: 12,
  });

  const [nameInput, setNameInput] = useState(filters.name);
  const [cityInput, setCityInput] = useState(filters.city);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useDoctors(filters);
  const { data: specs = [] } = useSpecializations();
  const { data: cities = [] } = useCities();

  const debouncedSetFilter = useMemo(
    () => debounce((key: string, value: string) => {
      setFilters((f) => ({ ...f, [key]: value, page: 1 }));
    }, 400),
    []
  );

  const clearFilters = () => {
    setFilters({ specialization: '', city: '', name: '', page: 1, limit: 12 });
    setNameInput('');
    setCityInput('');
  };

  const doctors = data?.data || [];
  const total   = data?.total || 0;
  const pages   = data?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Top bar — stack on small screens so search/city are usable */}
      <div className="glass sticky top-0 z-40 border-b border-gray-200 px-3 sm:px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
          <div className="flex items-center justify-between gap-2 md:justify-start md:shrink-0">
            <Link href="/" className="font-display font-bold text-cyan-600 text-lg truncate">
              Dochain
            </Link>
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="md:hidden btn-secondary p-2.5 shrink-0"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 input flex-1 min-w-0 py-2.5 md:max-w-md">
              <Search className="w-4 h-4 text-gray-600 shrink-0" />
              <input
                value={nameInput}
                onChange={(e) => { setNameInput(e.target.value); debouncedSetFilter('name', e.target.value); }}
                className="bg-transparent outline-none w-full min-w-0 text-sm placeholder-gray-500"
                placeholder="Search doctors…"
              />
            </div>
            <div className="flex items-center gap-2 input w-full sm:w-40 md:w-44 shrink-0 py-2.5">
              <MapPin className="w-4 h-4 text-gray-600 shrink-0" />
              <input
                value={cityInput}
                onChange={(e) => { setCityInput(e.target.value); debouncedSetFilter('city', e.target.value); }}
                list="cities-list"
                className="bg-transparent outline-none w-full min-w-0 text-sm placeholder-gray-500"
                placeholder="City"
              />
              <datalist id="cities-list">
                {cities.map((c: string) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 flex gap-6">
        {/* Sidebar filters */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="card p-5 sticky top-20">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </h3>
            <div className="mb-5">
              <label className="label text-xs uppercase tracking-wide">Specialization</label>
              <select
                value={filters.specialization}
                onChange={(e) => setFilters((f) => ({ ...f, specialization: e.target.value, page: 1 }))}
                className="select"
              >
                <option value="">All specializations</option>
                {specs.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs uppercase tracking-wide">City</label>
              <select
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value, page: 1 }))}
                className="select"
              >
                <option value="">All cities</option>
                {cities.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {(filters.specialization || filters.city || filters.name) && (
              <button
                onClick={clearFilters}
                className="btn-ghost w-full text-sm mt-4 text-red-600 hover:text-red-700"
              >
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-sm">
              {isLoading ? 'Searching…' : `${total} doctor${total !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading doctors…
            </div>
          ) : doctors.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold text-gray-900 mb-1">No doctors found</h3>
              <p className="text-gray-600 text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {doctors.map((doc: any) => <DoctorCard key={doc.id} doctor={doc} />)}
              </div>

              {pages > 1 && (
                <div className="flex flex-wrap justify-center gap-2 mt-8 px-1 max-w-full">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilters((f) => ({ ...f, page: p }))}
                      className={p === filters.page
                        ? 'w-9 h-9 rounded-lg bg-cyan-600 text-white font-semibold text-sm'
                        : 'w-9 h-9 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200'}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      {showFilters && (
        <div
          className="fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setShowFilters(false)}
          role="presentation"
        >
          <div
            className="absolute bottom-0 left-0 right-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-5 pb-3 sm:px-6 shrink-0 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="p-2 -mr-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 min-h-0">
              <div className="space-y-4">
                <div>
                  <label className="label text-xs uppercase tracking-wide">Specialization</label>
                  <select
                    value={filters.specialization}
                    onChange={(e) => setFilters((f) => ({ ...f, specialization: e.target.value, page: 1 }))}
                    className="select select-lg w-full"
                  >
                    <option value="">All specializations</option>
                    {specs.map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs uppercase tracking-wide">City</label>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value, page: 1 }))}
                    className="select select-lg w-full"
                  >
                    <option value="">All cities</option>
                    {cities.map((c: string) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="safe-area-bottom flex shrink-0 flex-col gap-2 border-t border-gray-100 bg-white px-4 pb-4 pt-3 sm:flex-row sm:gap-3 sm:px-6 sm:pb-5">
              <button
                type="button"
                onClick={() => { clearFilters(); setShowFilters(false); }}
                className="btn-secondary flex w-full min-h-[48px] items-center justify-center px-4 sm:flex-1"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="btn-primary flex w-full min-h-[48px] items-center justify-center px-4 sm:flex-1"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <DoctorsPageContent />
    </Suspense>
  );
}
