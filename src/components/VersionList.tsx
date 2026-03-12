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

interface VersionListProps {
  eventKey: string;
}

export default function VersionList({ eventKey }: VersionListProps) {
  const [event, setEvent] = useState<EventEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/web-automation/registry.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch registry");
        return res.json();
      })
      .then((data: EventRegistry) => {
        const foundEvent = data.events.find(
          (e) => e.key.toLowerCase() === eventKey.toLowerCase()
        );
        if (foundEvent) {
          setEvent(foundEvent);
        } else {
          setError("Event not found");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [eventKey]);

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="h-8 w-48 animate-pulse rounded-md bg-gray-800 mt-3"></div>
          <div className="h-4 w-96 animate-pulse rounded-md bg-gray-800 mt-2"></div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-500" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div>
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 py-20">
          <div className="mb-4 text-5xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-300">Event not found</h2>
          <p className="mt-2 max-w-md text-center text-gray-500">
            {error || `Could not find event with key: ${eventKey}`}
          </p>
        </div>
      </div>
    );
  }

  const sortedVersions = [...event.versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatVersion = (version: string) => {
    return version.replace("_", " ").replace(/-/g, (match, offset) => {
      if (offset > 10) return ":";
      return match;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div>
      <div className="mb-10">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
        >
          &larr; Back to Dashboard
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-white">{event.title}</h1>
          <span className="rounded-md bg-indigo-600/20 px-2.5 py-1 text-xs font-medium text-indigo-400">
            {event.key}
          </span>
        </div>
        <p className="mt-3 text-gray-400 max-w-3xl">{event.description}</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Versions</h2>
        <span className="text-sm text-gray-500">
          {sortedVersions.length} version{sortedVersions.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedVersions.map((version) => {
          const isLatest = version.version === event.latestVersion;
          
          return (
            <Link
              key={version.version}
              href={`/event/${event.key.toLowerCase()}/${version.version}/`}
              className="group relative flex flex-col justify-between rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-700 hover:bg-gray-900/80"
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-mono text-sm font-medium text-gray-300 transition group-hover:text-indigo-400">
                    {formatVersion(version.version)}
                  </div>
                  {isLatest && (
                    <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
                      Latest
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Created: {formatDate(version.createdAt)}
                </div>
              </div>
              
              <div className="mt-6 flex items-center text-sm font-medium text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
                View Version &rarr;
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
