"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface EventVersion {
  key: string;
  version: string;
  title: string;
  description: string;
  createdAt: string;
}

interface EventEntry {
  key: string;
  title: string;
  description: string;
  versions: EventVersion[];
  latestVersion: string;
}

interface EventRegistry {
  events: EventEntry[];
  lastUpdated: string;
}

export default function HomePage() {
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/web-automation/registry.json`)
      .then((res) => res.json())
      .then((data: EventRegistry) => {
        setEvents(data.events);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-2 text-gray-400">AI-generated web pages from Jira ticket webhooks</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 text-gray-400">AI-generated web pages from Jira ticket webhooks</p>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 py-20">
          <div className="mb-4 text-5xl">🚀</div>
          <h2 className="text-xl font-semibold text-gray-300">No events yet</h2>
          <p className="mt-2 max-w-md text-center text-gray-500">
            Trigger a Jira webhook to generate your first AI-powered web page.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.key}
              href={`/event?key=${event.key}`}
              className="group rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-700 hover:bg-gray-900/80"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-md bg-indigo-600/20 px-2.5 py-1 text-xs font-medium text-indigo-400">
                  {event.key}
                </span>
                <span className="text-xs text-gray-500">
                  {event.versions.length} version{event.versions.length !== 1 ? "s" : ""}
                </span>
              </div>
              <h3 className="mb-2 font-semibold text-white transition group-hover:text-indigo-400">
                {event.title}
              </h3>
              <p className="line-clamp-2 text-sm text-gray-400">{event.description}</p>
              {event.latestVersion && (
                <div className="mt-4 text-xs text-gray-500">Latest: {event.latestVersion}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
