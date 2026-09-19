import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.png, apple-touch-icon.png
     * - logos (public logo images)
     * - icons (PWA icon images)
     * - manifest.webmanifest (PWA manifest)
     * - sw.js (Service Worker)
     * - offline (Offline fallback page)
     */
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|apple-touch-icon.png|logos/.*|icons/.*|manifest.webmanifest|sw.js|offline).*)",
  ],
};
