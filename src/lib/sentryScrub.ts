// Cleans an error report before it leaves the browser/server so personal
// details never reach Sentry: no cookies, request bodies, query strings or
// email addresses.
import type { ErrorEvent } from "@sentry/nextjs";

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const hideEmails = (text?: string) =>
  typeof text === "string" ? text.replace(EMAIL, "[email]") : text;

const stripQuery = (data?: Record<string, unknown>) => {
  if (!data) return;
  for (const key of ["url.query", "http.query"]) delete data[key];
  for (const key of ["url", "url.full", "http.url", "to", "from"]) {
    const value = data[key];
    if (typeof value === "string") data[key] = value.split("?")[0];
  }
};

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.Authorization;
      delete event.request.headers.cookie;
      delete event.request.headers.Cookie;
    }
    if (event.request.url) event.request.url = event.request.url.split("?")[0];
  }

  if (event.message) event.message = hideEmails(event.message);
  for (const exception of event.exception?.values ?? []) {
    exception.value = hideEmails(exception.value);
  }
  for (const crumb of event.breadcrumbs ?? []) {
    crumb.message = hideEmails(crumb.message);
    stripQuery(crumb.data);
  }
  return event;
}
