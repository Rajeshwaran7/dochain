/**
 * Returns the pathname without the Next.js `basePath` (e.g. `/doctor`).
 */
export function getAppPath(pathname: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (base && pathname.startsWith(base)) {
    const rest = pathname.slice(base.length);
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return pathname || '/';
}
