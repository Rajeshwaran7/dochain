'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Calendar,
  Phone,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { useDoctorPatientsList } from '@/hooks/useApi';

const PAGE_SIZE = 8;

type SortKey = 'name' | 'lastVisit';

type PatientUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

type DoctorPatientApiItem = {
  patientId: string;
  lastVisitDate: string;
  visitCount: number;
  patient: { user?: PatientUser; bloodGroup?: string } | null;
};

function formatVisitDate(iso: string): string {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function PatientCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="animate-pulse">
        <div className="mb-4 flex gap-4">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-gray-100" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-5 w-2/5 rounded-lg bg-gray-100" />
            <div className="h-3 w-1/3 rounded bg-gray-50" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-gray-50" />
          <div className="h-3 w-4/5 rounded bg-gray-50" />
        </div>
      </div>
    </div>
  );
}

type PatientRowProps = {
  row: DoctorPatientApiItem;
};

function PatientRow({ row }: PatientRowProps) {
  const pat = row.patient;
  if (!pat) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
        <p className="text-sm text-gray-700">
          Profile unavailable for this patient ({row.patientId.slice(0, 8)}…).
        </p>
        <Link
          href={`/patients/${row.patientId}?tab=prescriptions`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700"
        >
          Open anyway <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const u = pat.user ?? {};
  const displayName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Patient';

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-violet-200/80 hover:shadow-md">
      <div className="flex gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-lg font-bold text-white shadow-sm shadow-violet-500/20">
          {(u.firstName?.[0] ?? '?').toUpperCase()}
          {(u.lastName?.[0] ?? '').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">{displayName}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 font-medium text-gray-700">
              <Calendar className="h-3 w-3 text-violet-500" aria-hidden />
              {row.visitCount} visit{row.visitCount !== 1 ? 's' : ''}
            </span>
            <span className="text-gray-400">·</span>
            <span>Last visit {formatVisitDate(row.lastVisitDate)}</span>
          </div>
        </div>
      </div>
      <div className="space-y-2 border-t border-gray-50 bg-gray-50/50 px-5 py-4">
        {u.email ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            <span className="truncate">{String(u.email)}</span>
          </div>
        ) : null}
        {u.phone ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            {String(u.phone)}
          </div>
        ) : null}
        {pat.bloodGroup ? (
          <p className="text-xs text-gray-500">
            Blood group <span className="font-medium text-gray-700">{String(pat.bloodGroup)}</span>
          </p>
        ) : null}
      </div>
      <Link
        href={`/patients/${row.patientId}?tab=prescriptions`}
        className="flex items-center justify-center gap-2 border-t border-gray-100 bg-white py-3.5 text-sm font-semibold text-violet-600 transition-colors hover:bg-violet-50/80"
      >
        Records & prescriptions
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </div>
  );
}

/** Doctor portal: patients from completed visits with server-side search, optional date filters, sort, pagination. */
export default function DoctorPatientsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastVisit');
  const [sortDirAsc, setSortDirAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFrom, dateTo, sortKey, sortDirAsc]);

  const queryParams = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy: sortKey === 'name' ? 'name' : 'last_visit',
      order: sortDirAsc ? 'asc' : 'desc',
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedSearch, dateFrom, dateTo, sortKey, sortDirAsc, page],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useDoctorPatientsList(queryParams);

  const items = (data?.items ?? []) as DoctorPatientApiItem[];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const searchPending = searchInput.trim() !== debouncedSearch;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const hasDateFilter = Boolean(dateFrom || dateTo);
  const hasSearchOrDates = Boolean(debouncedSearch || hasDateFilter);

  const clearSearchAndDates = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="min-h-[60vh] px-4 pb-12 pt-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Patients</h1>
              <p className="mt-1 max-w-xl text-sm text-gray-500">
                Everyone you&apos;ve seen from completed appointments.
              </p>
            </div>
            {!isLoading ? (
              <p className="text-sm font-medium tabular-nums text-gray-600">
                {total === 0 ? (
                  <span className="text-gray-400">No patients</span>
                ) : (
                  <>
                    <span className="text-violet-600">{total}</span> patient{total === 1 ? '' : 's'}
                  </>
                )}
              </p>
            ) : null}
          </div>
        </header>

        <div className="mb-8 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="patient-search">
                Search patients
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <input
                  id="patient-search"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="input w-full border-gray-200 py-3.5 pl-12 pr-11 text-base shadow-sm"
                  autoComplete="off"
                />
                {searchPending ? (
                  <Loader2
                    className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-violet-500"
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>
            <div className="flex gap-3 sm:w-auto">
              <div className="min-w-0 flex-1 sm:w-40">
                <label className="sr-only" htmlFor="sort-by">
                  Sort by
                </label>
                <select
                  id="sort-by"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="input py-3 text-sm text-gray-800 shadow-sm"
                >
                  <option value="lastVisit">Last visit</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div className="min-w-0 flex-1 sm:w-36">
                <label className="sr-only" htmlFor="sort-dir">
                  Order
                </label>
                <select
                  id="sort-dir"
                  value={sortDirAsc ? 'asc' : 'desc'}
                  onChange={(e) => setSortDirAsc(e.target.value === 'asc')}
                  className="input py-3 text-sm text-gray-800 shadow-sm"
                >
                  {sortKey === 'name' ? (
                    <>
                      <option value="asc">A to Z</option>
                      <option value="desc">Z to A</option>
                    </>
                  ) : (
                    <>
                      <option value="desc">Newest first</option>
                      <option value="asc">Oldest first</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-sm">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50/80 sm:px-5"
              aria-expanded={filtersOpen}
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-900">Filter by visit dates</span>
                  <span className="block text-xs text-gray-500">
                    Optional — narrow the list to visits between two dates.
                  </span>
                </span>
                {hasDateFilter ? (
                  <span className="ml-1.5 h-2 w-2 rounded-full bg-violet-500" title="Dates filter active" />
                ) : null}
              </span>
              <ChevronDown
                className={clsx(
                  'h-5 w-5 shrink-0 text-gray-400 transition-transform',
                  filtersOpen ? 'rotate-180' : '',
                )}
                aria-hidden
              />
            </button>
            {filtersOpen ? (
              <div className="border-t border-gray-100 px-4 pb-5 pt-2 sm:px-5">
                <p className="mb-4 text-xs leading-relaxed text-gray-500">
                  Only completed visits within this range are counted. Leave blank to show all patients.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1 sm:max-w-xs">
                    <label className="label text-xs text-gray-600" htmlFor="date-from">
                      From
                    </label>
                    <input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="input py-2.5 text-sm shadow-sm"
                    />
                  </div>
                  <div className="flex-1 sm:max-w-xs">
                    <label className="label text-xs text-gray-600" htmlFor="date-to">
                      To
                    </label>
                    <input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="input py-2.5 text-sm shadow-sm"
                    />
                  </div>
                  {hasDateFilter ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 sm:mb-0.5"
                    >
                      <X className="h-4 w-4" aria-hidden />
                      Clear dates
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {hasSearchOrDates ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                {[
                  hasDateFilter &&
                    `Visits${dateFrom ? ` from ${dateFrom}` : ''}${dateTo ? ` to ${dateTo}` : ''}`,
                  debouncedSearch && 'Search applied',
                ]
                  .filter(Boolean)
                  .join(' · ')}
                .
              </p>
              <button
                type="button"
                onClick={clearSearchAndDates}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                Clear search and dates
              </button>
            </div>
          ) : null}
        </div>

        {isError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-10 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" aria-hidden />
            <p className="text-sm font-medium text-gray-900">Couldn&apos;t load patients</p>
            <p className="mt-1 text-xs text-gray-600">
              {error instanceof Error ? error.message : 'Something went wrong.'}
            </p>
            <button type="button" onClick={() => void refetch()} className="btn-primary mt-5 text-sm">
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <PatientCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50">
              <Users className="h-7 w-7 text-gray-400" aria-hidden />
            </div>
            <p className="text-sm font-medium text-gray-800">
              {hasSearchOrDates ? 'No matches for your search or dates' : 'No patients yet'}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
              {hasSearchOrDates
                ? 'Try a different search or clear filters to see everyone.'
                : 'Complete appointments to build your list here.'}
            </p>
            <Link
              href="/appointments"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              Go to appointments
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <div
            className={clsx('transition-opacity', isFetching && !isLoading && 'opacity-90')}
            aria-busy={isFetching}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {items.map((row) => (
                <PatientRow key={row.patientId} row={row} />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav
                className="mt-10 flex flex-wrap items-center justify-center gap-2"
                aria-label="Pagination"
              >
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Previous
                </button>
                <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium tabular-nums text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </nav>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
