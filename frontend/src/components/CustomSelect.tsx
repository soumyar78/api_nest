import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

interface Option {
  value: string | number
  label: string
}

interface CustomSelectProps {
  value: string | number
  onChange: (value: any) => void
  options: Option[]
  className?: string
  buttonClassName?: string
  optionsClassName?: string
}

export default function CustomSelect({
  value,
  onChange,
  options,
  className = '',
  buttonClassName = '',
  optionsClassName = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={twMerge(
          "w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-700 hover:text-zinc-900 focus:outline-none hover:border-zinc-300 transition-all font-semibold cursor-pointer",
          buttonClassName
        )}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-450 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute left-0 mt-1.5 min-w-[150px] bg-white border border-zinc-150 rounded-2xl p-1.5 shadow-xl shadow-zinc-950/5 z-50 animate-in fade-in slide-in-from-top-1 duration-100 ${optionsClassName}`}>
          <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
