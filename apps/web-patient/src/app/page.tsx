'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Stethoscope, Calendar, Star, Shield, ArrowRight, MapPin, Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchName) params.set('name', searchName);
    if (searchCity) params.set('city', searchCity);
    router.push(`/doctors${params.toString() ? `?${params.toString()}` : ''}`);
  };
  const specializations = [
    { name: 'General Physician', icon: '🩺', count: '120+' },
    { name: 'Cardiologist',      icon: '❤️',  count: '45+' },
    { name: 'Dermatologist',     icon: '✨',  count: '60+' },
    { name: 'Pediatrician',      icon: '👶',  count: '80+' },
    { name: 'Orthopedic',        icon: '🦴',  count: '35+' },
    { name: 'Neurologist',       icon: '🧠',  count: '28+' },
    { name: 'Gynecologist',      icon: '🌸',  count: '50+' },
    { name: 'ENT Specialist',    icon: '👂',  count: '40+' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="glass sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold text-cyan-600 tracking-tight">
            Dochain
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="btn-ghost text-sm">
                  Hi, {user?.firstName ?? 'User'}
                </Link>
                <Link href="/dashboard" className="btn-primary text-sm">Dashboard</Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm">Sign in</Link>
                <Link href="/auth/register" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-100/40 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center animate-in">
          <div className="badge badge-blue mb-6 mx-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            India&apos;s Hyperlocal Doctor Network
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6">
            Find the right doctor,
            <span className="text-cyan-600"> book instantly</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10">
            Connect with verified specialists in your city. Real-time availability,
            instant confirmation, zero waiting.
          </p>

          {/* Quick search */}
          <div className="card p-3 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="flex-1 flex items-center gap-3 input">
              <Search className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-transparent outline-none w-full text-gray-800 placeholder-gray-500 text-sm"
                placeholder="Specialization or doctor name…"
              />
            </div>
            <div className="flex items-center gap-3 input sm:w-44">
              <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-transparent outline-none w-full text-gray-800 placeholder-gray-500 text-sm"
                placeholder="City"
              />
            </div>
            <button onClick={handleSearch} className="btn-primary shrink-0 flex items-center gap-2">
              Search <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 bg-gray-100/60">
        <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '500+', label: 'Verified Doctors' },
            { value: '10K+', label: 'Appointments Booked' },
            { value: '50+', label: 'Cities Covered' },
            { value: '4.8★', label: 'Average Rating' },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl font-bold text-cyan-600">{s.value}</div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Specializations */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Browse by Specialization</h2>
          <Link href="/doctors" className="text-cyan-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {specializations.map((s) => (
            <Link
              key={s.name}
              href={`/doctors?specialization=${encodeURIComponent(s.name)}`}
              className="card-hover p-5 text-center group"
            >
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="font-medium text-gray-800 text-sm group-hover:text-cyan-700 transition-colors">
                {s.name}
              </div>
              <div className="text-gray-500 text-xs mt-1">{s.count} doctors</div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-100/50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="section-title text-center mb-12">How Dochain works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-6 h-6 text-cyan-600" />,
                step: '01',
                title: 'Search & filter',
                desc: 'Find doctors by specialization, city, or name with real-time filters.',
              },
              {
                icon: <Calendar className="w-6 h-6 text-cyan-600" />,
                step: '02',
                title: 'Pick a slot',
                desc: 'See live availability and choose a time that works for you.',
              },
              {
                icon: <Stethoscope className="w-6 h-6 text-cyan-600" />,
                step: '03',
                title: 'Get confirmed',
                desc: 'Instant booking confirmation via email and SMS reminder.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="font-display text-6xl font-black text-gray-100 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative card p-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="section-title text-center mb-12">Why patients choose Dochain</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { icon: <Shield className="w-5 h-5 text-emerald-600" />, title: 'Verified Doctors', desc: 'All doctors are verified with valid medical registration numbers.' },
            { icon: <Star className="w-5 h-5 text-amber-600" />, title: 'Genuine Reviews', desc: 'Only patients who completed an appointment can leave reviews.' },
            { icon: <Calendar className="w-5 h-5 text-cyan-600" />, title: 'Real-time Slots', desc: 'See live availability — no double bookings, ever.' },
            { icon: <Stethoscope className="w-5 h-5 text-violet-600" />, title: 'Multi-specialty', desc: 'General physicians to niche specialists — 50+ specializations.' },
          ].map((f) => (
            <div key={f.title} className="card p-5 flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <div>
                <div className="font-semibold text-gray-800 mb-1">{f.title}</div>
                <div className="text-gray-500 text-sm">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 pb-24 text-center">
        <div className="card p-10">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">
            Ready to find your doctor?
          </h2>
          <p className="text-gray-500 mb-8">Join thousands of patients who trust Dochain.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Link href="/doctors" className="btn-primary">Find a Doctor</Link>
            ) : (
              <Link href="/auth/register" className="btn-primary">Create free account</Link>
            )}
            <Link href="/doctors" className="btn-secondary">Browse doctors</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Dochain. All rights reserved.
      </footer>
    </main>
  );
}
