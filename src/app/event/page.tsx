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

export default function EventIndexPage() {
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
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
        >
          &larr; Back to Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">All Events</h1>
        <p className="mt-2 text-gray-400">Browse all AI-generated event pages</p>
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500">No events found.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link
              key={event.key}
              href={`/event/${event.key.toLowerCase()}`}
              className="group flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-6 py-4 transition hover:border-gray-700"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-indigo-600/20 px-2.5 py-1 text-xs font-medium text-indigo-400">
                    {event.key}
                  </span>
                  <span className="text-xs text-gray-500">
                    {event.versions.length} version{event.versions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-white transition group-hover:text-indigo-400">
                  {event.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-sm text-gray-400">{event.description}</p>
              </div>
              <span className="text-sm text-gray-500 transition group-hover:text-gray-300">
                View &rarr;
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
