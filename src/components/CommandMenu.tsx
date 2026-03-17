"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, FileTextIcon, LockIcon, LightbulbIcon, HeartPulseIcon, ZapIcon, FolderIcon, AlertTriangleIcon } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

interface SearchResult {
  id: string
  nodeType: string
  referenceId: string
  content: string
  similarity: number
}

// Custom hook to debounce fast typists before hitting the API
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const debouncedQuery = useDebounce(query, 500) // 500ms delay to prevent AI API thrashing
  
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  // 1. Listen for Cmd+K or Ctrl+K globally
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // 2. Fetch Semantic Brain search results when query changes
  React.useEffect(() => {
    async function searchBrain() {
      if (!debouncedQuery) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch("/api/brain/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: debouncedQuery, limit: 10 }),
        })
        const data = await res.json()
        if (data.success) {
          setResults(data.results)
        }
      } catch (error) {
        console.error("Semantic search failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    searchBrain()
  }, [debouncedQuery])

  // Map database nodeTypes to human-readable icons
  const getIconForType = (type: string) => {
    switch (type) {
      case 'VoiceNote': return <FileTextIcon className="mr-2 h-4 w-4" />
      case 'PasswordEntry': return <LockIcon className="mr-2 h-4 w-4" />
      case 'CodeSnippet': return <LightbulbIcon className="mr-2 h-4 w-4" />
      case 'ClientLog': return <FolderIcon className="mr-2 h-4 w-4" />
      case 'EmergencyProtocol': return <AlertTriangleIcon className="mr-2 h-4 w-4" />
      case 'healthcare': return <HeartPulseIcon className="mr-2 h-4 w-4 text-emerald-500" />
      case 'electrical': return <ZapIcon className="mr-2 h-4 w-4 text-amber-500" />
      default: return <SearchIcon className="mr-2 h-4 w-4" />
    }
  }

  // Handle clicking a search result
  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    // E.g., if we had deep linking: router.push(`/dashboard?focus=${result.referenceId}`)
    // For now, we'll just log it until the deep links exist.
    console.log("Navigating to semantic result:", result)
  }

  // Automatically categorize results
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.nodeType]) {
      acc[result.nodeType] = []
    }
    acc[result.nodeType].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full p-4 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all outline-none"
        aria-label="Search Second Brain"
        title="Cmd+K to search"
      >
        <SearchIcon className="h-6 w-6" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Ask your Second Brain..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && <CommandEmpty>Thinking...</CommandEmpty>}
          {!isLoading && query && results.length === 0 && (
            <CommandEmpty>No semantic matches found.</CommandEmpty>
          )}
          
          {Object.entries(groupedResults).map(([nodeType, items]) => (
            <CommandGroup key={nodeType} heading={nodeType}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.content}
                  onSelect={() => handleSelect(item)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex flex-row items-center overflow-hidden">
                    {getIconForType(item.nodeType)}
                    <span className="truncate max-w-[400px]">
                      {item.content.replace(/^Voice Note Category: .*?\. Summary: /, '')}
                    </span>
                  </div>
                  {item.similarity && (
                    <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
                      {(item.similarity * 100).toFixed(0)}% match
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          
          <CommandSeparator />
          <CommandGroup heading="System Commands">
            <CommandItem onSelect={() => { router.push('/'); setOpen(false) }}>
              <FolderIcon className="mr-2 h-4 w-4" />
              <span>Go to Dashboard</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
