'use client'

import { useEffect } from 'react'
import {
  LayoutDashboard,
  AppWindow,
  Mail,
  DollarSign,
  MapPin,
  Mic,
  Package,
  Award,
  Siren,
  Gamepad2,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const COMMANDS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard },
  { id: 'context', label: 'Work Context', icon: MapPin },
  { id: 'voice-notes', label: 'Voice Notes', icon: Mic },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'emergency', label: 'Emergency Protocols', icon: Siren },
  { id: 'apps', label: 'App Manager', icon: AppWindow },
  { id: 'emails', label: 'Email Hub', icon: Mail },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'passwords', label: 'Password Vault', icon: ShieldCheck },
  { id: 'playcentre', label: 'Play Centre', icon: Gamepad2 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (tabId: string) => void
}

export function CommandPalette({ open, onOpenChange, onSelect }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Go to..."
      description="Jump to a section (⌘⇧K)"
    >
      <CommandInput placeholder="Search section..." />
      <CommandList>
        <CommandEmpty>No section found.</CommandEmpty>
        <CommandGroup heading="Sections">
          {COMMANDS.map(({ id, label, icon: Icon }) => (
            <CommandItem
              key={id}
              value={`${id} ${label}`}
              onSelect={() => {
                onSelect(id)
                onOpenChange(false)
              }}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
