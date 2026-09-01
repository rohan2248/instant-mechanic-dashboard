"use client"

import { ApiErrorState } from "@/components/shared/api-error-state"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ApiErrorState error={error} reset={reset} />
}
