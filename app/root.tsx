import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import stylesheet from "~/styles/globals.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  {
    rel: "preconnect",
    href: "https://fonts.googleapis.com",
  },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Lexend:wght@100..900&display=swap",
  },
];

export const meta: MetaFunction = () => [
  { charset: "utf-8" },
  { title: "GrowPlate - Multi-Tenant Restaurant Management" },
  { viewport: "width=device-width,initial-scale=1" },
  {
    name: "description",
    content: "Modern restaurant management platform with multi-tenant support",
  },
];

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-neutral-50 text-neutral-900">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}