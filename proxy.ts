import { NextResponse, NextRequest } from 'next/server'
import {
    convexAuthNextjsMiddleware,
    createRouteMatcher,
    nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/signin"]);

// Add unprotected routes here
const isUnprotected = createRouteMatcher(["/", "/signin"]);

export const proxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
    if (isSignInPage(request) && (await convexAuth.isAuthenticated())) {
        console.log("user is authenticated")
        return nextjsMiddlewareRedirect(request, "/home");
    }
    if (!isUnprotected(request) && !(await convexAuth.isAuthenticated())) {
        return nextjsMiddlewareRedirect(request, "/signin");
    }
});

export const config = {
    // The following matcher runs middleware on all routes
    // except static assets.
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};