
/**
 * Componente DatePicker
 * @file Permite a seleção de datas com suporte para localização
 * @relacionamento Usado em formulários que precisam selecionar datas
 */
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DayPickerRangeProps } from "react-day-picker"

interface DatePickerProps {
  className?: string
  children?: React.ReactNode
  mode?: "single" | "range" | "multiple"
  selected?: Date | Date[] | { from: Date; to?: Date }
  onSelect?: (date: Date | Date[] | { from: Date; to?: Date } | undefined) => void
  defaultMonth?: Date
  locale?: any
}

export function DatePicker({
  className,
  children,
  mode = "single",
  onSelect,
  selected,
  defaultMonth,
  locale,
}: DatePickerProps) {
  return (
    <Popover>
      {children ? (
        <PopoverTrigger asChild>{children}</PopoverTrigger>
      ) : (
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected instanceof Date
              ? format(selected, "PPP", { locale })
              : <span>Selecionar data</span>}
          </Button>
        </PopoverTrigger>
      )}
      <PopoverContent className="w-auto p-0" align="start">
        {mode === "single" && (
          <Calendar
            mode="single"
            selected={selected as Date}
            onSelect={onSelect as (date: Date | undefined) => void}
            defaultMonth={defaultMonth}
            locale={locale}
            className={cn("p-3 pointer-events-auto", className)}
          />
        )}
        {mode === "range" && (
          <Calendar
            mode="range"
            selected={selected as { from: Date; to?: Date }}
            onSelect={onSelect as (range: { from: Date; to?: Date } | undefined) => void}
            defaultMonth={defaultMonth}
            locale={locale}
            className={cn("p-3 pointer-events-auto", className)}
          />
        )}
        {mode === "multiple" && (
          <Calendar
            mode="multiple"
            selected={selected as Date[]}
            onSelect={onSelect as (dates: Date[] | undefined) => void}
            defaultMonth={defaultMonth}
            locale={locale}
            className={cn("p-3 pointer-events-auto", className)}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
