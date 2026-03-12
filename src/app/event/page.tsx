"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

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

function EventPageContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const version = searchParams.get("version");

  const [registry, setRegistry] = useState<EventRegistry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/web-automation/registry.json`)
      .then((res) => res.json())
      .then((data: EventRegistry) => {
        setRegistry(data);
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

  if (!registry || !key) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold text-gray-300">Event not found</h2>
        <Link href="/" className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const event = registry.events.find((e) => e.key === key);
  if (!event) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold text-gray-300">Event &quot;{key}&quot; not found</h2>
        <Link href="/" className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  if (version) {
    const isLatest = version === "latest";
    const resolvedVersion = isLatest ? event.latestVersion : version;
    const eventVersion = event.versions.find((v) => v.version === resolvedVersion);

    if (!eventVersion) {
      return (
        <div className="py-20 text-center">
          <h2 className="text-xl font-semibold text-gray-300">Version &quot;{version}&quot; not found</h2>
          <Link
            href={`/event?key=${key}`}
            className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300"
          >
            &larr; Back to {key}
          </Link>
        </div>
      );
    }

    const previewPath = `/web-automation/preview/${key}/${eventVersion.version}/index.html`;

    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/event?key=${key}`}
              className="text-sm text-gray-400 transition hover:text-white"
            >
              &larr; {event.key}
            </Link>
            <span className="text-gray-600">/</span>
            <span className="font-mono text-sm text-gray-300">{resolvedVersion}</span>
            {isLatest && (
              <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs font-medium text-green-400">
                latest
              </span>
            )}
          </div>
          <a
            href={previewPath}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-400 transition hover:border-gray-500 hover:text-white"
          >
            Open in new tab &nearr;
          </a>
        </div>
        <div className="flex-1 overflow-hidden rounded-xl border border-gray-800">
          <iframe
            src={previewPath}
            className="h-full w-full border-0 bg-white"
            title={`${event.key} - ${resolvedVersion}`}
          />
        </div>
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
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-md bg-indigo-600/20 px-3 py-1.5 text-sm font-medium text-indigo-400">
            {event.key}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-white">{event.title}</h1>
        <p className="mt-2 text-gray-400">{event.description}</p>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-300">Versions</h2>

      {event.versions.length === 0 ? (
        <p className="text-gray-500">No versions found.</p>
      ) : (
        <div className="space-y-3">
          {[...event.versions].reverse().map((v) => (
            <Link
              key={v.version}
              href={`/event?key=${key}&version=${v.version}`}
              className="group flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-6 py-4 transition hover:border-gray-700"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-gray-300">{v.version}</span>
                {v.version === event.latestVersion && (
                  <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs font-medium text-green-400">
                    latest
                  </span>
                )}
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

export default function EventPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-500" />
        </div>
      }
    >
      <EventPageContent />
    </Suspense>
  );
}
