"use client"

import * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { useTableParams } from "@/components/data-table/use-table-params"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

/**
 * Debounced search that writes `?q=` — the API's own param name.
 *
 * The input keeps its own value so typing stays responsive while the URL
 * lags behind by the debounce. It re-syncs when the URL changes from
 * elsewhere (a reset button, the back button) but never while focused, which
 * would otherwise yank characters out from under the user mid-word.
 */
export function SearchInput({
  placeholder = "Search…",
  delay = 350,
}: {
  placeholder?: string
  delay?: number
}) {
  const { searchParams, setParams } = useTableParams()
  const urlValue = searchParams.get("q") ?? ""

  const [value, setValue] = React.useState(urlValue)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (document.activeElement !== inputRef.current) setValue(urlValue)
  }, [urlValue])

  React.useEffect(() => {
    if (value === urlValue) return
    const id = window.setTimeout(() => setParams({ q: value || null }), delay)
    return () => window.clearTimeout(id)
  }, [value, urlValue, delay, setParams])

  return (
    <InputGroup className="w-full sm:w-72">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        aria-label={placeholder}
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => {
              setValue("")
              setParams({ q: null })
            }}
          >
            <XIcon />
          </Button>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}
