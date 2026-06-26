// components/jobs/JobCard.tsx
"use client"

import { useState } from "react"
import type { AdzunaJob } from "@/lib/adzuna"

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30)  return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  if (max) return `Up to ${fmt(max)}`
  return null
}

export function JobCard({ job }: { job: AdzunaJob }) {
  const [saved,    setSaved]    = useState(false)
  const [expanded, setExpanded] = useState(false)

  const initials = job.company
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const salary = formatSalary(job.salary_min, job.salary_max)

  // Truncate description to 160 chars unless expanded
  const shortDesc = job.description.length > 160
    ? job.description.slice(0, 160).trimEnd() + "…"
    : job.description

  const href = job.apply_url === "#" ? `/jobs/${job.id}` : job.apply_url

  return (
    <article className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200">
      <div className="flex items-start gap-4">

        {/* Company logo / initials */}
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm shrink-0 select-none">
          {initials}
        </div>

        <div className="flex-1 min-w-0">

          {/* Top row: title + save button */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-[15px] leading-snug truncate">
                {job.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {job.company}
                {job.location ? ` · ${job.location}` : ""}
              </p>
            </div>
            <button
              onClick={() => setSaved(!saved)}
              aria-label={saved ? "Unsave job" : "Save job"}
              className={`shrink-0 text-xl transition-colors ${
                saved
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-300 dark:text-gray-600 hover:text-blue-500"
              }`}
            >
              {saved ? "♥" : "♡"}
            </button>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
              {job.job_type}
            </span>
            {job.is_remote && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium border border-green-100 dark:border-green-800">
                Remote
              </span>
            )}
            {salary && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {salary}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-600 ml-auto shrink-0">
              {timeAgo(job.posted_at)}
            </span>
          </div>

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {expanded ? job.description : shortDesc}
              </p>
              {job.description.length > 160 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-5 py-2 rounded-xl transition-colors"
            >
              Apply now
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <button
              onClick={() => setSaved(!saved)}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {saved ? "Saved ✓" : "Save"}
            </button>
          </div>

        </div>
      </div>
    </article>
  )
}
