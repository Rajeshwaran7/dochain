'use client';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, Star, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useDoctors, useSpecializations, useCities } from '@/hooks/useApi';
import { debounce } from '@/lib/utils';

function DoctorCard({ doctor }: { doctor: any }) {
  const doc = doctor;
  const user = doc.user || {};
  return (
    <Link href={`/doctors/${doc.id}`} className="card-hover p-5 flex gap-4 group">
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {user.avatar
          ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          : <span className="font-display font-bold text-xl text-cyan-600">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-cyan-700 transition-colors">
              Dr. {user.firstName} {user.lastName}
            </h3>
            <p className="text-cyan-600 text-sm">{doc.specialization}</p>
          </div>
          {doc.isFeatured && (
            <span className="badge badge-yellow shrink-0">Featured</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
          {doc.experienceYears > 0 && <span>{doc.experienceYears} yrs exp.</span>}
          {doc.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {doc.city}
            </span>
          )}
          {doc.averageRating > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <Star className="w-3 h-3 fill-current" /> {Number(doc.averageRating).toFixed(1)}
              <span className="text-gray-600">({doc.totalReviews})</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="font-medium text-red-600">
            Hurry up!!
            <span className="text-gray-600 font-normal text-xs"> / visit</span>
          </span>
          <span className="text-cyan-600 text-sm flex items-center gap-1">
            Book <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DoctorsPage() {
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
      {/* Top bar */}
      <div className="glass sticky top-0 z-40 border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/" className="font-display font-bold text-cyan-600 text-lg mr-2">Dochain</Link>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex items-center gap-2 input flex-1 max-w-sm py-2">
              <Search className="w-4 h-4 text-gray-600 shrink-0" />
              <input
                value={nameInput}
                onChange={(e) => { setNameInput(e.target.value); debouncedSetFilter('name', e.target.value); }}
                className="bg-transparent outline-none w-full text-sm placeholder-gray-500"
                placeholder="Search doctors…"
              />
            </div>
            <div className="flex items-center gap-2 input w-36 py-2">
              <MapPin className="w-4 h-4 text-gray-600 shrink-0" />
              <input
                value={cityInput}
                onChange={(e) => { setCityInput(e.target.value); debouncedSetFilter('city', e.target.value); }}
                list="cities-list"
                className="bg-transparent outline-none w-full text-sm placeholder-gray-500"
                placeholder="City"
              />
              <datalist id="cities-list">
                {cities.map((c: string) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <button onClick={() => setShowFilters(true)} className="md:hidden btn-secondary p-2.5">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
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
                className="input text-sm py-2"
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
                className="input text-sm py-2"
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
              <div className="grid sm:grid-cols-2 gap-4">
                {doctors.map((doc: any) => <DoctorCard key={doc.id} doctor={doc} />)}
              </div>

              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
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
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 md:hidden" onClick={() => setShowFilters(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-900">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label text-xs uppercase tracking-wide">Specialization</label>
                <select
                  value={filters.specialization}
                  onChange={(e) => setFilters((f) => ({ ...f, specialization: e.target.value, page: 1 }))}
                  className="input text-sm py-2"
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
                  className="input text-sm py-2"
                >
                  <option value="">All cities</option>
                  {cities.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { clearFilters(); setShowFilters(false); }} className="btn-secondary flex-1">Clear</button>
              <button onClick={() => setShowFilters(false)} className="btn-primary flex-1">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
