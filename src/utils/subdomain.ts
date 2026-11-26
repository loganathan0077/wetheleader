/**
 * Subdomain and Host Routing Utility
 * Handles clean separation between the public website (www.wetheleader.online)
 * and the dedicated administrative portal (admin.wetheleader.online).
 */

export const ADMIN_SUBDOMAIN = 'admin.wetheleader.online';
export const PUBLIC_DOMAIN = 'www.wetheleader.online';
export const APEX_DOMAIN = 'wetheleader.online';

/**
 * Checks whether the current window location corresponds to the admin subdomain.
 *
 * Supported environments:
 * 1. Production: admin.wetheleader.online
 * 2. Wildcard subdomains: admin.* (e.g., admin.localhost, admin-preview.vercel.app)
 * 3. Path-based check: /admin or /admin/*
 * 4. Query param override (useful for local development/testing): ?subdomain=admin or ?admin=true
 * 5. Hash override: #admin or #admin/*
 */
export function isAdminHost(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname.toLowerCase();

  // 1. Direct subdomain match (e.g., admin.wetheleader.online, admin.localhost)
  if (hostname.startsWith('admin.') || hostname === 'admin') {
    return true;
  }

  // 2. Query param override for dev testing
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('subdomain') === 'admin' || searchParams.has('admin')) {
    return true;
  }

  // 3. Path-based fallback
  const pathname = window.location.pathname.toLowerCase();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return true;
  }

  // 4. Hash-based fallback
  const hash = window.location.hash.toLowerCase();
  if (hash === '#admin' || hash.startsWith('#admin/')) {
    return true;
  }

  // 5. Dedicated local admin port (e.g. http://localhost:3001)
  if (window.location.port === '3001') {
    return true;
  }

  return false;
}

/**
 * Returns the canonical URL for the public website.
 */
export function getPublicSiteUrl(): string {
  if (typeof window === 'undefined') return `https://${PUBLIC_DOMAIN}`;

  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('wetheleader.online')) {
    return `https://${PUBLIC_DOMAIN}`;
  }

  // Local development / preview
  if (window.location.port === '3001') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  if (hostname.startsWith('admin.')) {
    const publicHost = window.location.host.replace(/^admin\./, '');
    return `${window.location.protocol}//${publicHost}`;
  }

  return `${window.location.protocol}//${window.location.host}`;
}

/**
 * Returns the canonical URL for the admin portal.
 */
export function getAdminPortalUrl(): string {
  if (typeof window === 'undefined') return `https://${ADMIN_SUBDOMAIN}`;

  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('wetheleader.online')) {
    return `https://${ADMIN_SUBDOMAIN}`;
  }

  // Local development: use ?subdomain=admin
  const base = `${window.location.protocol}//${window.location.host}`;
  return `${base}/?subdomain=admin`;
}
