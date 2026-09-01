"use client"

import { CheckIcon, PlusCircleIcon } from "lucide-react"

import { useTableParams } from "@/components/data-table/use-table-params"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type FacetOption = {
  label: string
  value: string
}

/**
 * Multi-select filter backed by a URL param.
 *
 * Values are written as CSV, which is one of the two shapes the API already
 * accepts for `status`, so no translation is needed on either side.
 */
export function FacetedFilter({
  param,
  title,
  options,
  single = false,
}: {
  param: string
  title: string
  options: FacetOption[]
  /** For params the API only accepts once, like `mechanicId`. */
  single?: boolean
}) {
  const { searchParams, setParams } = useTableParams()

  const selected = new Set(
    (searchParams.get(param) ?? "").split(",").filter(Boolean)
  )

  function toggle(value: string) {
    if (single) {
      setParams({ [param]: selected.has(value) ? null : value })
      return
    }
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setParams({ [param]: next.size ? [...next] : null })
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="border-dashed">
            <PlusCircleIcon data-icon="inline-start" />
            {title}
            {selected.size > 0 ? (
              <>
                <Separator orientation="vertical" className="mx-0.5 h-3.5" />
                {selected.size <= 2 ? (
                  options
                    .filter((option) => selected.has(option.value))
                    .map((option) => (
                      <Badge
                        key={option.value}
                        variant="secondary"
                        className="font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                ) : (
                  <Badge variant="secondary" className="font-normal">
                    {selected.size} selected
                  </Badge>
                )}
              </>
            ) : null}
          </Button>
        }
      />
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                  >
                    <div
                      className={cn(
                        "flex size-4 items-center justify-center rounded-[4px] border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      {isSelected ? <CheckIcon className="size-3" /> : null}
                    </div>
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.size > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => setParams({ [param]: null })}
                    className="justify-center"
                  >
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
