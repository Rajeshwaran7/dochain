import Image from 'next/image';
import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';

/** Stock imagery URLs (Unsplash) — replace with your own assets in `public/` for production branding. */
const SHOWCASE_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80',
    alt: 'Doctor consulting with a patient in a bright clinic',
    caption: 'Consultations you can trust',
    span: 'lg:col-span-2 lg:row-span-2',
    aspect: 'min-h-[280px] sm:min-h-[340px] lg:min-h-0 lg:h-full',
  },
  {
    src: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
    alt: 'Smiling doctor in a white coat with a stethoscope',
    caption: 'Verified specialists',
    span: 'lg:col-span-2',
    aspect: 'aspect-[16/10] sm:aspect-[2/1]',
  },
  {
    src: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=80',
    alt: 'Patient and caregiver during a friendly visit',
    caption: 'Care that feels human',
    span: 'lg:col-span-2',
    aspect: 'aspect-[16/10] sm:aspect-[2/1]',
  },
  {
    src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    alt: 'Family with a child at a health check',
    caption: 'Families welcome',
    span: 'lg:col-span-4',
    aspect: 'aspect-[21/9] sm:aspect-[3/1]',
  },
] as const;

/**
 * Promotional image grid for the landing page — highlights doctor–patient trust and care.
 */
export function ShowcaseGallery() {
  return (
    <section className="relative overflow-hidden border-y border-gray-200 bg-gradient-to-b from-white to-cyan-50/30">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
        <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="absolute -left-16 bottom-10 h-56 w-56 rounded-full bg-teal-200/40 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-cyan-800 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-cyan-600" aria-hidden />
              Trusted care near you
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Real doctors. Real patients.{' '}
              <span className="text-cyan-600">Real outcomes.</span>
            </h2>
            <p className="mt-3 max-w-xl text-gray-600">
              From everyday check-ups to specialist visits — see how Dochain connects people with
              verified doctors in their neighbourhood.
            </p>
          </div>
          <Link
            href="/doctors"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-800 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 sm:self-auto"
          >
            <Heart className="h-4 w-4 text-cyan-600" aria-hidden />
            Find a doctor
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto] lg:gap-5">
          {SHOWCASE_IMAGES.map((item) => (
            <figure
              key={item.src}
              className={`group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-gray-100 shadow-sm ${item.span}`}
            >
              <div className={`relative h-full w-full ${item.aspect}`}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/10 to-transparent" />
                <figcaption className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <p className="font-medium text-white drop-shadow-sm">{item.caption}</p>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Photos are for illustration. Doctor listings on Dochain are verified for registration and
          clinic details.
        </p>
      </div>
    </section>
  );
}
