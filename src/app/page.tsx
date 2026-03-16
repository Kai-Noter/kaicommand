'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  AppWindow,
  Mail,
  BarChart3,
  MessageSquare,
  Calendar,
  DollarSign,
  Settings,
  Menu,
  X,
  Activity,
  TrendingUp,
  Clock,
  Bell,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Star,
  Search,
  Plus,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Send,
  Filter,
  Download,
  Eye,
  Edit,
  ExternalLink,
  Bot,
  Lightbulb,
  MapPin,
  Mic,
  MicOff,
  Package,
  Code,
  Battery,
  Award,
  AlertCircle,
  HeartPulse,
  FileCode,
  Clipboard,
  Briefcase,
  Volume2,
  VolumeX,
  Siren,
  Timer,
  // Play Centre icons
  Gamepad2,
  Target,
  Trophy,
  RotateCcw,
  Wind,
  Puzzle,
  Shuffle,
  Check,
  Sun,
  Moon,
  Coffee,
  Leaf,
  Flame,
  Gauge,
  Lock,
  Unlock,
  BadgeCheck,
  Brain,
  // AI Assistant icons
  MessageCircle,
  Headphones,
  Command,
  Wand2,
  Rocket,
  HelpCircle,
  ThumbsUp,
  Copy,
  CheckCheck,
  Loader2,
  Maximize2,
  Minimize2,
  // Settings icons
  Palette,
  Crown,
  User,
  Key,
  Laptop,
  LogIn,
  LogOut,
  // Password Vault icons
  EyeOff,
  ShieldCheck,
  ClipboardCheck,
  Trash,
  PlusCircle,
  CheckSquare,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts'
import { useTheme, MOOD_COLORS } from '@/lib/theme-context'
import type { MoodColor } from '@/lib/theme-context'
import { CommandPalette } from '@/components/command-palette'
import {
  usePasswords,
  useAddPassword,
  useDeletePassword,
  useDigest,
} from '@/hooks/use-api'
import { toast } from '@/hooks/use-toast'

// Types
type AppType = {
  id: string
  name: string
  description: string | null
  category: string | null
  status: string
  version: string | null
  uptime: number
  responseTime: number | null
  aiSuggestion?: string
}

type EmailType = {
  id: string
  subject: string
  sender: string
  senderEmail: string
  preview: string | null
  content: string | null
  provider: string
  category: string
  priority: string
  isRead: boolean
  isStarred: boolean
  createdAt: Date
}

type TaskType = {
  id: string
  name: string
  description: string | null
  category: string
  schedule: string
  scheduleType: string
  status: string
  lastRun: Date | null
  nextRun: Date | null
  runCount: number
}

type TransactionType = {
  id: string
  description: string
  amount: number
  type: string
  category: string
  date: Date
}

type ChatMessageType = {
  role: string
  content: string
  createdAt?: Date
}

// Professional Context Types
type WorkContextType = {
  id: string
  name: string
  type: string
  location: string | null
  latitude: number | null
  longitude: number | null
  radius: number
  isActive: boolean
  color: string
  icon: string
}

type VoiceNoteType = {
  id: string
  transcript: string
  category: string
  workContext: string | null
  duration: number | null
  tags: string
  processed: boolean
  summary: string | null
  createdAt: Date
}

type InventoryItemType = {
  id: string
  name: string
  category: string
  partNumber: string | null
  quantity: number
  minQuantity: number
  unit: string
  cost: number | null
  needsRestock: boolean
}

type CertificationType = {
  id: string
  name: string
  type: string
  licenseNumber: string | null
  issueDate: Date | null
  expiryDate: Date | null
  status: string
  cpdHours: number
  requiredHours: number | null
}

type EmergencyProtocolType = {
  id: string
  title: string
  type: string
  description: string | null
  steps: string
  contacts: string
  isQuickAccess: boolean
  priority: number
}

type CodeSnippetType = {
  id: string
  title: string
  description: string | null
  code: string
  language: string
  tags: string
  source: string
  isFavorite: boolean
}

// Password Vault Type
type PasswordEntryType = {
  id: string
  website: string
  username: string
  password: string
  url: string | null
  notes: string | null
  category: string
  createdAt: Date
  lastUsed: Date | null
}

// Navigation items - with Play Centre added
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'context', label: 'Work Context', icon: MapPin },
  { id: 'voice-notes', label: 'Voice Notes', icon: Mic },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'emergency', label: 'Emergency', icon: Siren },
  { id: 'apps', label: 'App Manager', icon: AppWindow },
  { id: 'emails', label: 'Email Hub', icon: Mail },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'passwords', label: 'Password Vault', icon: ShieldCheck },
  { id: 'playcentre', label: 'Play Centre', icon: Gamepad2 },
  { id: 'settings', label: 'Settings', icon: Settings }
]

// Mobile bottom navigation (most used items)
const mobileNavItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'apps', label: 'Apps', icon: AppWindow },
  { id: 'passwords', label: 'Vault', icon: ShieldCheck },
  { id: 'playcentre', label: 'Play', icon: Gamepad2 },
  { id: 'settings', label: 'Settings', icon: Settings }
]

// Professional context colors
const CONTEXT_COLORS: Record<string, string> = {
  healthcare: 'bg-emerald-500',
  electrical: 'bg-amber-500',
  development: 'bg-purple-500'
}

const CONTEXT_ICONS: Record<string, any> = {
  healthcare: HeartPulse,
  electrical: Zap,
  development: Code
}

// Chart colors
const CHART_COLORS = [
  'oklch(0.7 0.25 280)',
  'oklch(0.75 0.18 160)',
  'oklch(0.8 0.15 60)',
  'oklch(0.7 0.2 320)',
  'oklch(0.65 0.22 30)'
]

export default function Home() {
  // Theme context
  const { theme, setTheme, moodColor, setMoodColor, resolvedTheme } = useTheme()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  
  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  // Auth & Profile states
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profileImage, setProfileImage] = useState<string>('')
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Data states
  const [apps, setApps] = useState<AppType[]>([])
  const [emails, setEmails] = useState<EmailType[]>([])
  const [tasks, setTasks] = useState<TaskType[]>([])
  const [transactions, setTransactions] = useState<TransactionType[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailStats, setEmailStats] = useState<any>({})
  const [financeSummary, setFinanceSummary] = useState<any>({})
  const [analyticsData, setAnalyticsData] = useState<any>({})

  // Dialog states
  const [addAppOpen, setAddAppOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailType | null>(null)
  const [selectedApp, setSelectedApp] = useState<AppType | null>(null)

  // Form states
  const [newApp, setNewApp] = useState({ name: '', description: '', category: 'Other' })
  const [newTask, setNewTask] = useState({ name: '', description: '', category: 'maintenance', scheduleType: 'daily' })

  // Professional data states
  const [workContexts, setWorkContexts] = useState<WorkContextType[]>([])
  const [voiceNotes, setVoiceNotes] = useState<VoiceNoteType[]>([])
  const [inventory, setInventory] = useState<InventoryItemType[]>([])
  const [certifications, setCertifications] = useState<CertificationType[]>([])
  const [emergencyProtocols, setEmergencyProtocols] = useState<EmergencyProtocolType[]>([])
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippetType[]>([])
  const [currentContext, setCurrentContext] = useState<string>('development')
  const [energyLevel, setEnergyLevel] = useState(7)
  const [voiceInput, setVoiceInput] = useState('')
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<EmergencyProtocolType | null>(null)

  // Play Centre states
  const [playScore, setPlayScore] = useState(0)
  const [playStreak, setPlayStreak] = useState(0)
  const [playLevel, setPlayLevel] = useState(1)
  const [playGamesPlayed, setPlayGamesPlayed] = useState(0)
  
  // Breathing exercise
  const [breathingActive, setBreathingActive] = useState(false)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [breathTimer, setBreathTimer] = useState(0)
  
  // Memory game
  const [memoryCards, setMemoryCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [memoryMoves, setMemoryMoves] = useState(0)
  const [memoryComplete, setMemoryComplete] = useState(false)
  
  // Reaction game
  const [reactionState, setReactionState] = useState<'waiting' | 'ready' | 'click' | 'result'>('waiting')
  const [reactionStartTime, setReactionStartTime] = useState(0)
  const [reactionTime, setReactionTime] = useState(0)
  const [reactionBest, setReactionBest] = useState(999)
  
  // Focus timer
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [focusActive, setFocusActive] = useState(false)
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60)
  
  // Meditation
  const [meditationActive, setMeditationActive] = useState(false)
  const [meditationTime, setMeditationTime] = useState(0)

  // AI Assistant states
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiExpanded, setAiExpanded] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string; timestamp: Date }>>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)
  const aiInputRef = useRef<HTMLInputElement>(null)
  const aiMessagesEndRef = useRef<HTMLDivElement>(null)

  // Password Vault: persisted via API
  const { data: passwordsData, isLoading: passwordsLoading } = usePasswords()
  const passwords = (passwordsData ?? []) as PasswordEntryType[]
  const addPasswordMutation = useAddPassword()
  const deletePasswordMutation = useDeletePassword()
  const [showPassword, setShowPassword] = useState<string | null>(null)
  const [addPasswordOpen, setAddPasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState({ website: '', username: '', password: '', url: '', notes: '', category: 'Personal' })
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null)
  
  // Password Generator states
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [passwordLength, setPasswordLength] = useState(16)
  const [passwordOptions, setPasswordOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })
  
  // Sign Up states
  const [signUpOpen, setSignUpOpen] = useState(false)
  const [signUpForm, setSignUpForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Digest for dashboard (while you were away + suggestions)
  const { data: digest } = useDigest(activeTab === 'dashboard')

  // Quick prompts for AI assistant (including "Argue the other side")
  const quickPrompts = [
    { icon: Lightbulb, text: "What can you help me with?", category: "help" },
    { icon: Zap, text: "Quick summary of my day", category: "summary" },
    { icon: Brain, text: "Start a brain training session", category: "wellness" },
    { icon: DollarSign, text: "How's my budget looking?", category: "finance" },
    { icon: Briefcase, text: "Switch to work context", category: "context" },
    { icon: HelpCircle, text: "What's my current context?", category: "context" },
    { icon: MessageCircle, text: "Argue the other side of my last message", category: "devil_advocate" },
  ]

  // Speech recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
      }
    }
  }, [])

  // Keyboard shortcut for AI assistant (⌘K). Command palette is ⌘⇧K (handled inside CommandPalette).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault()
        setAiModalOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch core data on mount (dashboard: apps, emails, tasks, finance). Analysis and chat lazy-loaded when needed.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, emailsRes, tasksRes, financeRes] = await Promise.all([
          fetch('/api/apps'),
          fetch('/api/emails'),
          fetch('/api/tasks'),
          fetch('/api/finance'),
        ])
        
        const [appsData, emailsData, tasksData, financeData] = await Promise.all([
          appsRes.json(),
          emailsRes.json(),
          tasksRes.json(),
          financeRes.json(),
        ])
        
        if (appsData.success) setApps(appsData.apps)
        if (emailsData.success) {
          setEmails(emailsData.emails)
          setEmailStats(emailsData.stats)
        }
        if (tasksData.success) setTasks(tasksData.tasks)
        if (financeData.success) {
          setTransactions(financeData.transactions)
          setFinanceSummary(financeData.summary)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    
    fetchData()
  }, [])

  // Lazy-load chat history when user opens AI modal (saves a request on first load)
  useEffect(() => {
    if (!aiModalOpen) return
    const loadChat = async () => {
      try {
        const res = await fetch('/api/chat')
        const data = await res.json()
        if (data.success && data.messages?.length) {
          setChatMessages(data.messages)
        }
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    }
    loadChat()
  }, [aiModalOpen])

  // Load work contexts for sidebar on mount (lightweight). Full professional data when user opens a tab that needs it.
  useEffect(() => {
    const fetchContexts = async () => {
      try {
        const res = await fetch('/api/professional?type=contexts')
        const data = await res.json()
        if (data.success && data.contexts?.length) {
          setWorkContexts(data.contexts)
          const active = data.contexts.find((c: WorkContextType) => c.isActive)
          if (active) setCurrentContext(active.type)
        }
      } catch (error) {
        console.error('Failed to fetch contexts:', error)
      }
    }
    fetchContexts()
  }, [])

  const professionalTabs = ['context', 'voice-notes', 'inventory', 'certifications', 'emergency']
  useEffect(() => {
    if (!professionalTabs.includes(activeTab)) return
    const fetchProfessional = async () => {
      try {
        const professionalRes = await fetch('/api/professional')
        const professionalData = await professionalRes.json()
        if (professionalData.success) {
          setWorkContexts(professionalData.contexts || [])
          setVoiceNotes(professionalData.voiceNotes || [])
          setInventory(professionalData.inventory || [])
          setCertifications(professionalData.certifications || [])
          setEmergencyProtocols(professionalData.protocols || [])
          setCodeSnippets(professionalData.snippets || [])
          const activeContext = professionalData.contexts?.find((c: WorkContextType) => c.isActive)
          if (activeContext) setCurrentContext(activeContext.type)
        }
      } catch (error) {
        console.error('Failed to fetch professional data:', error)
      }
    }
    fetchProfessional()
  }, [activeTab])

  // Pause Play Centre timers when user leaves the tab (saves CPU and avoids background state)
  useEffect(() => {
    if (activeTab !== 'playcentre') {
      if (breathingActive) setBreathingActive(false)
      if (focusActive) setFocusActive(false)
      if (meditationActive) setMeditationActive(false)
    }
  }, [activeTab])

  // Breathing exercise effect
  useEffect(() => {
    if (!breathingActive || activeTab !== 'playcentre') return

    const phases: Array<{ phase: 'inhale' | 'hold' | 'exhale'; duration: number }> = [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold', duration: 4 },
      { phase: 'exhale', duration: 4 }
    ]

    let phaseIndex = 0
    let countdown = phases[0].duration

    const interval = setInterval(() => {
      countdown--
      setBreathTimer(countdown)

      if (countdown <= 0) {
        phaseIndex = (phaseIndex + 1) % phases.length
        setBreathPhase(phases[phaseIndex].phase)
        countdown = phases[phaseIndex].duration
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [breathingActive, activeTab])

  // Focus timer effect (only when Play Centre tab is active)
  useEffect(() => {
    if (!focusActive || focusTimeLeft <= 0 || activeTab !== 'playcentre') return

    const interval = setInterval(() => {
      setFocusTimeLeft(prev => {
        if (prev <= 1) {
          setFocusActive(false)
          setPlayScore(s => s + 50)
          setPlayStreak(s => s + 1)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [focusActive, focusTimeLeft, activeTab])

  // Meditation timer effect (only when Play Centre tab is active)
  useEffect(() => {
    if (!meditationActive || activeTab !== 'playcentre') return

    const interval = setInterval(() => {
      setMeditationTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [meditationActive, activeTab])

  // Initialize memory game
  const initMemoryGame = useCallback(() => {
    const emojis = ['🧠', '💫', '🌟', '✨', '🔮', '🎯', '🎪', '🎨']
    const cards = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false
      }))
    setMemoryCards(cards)
    setFlippedCards([])
    setMemoryMoves(0)
    setMemoryComplete(false)
  }, [])

  // Handle memory card click
  const handleMemoryClick = (id: number) => {
    if (flippedCards.length === 2) return
    if (memoryCards[id].matched || memoryCards[id].flipped) return

    const newCards = [...memoryCards]
    newCards[id].flipped = true
    setMemoryCards(newCards)

    const newFlipped = [...flippedCards, id]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setMemoryMoves(m => m + 1)
      const [first, second] = newFlipped

      if (memoryCards[first].emoji === memoryCards[second].emoji) {
        setTimeout(() => {
          const matched = [...memoryCards]
          matched[first].matched = true
          matched[second].matched = true
          setMemoryCards(matched)
          setFlippedCards([])

          if (matched.every(c => c.matched)) {
            setMemoryComplete(true)
            setPlayScore(s => s + 100)
            setPlayGamesPlayed(s => s + 1)
          }
        }, 500)
      } else {
        setTimeout(() => {
          const reset = [...memoryCards]
          reset[first].flipped = false
          reset[second].flipped = false
          setMemoryCards(reset)
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  // Reaction game
  const startReactionGame = () => {
    setReactionState('ready')
    const delay = 2000 + Math.random() * 3000
    setTimeout(() => {
      setReactionState('click')
      setReactionStartTime(Date.now())
    }, delay)
  }

  const handleReactionClick = () => {
    if (reactionState === 'ready') {
      setReactionState('waiting')
      setReactionTime(0)
    } else if (reactionState === 'click') {
      const time = Date.now() - reactionStartTime
      setReactionTime(time)
      setReactionBest(prev => Math.min(prev, time))
      setReactionState('result')
      setPlayScore(s => s + Math.max(1, Math.floor((500 - time) / 10)))
      setPlayGamesPlayed(s => s + 1)
    } else if (reactionState === 'result' || reactionState === 'waiting') {
      startReactionGame()
    }
  }

  // Chat function
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return
    
    setIsLoading(true)
    const userMessage = chatInput
    setChatInput('')
    
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: chatMessages })
      })
      const data = await res.json()
      if (data.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch (error) {
      console.error('Chat error:', error)
    }
    
    setIsLoading(false)
  }

  // Add app function
  const addApp = async () => {
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
      })
      const data = await res.json()
      if (data.success) {
        setApps(prev => [...prev, data.app])
        setAddAppOpen(false)
        setNewApp({ name: '', description: '', category: 'Other' })
      }
    } catch (error) {
      console.error('Failed to add app:', error)
    }
  }

  // Delete app function
  const deleteApp = async (id: string) => {
    try {
      const res = await fetch(`/api/apps?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setApps(prev => prev.filter(app => app.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete app:', error)
    }
  }

  // Toggle task status
  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
      }
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  // Mark email as read
  const markEmailRead = async (id: string) => {
    try {
      const res = await fetch('/api/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true })
      })
      const data = await res.json()
      if (data.success) {
        setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e))
      }
    } catch (error) {
      console.error('Failed to mark email as read:', error)
    }
  }

  // Switch work context
  const switchContext = async (id: string) => {
    try {
      const res = await fetch('/api/professional', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'context', id })
      })
      const data = await res.json()
      if (data.success) {
        setWorkContexts(prev => prev.map(c => ({
          ...c,
          isActive: c.id === id
        })))
        setCurrentContext(data.context.type)
      }
    } catch (error) {
      console.error('Failed to switch context:', error)
    }
  }

  // Submit voice note
  const submitVoiceNote = async () => {
    if (!voiceInput.trim()) return
    try {
      const res = await fetch('/api/professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'voice-note', transcript: voiceInput })
      })
      const data = await res.json()
      if (data.success) {
        setVoiceNotes(prev => [data.note, ...prev])
        setVoiceInput('')
      }
    } catch (error) {
      console.error('Failed to submit voice note:', error)
    }
  }

  // Log energy
  const logEnergy = async () => {
    try {
      await fetch('/api/professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'energy-log',
          level: energyLevel,
          energyType: 'mental',
          workContext: currentContext
        })
      })
    } catch (error) {
      console.error('Failed to log energy:', error)
    }
  }

  // AI Assistant functions
  const sendAiMessage = async (message?: string) => {
    const text = message || aiInput.trim()
    if (!text || aiLoading) return

    setAiLoading(true)
    const userMessage = { role: 'user', content: text, timestamp: new Date() }
    setAiMessages(prev => [...prev, userMessage])
    setAiInput('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: aiMessages,
          context: currentContext,
          voiceMode: false
        })
      })
      const data = await res.json()

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }
        setAiMessages(prev => [...prev, assistantMessage])

        // Handle actions
        if (data.action) {
          handleAiAction(data.action)
        }
      }
    } catch (error) {
      console.error('AI chat error:', error)
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }])
    }

    setAiLoading(false)
  }

  // Handle AI-triggered actions
  const handleAiAction = (action: { type: string; context?: string; tab?: string }) => {
    switch (action.type) {
      case 'switchContext':
        if (action.context) {
          const contextId = workContexts.find(c => c.type === action.context)?.id
          if (contextId) switchContext(contextId)
        }
        break
      case 'navigate':
        if (action.tab) setActiveTab(action.tab)
        break
      case 'emergency':
        setEmergencyModalOpen(true)
        break
      case 'startFocus':
        setActiveTab('playcentre')
        setFocusActive(true)
        break
      case 'startBreathing':
        setActiveTab('playcentre')
        setBreathingActive(true)
        break
    }
  }

  // Voice input for AI
  const startVoiceInput = () => {
    if (!speechSupported) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-GB'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setAiInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  // Copy message to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessage(id)
      setTimeout(() => setCopiedMessage(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Clear chat history
  const clearAiChat = async () => {
    try {
      await fetch('/api/chat', { method: 'DELETE' })
      setAiMessages([])
    } catch (error) {
      console.error('Failed to clear chat:', error)
    }
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'success':
        return 'bg-emerald-500'
      case 'warning':
      case 'paused':
        return 'bg-amber-500'
      case 'critical':
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      healthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const getProviderIcon = (provider: string) => {
    const colors: Record<string, string> = {
      gmail: 'bg-red-500',
      yahoo: 'bg-purple-500',
      outlook: 'bg-blue-500',
      hotmail: 'bg-green-500'
    }
    return colors[provider] || 'bg-gray-500'
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Dashboard stats
  const dashboardStats = [
    { label: 'Active Tasks', value: tasks.filter(t => t.status === 'active').length, icon: Activity, color: 'text-emerald-400' },
    { label: 'Apps Monitored', value: apps.length, icon: AppWindow, color: 'text-purple-400' },
    { label: 'Unread Emails', value: emails.filter(e => !e.isRead).length, icon: Mail, color: 'text-blue-400' },
    { label: 'Total Balance', value: `£${(financeSummary.balance || 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-400' }
  ]

  // Quick actions
  const quickActions = [
    { label: 'Scan Apps', icon: Shield, action: () => setActiveTab('apps') },
    { label: 'Check Emails', icon: Mail, action: () => setActiveTab('emails') },
    { label: 'Play Centre', icon: Gamepad2, action: () => setActiveTab('playcentre') },
    { label: 'Emergency', icon: Siren, action: () => setEmergencyModalOpen(true) }
  ]

  // Recent activity
  // Chat prompts
  const chatPrompts = [
    'Analyze my app performance',
    'Suggest improvements for my projects',
    'Review my email priorities',
    'Generate a financial report',
    'Recommend best coding agents'
  ]

  // Handle profile image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Password Generator function
  const generatePassword = () => {
    let chars = ''
    if (passwordOptions.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (passwordOptions.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (passwordOptions.numbers) chars += '0123456789'
    if (passwordOptions.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    if (chars === '') {
      chars = 'abcdefghijklmnopqrstuvwxyz'
    }
    
    let password = ''
    for (let i = 0; i < passwordLength; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
  }

  // Copy password to clipboard
  const copyPasswordToClipboard = async (password: string, id: string) => {
    try {
      await navigator.clipboard.writeText(password)
      setCopiedPassword(id)
      setTimeout(() => setCopiedPassword(null), 2000)
    } catch (error) {
      console.error('Failed to copy password:', error)
    }
  }

  // Add new password entry (persisted via API)
  const addPasswordEntry = async () => {
    if (!newPassword.website || !newPassword.username || !newPassword.password) return
    try {
      await addPasswordMutation.mutateAsync({
        website: newPassword.website,
        username: newPassword.username,
        password: newPassword.password,
        url: newPassword.url || undefined,
        notes: newPassword.notes || undefined,
        category: newPassword.category,
      })
      setNewPassword({ website: '', username: '', password: '', url: '', notes: '', category: 'Personal' })
      setAddPasswordOpen(false)
      toast({ title: 'Password saved', description: 'Entry added to your vault.' })
    } catch (e) {
      toast({ title: 'Failed to save password', description: (e as Error).message, variant: 'destructive' })
    }
  }

  // Delete password entry (persisted via API)
  const deletePasswordEntry = async (id: string) => {
    try {
      await deletePasswordMutation.mutateAsync(id)
      toast({ title: 'Password removed', description: 'Entry deleted from your vault.' })
    } catch (e) {
      toast({ title: 'Failed to delete', description: (e as Error).message, variant: 'destructive' })
    }
  }

  // Calculate password strength
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (password.length >= 16) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    if (strength <= 2) return { label: 'Weak', color: 'text-red-500', bg: 'bg-red-500' }
    if (strength <= 4) return { label: 'Fair', color: 'text-amber-500', bg: 'bg-amber-500' }
    if (strength <= 6) return { label: 'Strong', color: 'text-lime-500', bg: 'bg-lime-500' }
    return { label: 'Very Strong', color: 'text-emerald-500', bg: 'bg-emerald-500' }
  }

  // Handle tab change with mobile menu close
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    if (isMobile) {
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background bg-pattern">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 drawer-overlay z-40"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: (sidebarOpen && !isMobile) || mobileMenuOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 20 }}
        className={`fixed left-0 top-0 h-full w-64 glass border-r border-border/50 z-50 ${isMobile ? 'shadow-2xl' : ''}`}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src="/icon.png" alt="KaiCommand" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-lg gradient-text">KaiCommand</h1>
              <p className="text-xs text-muted-foreground">AI Command Center</p>
            </div>
          </div>

          {/* Context Switcher */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2 px-1">Current Context</p>
            <div className="grid grid-cols-3 gap-1">
              {workContexts.map((ctx) => {
                const ContextIcon = CONTEXT_ICONS[ctx.type] || Briefcase
                return (
                  <motion.button
                    key={ctx.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => switchContext(ctx.id)}
                    className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                      ctx.isActive
                        ? 'bg-accent border border-border/60'
                        : 'hover:bg-accent/60 border border-transparent'
                    }`}
                  >
                    <ContextIcon className={`w-4 h-4 ${ctx.isActive ? '' : 'text-muted-foreground'}`}
                      style={{ color: ctx.isActive ? ctx.color : undefined }}
                    />
                    <span className="text-[10px] capitalize">{ctx.type.slice(0, 5)}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Emergency Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEmergencyModalOpen(true)}
            className="w-full mb-4 p-2 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Siren className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-medium">Emergency</span>
          </motion.button>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-accent text-foreground border border-border/60'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-4 left-4 right-4 hidden md:block">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={profileImage} />
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white text-xs">
                    {isLoggedIn && userProfile.firstName 
                      ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase()
                      : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {isLoggedIn && userProfile.firstName 
                      ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
                      : 'Guest'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {isLoggedIn && userProfile.email ? userProfile.email : 'Not signed in'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen && !isMobile ? 'md:ml-64' : 'ml-0'} ${isMobile ? 'pb-20' : ''}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50 safe-area-top">
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile menu button or desktop sidebar toggle */}
              {isMobile ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  className="text-muted-foreground hover:text-foreground tap-target"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              )}
              <div>
                <h2 className="text-lg md:text-xl font-bold">
                  {isMobile ? (
                    navItems.find(n => n.id === activeTab)?.label || 'Dashboard'
                  ) : (
                    <>Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}!</>
                  )}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  <span className="ml-2 text-sky-500">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile: Show AI and Notification icons */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative tap-target"
                onClick={() => setAiModalOpen(true)}
              >
                <Bot className="w-5 h-5 text-sky-500" />
              </Button>
              <Button variant="ghost" size="icon" className="relative tap-target">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
              {/* Desktop search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 w-64 bg-card border-border/60"
                />
              </div>
              {/* Mobile: Profile Avatar */}
              {isMobile && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profileImage} />
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white text-xs">
                    {isLoggedIn && userProfile.firstName 
                      ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase()
                      : '?'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Welcome Banner */}
                <Card className="glass-card overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">
                          Welcome to <span className="gradient-text">KaiCommand</span>
                        </h3>
                        <p className="text-muted-foreground">
                          Your AI Command Center for managing apps, emails, tasks, and finances.
                        </p>
                      </div>
                      <div className="hidden md:flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center">
                          <Bot className="w-10 h-10 text-sky-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Guard panel – focus & wellbeing summary */}
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-sky-400" />
                      Guard – Focus & wellbeing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {focusActive
                          ? 'Focus timer is running – I’ll minimise distractions and nudge you if you drift.'
                          : 'No active focus block. Start a 25‑minute deep‑work session or a short breathing break.'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Energy level: {energyLevel}/10 • Breathing {breathingActive ? 'active' : 'idle'} • Play streak:{' '}
                        {playStreak}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('playcentre')}>
                        <Brain className="w-3 h-3 mr-1" />
                        Open Play Centre
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setActiveTab('playcentre')
                          setFocusActive(true)
                          setFocusTimeLeft(focusMinutes * 60)
                          setBreathingActive(false)
                        }}
                      >
                        <Target className="w-3 h-3 mr-1" />
                        Start focus block
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* While you were away + Proactive suggestions */}
                {(digest?.whileYouWereAway || (digest?.suggestions && digest.suggestions.length > 0)) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {digest?.whileYouWereAway && (
                      <Card className="glass-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            While you were away
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{digest.whileYouWereAway}</p>
                        </CardContent>
                      </Card>
                    )}
                    {digest?.suggestions && digest.suggestions.length > 0 && (
                      <Card className="glass-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            Suggested actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {digest.suggestions.map((s, i) => (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="border-border/50 hover:bg-accent"
                                onClick={() => handleTabChange(s.tabId)}
                              >
                                {s.label}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardStats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="glass-card hover:glow-sm transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">{stat.label}</p>
                              <p className="text-2xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                              <stat.icon className="w-5 h-5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Actions & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      {quickActions.map((action) => (
                        <Button
                          key={action.label}
                          variant="outline"
                          className="h-auto py-4 flex-col gap-2 border-border/50 hover:bg-accent"
                          onClick={action.action}
                        >
                          <action.icon className="w-5 h-5" />
                          <span>{action.label}</span>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Recent Activity (from audit log when available, else static) */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {(digest?.recentActivity && digest.recentActivity.length > 0
                            ? digest.recentActivity.map((activity, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                    <Activity className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate capitalize">{activity.action}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(activity.time).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))
                            : (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                  No recent activity. Switch context, add a task, or use the vault to see actions here.
                                </p>
                              )
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Work Context Tab */}
            {activeTab === 'context' && (
              <motion.div
                key="context"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Work Context</h3>
                    <p className="text-muted-foreground">Location-based context switching</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {workContexts.map((ctx) => {
                    const ContextIcon = CONTEXT_ICONS[ctx.type] || Briefcase
                    return (
                      <Card
                        key={ctx.id}
                        className={`glass-card cursor-pointer transition-all ${ctx.isActive ? 'ring-2 ring-offset-2 ring-offset-background' : ''}`}
                        style={{ borderColor: ctx.isActive ? ctx.color : undefined }}
                        onClick={() => switchContext(ctx.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="p-3 rounded-xl" style={{ backgroundColor: `${ctx.color}20` }}>
                              <ContextIcon className="w-6 h-6" style={{ color: ctx.color }} />
                            </div>
                            {ctx.isActive && (
                              <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardTitle className="text-base">{ctx.name}</CardTitle>
                          <CardDescription className="capitalize">{ctx.type}</CardDescription>
                          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{ctx.location || 'No location set'}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Voice Notes Tab */}
            {activeTab === 'voice-notes' && (
              <motion.div
                key="voice-notes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Voice Documentation</h3>
                    <p className="text-muted-foreground">Hands-free note-taking with AI categorization</p>
                  </div>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-purple-400" />
                      Record Note
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Type or paste your voice transcript here..."
                      value={voiceInput}
                      onChange={(e) => setVoiceInput(e.target.value)}
                      className="min-h-32 bg-white/5 border-white/10"
                    />
                    <Button onClick={submitVoiceNote} disabled={!voiceInput.trim()} className="glass-button">
                      <Volume2 className="w-4 h-4 mr-2" />
                      Process with AI
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {voiceNotes.map((note) => (
                    <Card key={note.id} className="glass-card">
                      <CardHeader className="pb-2">
                        <Badge className={note.category === 'patient_obs' ? 'bg-emerald-500/20 text-emerald-400' :
                          note.category === 'electrical' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-purple-500/20 text-purple-400'
                        }>
                          {note.category.replace('_', ' ')}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm line-clamp-3">{note.transcript}</p>
                        {note.summary && (
                          <div className="mt-2 p-2 rounded bg-white/5 text-xs text-muted-foreground">
                            <span className="text-purple-400">AI:</span> {note.summary}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Smart Inventory</h3>
                    <p className="text-muted-foreground">Unified parts and supplies tracking</p>
                  </div>
                </div>

                {inventory.filter(i => i.needsRestock).length > 0 && (
                  <Card className="glass-card border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <div>
                          <p className="font-medium text-amber-400">Restock Needed</p>
                          <p className="text-sm text-muted-foreground">
                            {inventory.filter(i => i.needsRestock).length} items below minimum
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['electrical_parts', 'medical_supplies', 'dev_equipment'].map((cat) => (
                    <Card key={cat} className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-base capitalize">{cat.replace('_', ' ')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {inventory.filter(i => i.category === cat).map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.partNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${item.needsRestock ? 'text-amber-400' : ''}`}>
                                {item.quantity} {item.unit}
                              </p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Certifications Tab */}
            {activeTab === 'certifications' && (
              <motion.div
                key="certifications"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Certifications & Compliance</h3>
                    <p className="text-muted-foreground">Track licenses and CPD hours</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {certifications.map((cert) => {
                    const daysUntilExpiry = cert.expiryDate
                      ? Math.ceil((new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 90

                    return (
                      <Card key={cert.id} className={`glass-card ${isExpiringSoon ? 'border-amber-500/50' : ''}`}>
                        <CardHeader className="pb-2">
                          <Badge className={cert.type === 'electrical' ? 'bg-amber-500/20 text-amber-400' :
                            cert.type === 'healthcare' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-purple-500/20 text-purple-400'
                          }>
                            {cert.type}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <CardTitle className="text-sm">{cert.name}</CardTitle>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Expires: {cert.expiryDate ? formatDate(cert.expiryDate) : 'N/A'}
                          </div>
                          {cert.requiredHours && cert.requiredHours > 0 && (
                            <Progress value={(cert.cpdHours / cert.requiredHours) * 100} className="h-1 mt-2" />
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Emergency Tab */}
            {activeTab === 'emergency' && (
              <motion.div
                key="emergency"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Emergency Protocols</h3>
                    <p className="text-muted-foreground">Quick reference for high-stress scenarios</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {emergencyProtocols.map((protocol) => (
                    <Card
                      key={protocol.id}
                      className="glass-card cursor-pointer hover:glow-sm transition-all"
                      onClick={() => {
                        setSelectedProtocol(protocol)
                        setEmergencyModalOpen(true)
                      }}
                    >
                      <CardHeader className="pb-2">
                        <Badge className={protocol.type === 'electrical' ? 'bg-amber-500/20 text-amber-400' :
                          protocol.type === 'healthcare' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-purple-500/20 text-purple-400'
                        }>
                          {protocol.type}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-base">{protocol.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{protocol.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* App Manager Tab */}
            {activeTab === 'apps' && (
              <motion.div
                key="apps"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">App Manager</h3>
                    <p className="text-muted-foreground">Monitor and manage your applications</p>
                  </div>
                  <Dialog open={addAppOpen} onOpenChange={setAddAppOpen}>
                    <DialogTrigger asChild>
                      <Button className="glass-button">
                        <Plus className="w-4 h-4 mr-2" />
                        Add App
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass">
                      <DialogHeader>
                        <DialogTitle>Add New App</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>App Name</Label>
                          <Input value={newApp.name} onChange={(e) => setNewApp({ ...newApp, name: e.target.value })} />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea value={newApp.description} onChange={(e) => setNewApp({ ...newApp, description: e.target.value })} />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select value={newApp.category} onValueChange={(v) => setNewApp({ ...newApp, category: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="E-Commerce">E-Commerce</SelectItem>
                              <SelectItem value="Analytics">Analytics</SelectItem>
                              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddAppOpen(false)}>Cancel</Button>
                        <Button onClick={addApp}>Add App</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apps.map((app, index) => (
                    <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Card className="glass-card hover:glow-sm transition-all cursor-pointer" onClick={() => setSelectedApp(app)}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(app.status)}`} />
                              <div>
                                <CardTitle className="text-base">{app.name}</CardTitle>
                                <CardDescription>{app.category}</CardDescription>
                              </div>
                            </div>
                            <Badge className={getStatusBadge(app.status)} variant="outline">{app.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Uptime</p>
                              <p className="font-medium">{app.uptime}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Response</p>
                              <p className="font-medium">{app.responseTime}ms</p>
                            </div>
                          </div>
                          {app.aiSuggestion && (
                            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 mt-3">
                              <p className="text-xs text-muted-foreground line-clamp-2">{app.aiSuggestion}</p>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="justify-between">
                          <p className="text-xs text-muted-foreground">v{app.version}</p>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); deleteApp(app.id) }}>
                            <Trash2 className="w-3 h-3 mr-1" />Remove
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Email Hub Tab */}
            {activeTab === 'emails' && (
              <motion.div
                key="emails"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Email Hub</h3>
                    <p className="text-muted-foreground">Unified email management</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="glass-card">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{emailStats.total || 0}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-400">{emailStats.unread || 0}</p>
                      <p className="text-sm text-muted-foreground">Unread</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-amber-400">{emailStats.starred || 0}</p>
                      <p className="text-sm text-muted-foreground">Starred</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">By Provider</p>
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(emailStats.byProvider || {}).map(([provider, count]) => (
                          <Badge key={provider} className={`${getProviderIcon(provider)} text-white text-xs`}>
                            {provider}: {count as number}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      {emails.map((email) => (
                        <div
                          key={email.id}
                          className={`p-4 border-b border-border/50 hover:bg-white/5 cursor-pointer ${!email.isRead ? 'bg-purple-500/5' : ''}`}
                          onClick={() => { setSelectedEmail(email); markEmailRead(email.id) }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${getProviderIcon(email.provider)}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`font-medium ${!email.isRead ? '' : 'text-muted-foreground'}`}>{email.sender}</p>
                                <div className="flex items-center gap-2">
                                  {email.isStarred && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                                  <span className="text-xs text-muted-foreground">{formatDate(email.createdAt)}</span>
                                </div>
                              </div>
                              <p className={`text-sm truncate ${!email.isRead ? 'font-medium' : 'text-muted-foreground'}`}>{email.subject}</p>
                              <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Finance Tab */}
            {activeTab === 'finance' && (
              <motion.div
                key="finance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Finance Dashboard</h3>
                    <p className="text-muted-foreground">Track income, expenses, and budgets</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-2xl font-bold text-emerald-400">£{(financeSummary.income || 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-400">£{(financeSummary.expenses || 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className={`text-2xl font-bold ${(financeSummary.balance || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        £{(financeSummary.balance || 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold">{transactions.length}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-base">Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-80">
                      {transactions.slice(0, 10).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 border-b border-border/30">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              <p className="text-xs text-muted-foreground capitalize">{tx.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {tx.type === 'income' ? '+' : '-'}£{tx.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* PLAY CENTRE TAB */}
            {activeTab === 'playcentre' && (
              <motion.div
                key="playcentre"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Gamepad2 className="w-6 h-6 text-purple-400" />
                      Brain Play Centre
                    </h3>
                    <p className="text-muted-foreground">Relax, detox, maintain, and grow your brain!</p>
                  </div>
                  <Card className="glass-card px-4 py-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="font-bold">{playScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span>{playStreak} streak</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Play Centre Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Relaxation */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-cyan-400">
                        <Wind className="w-5 h-5" />
                        Relaxation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Breathing */}
                      <div className="text-center">
                        {breathingActive ? (
                          <motion.div
                            animate={{ scale: breathPhase === 'inhale' ? 1.2 : breathPhase === 'exhale' ? 0.8 : 1 }}
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 mx-auto flex items-center justify-center"
                          >
                            <div className="text-white text-center">
                              <p className="text-xl font-bold">{breathTimer}</p>
                              <p className="text-xs capitalize">{breathPhase}</p>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-white/10 mx-auto flex items-center justify-center">
                            <Wind className="w-8 h-8 text-cyan-400" />
                          </div>
                        )}
                        <Button
                          className="mt-4 glass-button"
                          onClick={() => setBreathingActive(!breathingActive)}
                        >
                          {breathingActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                          {breathingActive ? 'Stop' : 'Start'} Breathing
                        </Button>
                      </div>

                      {/* Meditation */}
                      <Separator />
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center">
                          <p className="text-white text-lg font-bold">{formatTime(meditationTime)}</p>
                        </div>
                        <Button
                          className="mt-4 glass-button"
                          onClick={() => {
                            setMeditationActive(!meditationActive)
                            if (meditationActive && meditationTime > 0) {
                              setPlayScore(s => s + Math.floor(meditationTime / 10))
                            }
                          }}
                        >
                          {meditationActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                          {meditationActive ? 'End' : 'Start'} Meditation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Focus Timer */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-400">
                        <Timer className="w-5 h-5" />
                        Mental Detox - Focus Timer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="relative w-40 h-40 mx-auto">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/10" />
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={440}
                            strokeDashoffset={440 * (1 - focusTimeLeft / (focusMinutes * 60))}
                            className="text-green-400 transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div>
                            <p className="text-3xl font-bold">{formatTime(focusTimeLeft)}</p>
                            <p className="text-xs text-muted-foreground">{focusActive ? 'Focus!' : 'Ready?'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center gap-2 mt-4">
                        {[15, 25, 45].map((mins) => (
                          <Button
                            key={mins}
                            variant={focusMinutes === mins ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => { setFocusMinutes(mins); setFocusTimeLeft(mins * 60) }}
                            disabled={focusActive}
                          >
                            {mins}m
                          </Button>
                        ))}
                      </div>
                      <Button className="mt-4 glass-button" onClick={() => setFocusActive(!focusActive)}>
                        {focusActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {focusActive ? 'Pause' : 'Start'} Focus
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Games Section */}
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-amber-400" />
                  Brain Training Games
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Memory Game */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-400">
                        <Puzzle className="w-5 h-5" />
                        Memory Match
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {memoryCards.length === 0 ? (
                        <div className="text-center py-8">
                          <Puzzle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <Button onClick={initMemoryGame} className="glass-button">
                            <Play className="w-4 h-4 mr-2" />Start Game
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between mb-2">
                            <Badge variant="outline">Moves: {memoryMoves}</Badge>
                            {memoryComplete && <Badge className="bg-emerald-500/20 text-emerald-400">Complete! +100pts</Badge>}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {memoryCards.map((card) => (
                              <motion.button
                                key={card.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleMemoryClick(card.id)}
                                className={`aspect-square rounded-lg text-2xl flex items-center justify-center transition-all ${
                                  card.matched ? 'bg-emerald-500/20' : card.flipped ? 'bg-amber-500/20' : 'bg-white/5 hover:bg-white/10'
                                } border border-white/10`}
                              >
                                {(card.flipped || card.matched) ? card.emoji : '?'}
                              </motion.button>
                            ))}
                          </div>
                          {memoryComplete && (
                            <Button onClick={initMemoryGame} className="w-full mt-4 glass-button">
                              <RotateCcw className="w-4 h-4 mr-2" />Play Again
                            </Button>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reaction Game */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-400">
                        <Zap className="w-5 h-5" />
                        Reaction Test
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReactionClick}
                        className={`w-full h-48 rounded-xl flex items-center justify-center transition-all ${
                          reactionState === 'waiting' ? 'bg-gray-500/20' :
                          reactionState === 'ready' ? 'bg-red-500/20 border-2 border-red-500' :
                          reactionState === 'click' ? 'bg-green-500/20 border-2 border-green-500 animate-pulse' :
                          'bg-blue-500/20 border-2 border-blue-500'
                        }`}
                      >
                        <div className="text-center">
                          {reactionState === 'waiting' && <><p className="text-lg font-bold">Click to Start</p><p className="text-muted-foreground text-sm mt-2">Wait for green!</p></>}
                          {reactionState === 'ready' && <><p className="text-lg font-bold text-red-400">Wait...</p><p className="text-muted-foreground text-sm mt-2">Don't click yet!</p></>}
                          {reactionState === 'click' && <p className="text-2xl font-bold text-green-400">CLICK!</p>}
                          {reactionState === 'result' && <><p className="text-3xl font-bold text-blue-400">{reactionTime}ms</p><p className="text-muted-foreground text-sm mt-2">Best: {reactionBest === 999 ? '-' : `${reactionBest}ms`}</p></>}
                        </div>
                      </motion.button>
                    </CardContent>
                  </Card>
                </div>

                {/* Play Stats */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      Your Play Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{playScore}</p>
                        <p className="text-xs text-muted-foreground">Total Score</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{playGamesPlayed}</p>
                        <p className="text-xs text-muted-foreground">Games Played</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{playStreak}</p>
                        <p className="text-xs text-muted-foreground">Day Streak</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{playLevel}</p>
                        <p className="text-xs text-muted-foreground">Level</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Password Vault Tab */}
            {activeTab === 'passwords' && (
              <motion.div
                key="passwords"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-lime-500" />
                      Password Vault
                    </h3>
                    <p className="text-muted-foreground">Securely manage your passwords</p>
                  </div>
                  <Button 
                    onClick={() => setAddPasswordOpen(true)}
                    className="bg-lime-500 hover:bg-lime-600 text-black tap-target"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Password
                  </Button>
                </div>

                {/* Password Generator Card */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Password Generator
                    </CardTitle>
                    <CardDescription>Generate secure random passwords</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Generated Password Display */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={generatedPassword}
                          readOnly
                          placeholder="Click generate to create password"
                          className="pr-10 font-mono"
                        />
                        {generatedPassword && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => copyPasswordToClipboard(generatedPassword, 'generated')}
                          >
                            {copiedPassword === 'generated' ? (
                              <ClipboardCheck className="w-4 h-4 text-lime-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <Button 
                        onClick={generatePassword}
                        className="bg-lime-500 hover:bg-lime-600 text-black"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Password Strength Indicator */}
                    {generatedPassword && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div 
                            className={`h-full transition-all ${getPasswordStrength(generatedPassword).bg}`}
                            style={{ width: `${Math.min(getPasswordStrength(generatedPassword).label === 'Weak' ? 25 : getPasswordStrength(generatedPassword).label === 'Fair' ? 50 : getPasswordStrength(generatedPassword).label === 'Strong' ? 75 : 100, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${getPasswordStrength(generatedPassword).color}`}>
                          {getPasswordStrength(generatedPassword).label}
                        </span>
                      </div>
                    )}

                    {/* Length Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Length</Label>
                        <span className="text-sm font-mono text-lime-500">{passwordLength}</span>
                      </div>
                      <Input
                        type="range"
                        min={8}
                        max={32}
                        value={passwordLength}
                        onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={passwordOptions.uppercase}
                          onCheckedChange={(checked) => setPasswordOptions(prev => ({ ...prev, uppercase: checked }))}
                        />
                        <span className="text-sm">ABC</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={passwordOptions.lowercase}
                          onCheckedChange={(checked) => setPasswordOptions(prev => ({ ...prev, lowercase: checked }))}
                        />
                        <span className="text-sm">abc</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={passwordOptions.numbers}
                          onCheckedChange={(checked) => setPasswordOptions(prev => ({ ...prev, numbers: checked }))}
                        />
                        <span className="text-sm">123</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={passwordOptions.symbols}
                          onCheckedChange={(checked) => setPasswordOptions(prev => ({ ...prev, symbols: checked }))}
                        />
                        <span className="text-sm">@#$</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Password List */}
                <div className="grid gap-4">
                  {passwordsLoading ? (
                    <Card className="glass-card">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading vault...
                      </CardContent>
                    </Card>
                  ) : passwords.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="glass-card hover:glow-sm transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-500/20 to-emerald-500/20 flex items-center justify-center shrink-0">
                              <span className="text-lg font-bold text-lime-500">
                                {entry.website.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold truncate">{entry.website}</h4>
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  {entry.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate mb-2">
                                {entry.username}
                              </p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 px-3 py-1.5 bg-white/5 dark:bg-white/5 rounded-lg text-sm font-mono truncate">
                                  {showPassword === entry.id ? entry.password : '••••••••••••'}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 tap-target"
                                  onClick={() => setShowPassword(showPassword === entry.id ? null : entry.id)}
                                >
                                  {showPassword === entry.id ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 tap-target"
                                  onClick={() => copyPasswordToClipboard(entry.password, entry.id)}
                                >
                                  {copiedPassword === entry.id ? (
                                    <ClipboardCheck className="w-4 h-4 text-lime-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0 text-red-400 hover:text-red-500 tap-target"
                                  onClick={() => deletePasswordEntry(entry.id)}
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {!passwordsLoading && passwords.length === 0 && (
                  <Card className="glass-card">
                    <CardContent className="p-8 text-center">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h4 className="font-semibold mb-2">No passwords saved</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add your first password to get started
                      </p>
                      <Button 
                        onClick={() => setAddPasswordOpen(true)}
                        className="bg-lime-500 hover:bg-lime-600 text-black"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Password
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold">Settings</h3>
                  <p className="text-muted-foreground">Manage your preferences and account</p>
                </div>

                {/* Profile Section */}
                <Card className="glass-card overflow-hidden">
                  <div className="h-20 sm:h-24 bg-gradient-to-r from-lime-400 via-white to-black dark:from-lime-500 dark:via-lime-400 dark:to-black" />
                  <CardContent className="pt-0 relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-8 sm:-mt-10">
                      <div className="relative group">
                        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-background shadow-xl">
                          <AvatarImage src={profileImage} />
                          <AvatarFallback className="bg-gradient-to-br from-lime-400 to-green-500 text-black text-lg sm:text-xl font-bold">
                            {userProfile.firstName.charAt(0)}{userProfile.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity tap-target"
                        >
                          <Edit className="w-5 h-5 text-white" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{userProfile.firstName} {userProfile.lastName}</h4>
                        <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                      </div>
                    </div>
                    
                    {/* Login/Logout Section - Always visible */}
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {isLoggedIn ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                              <span className="text-sm font-medium text-lime-600 dark:text-lime-400">Signed In</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-gray-400" />
                              <span className="text-sm font-medium text-muted-foreground">Signed Out</span>
                            </>
                          )}
                        </div>
                        {isLoggedIn ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setIsLoggedIn(false)
                            }}
                            className="w-full sm:w-auto tap-target"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                          </Button>
                        ) : (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                              size="sm" 
                              onClick={() => setIsLoggedIn(true)} 
                              className="flex-1 sm:flex-none bg-lime-500 hover:bg-lime-600 text-black tap-target"
                            >
                              <LogIn className="w-4 h-4 mr-2" />
                              Sign In
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm" 
                              onClick={() => setSignUpOpen(true)} 
                              className="flex-1 sm:flex-none tap-target"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Sign Up
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Theme Settings */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        {resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        Appearance
                      </CardTitle>
                      <CardDescription>Choose your preferred theme</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {(['light', 'dark', 'auto'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                              theme === t 
                                ? 'border-lime-500 bg-lime-500/10' 
                                : 'border-border hover:border-lime-500/50'
                            }`}
                          >
                            {t === 'light' && <Sun className="w-5 h-5" />}
                            {t === 'dark' && <Moon className="w-5 h-5" />}
                            {t === 'auto' && <Laptop className="w-5 h-5" />}
                            <span className="text-xs capitalize">{t}</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mood Color Palette */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Mood Color
                      </CardTitle>
                      <CardDescription>Choose a color that matches your mood</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-7 gap-2">
                        {Object.entries(MOOD_COLORS).map(([name, colors]) => (
                          <button
                            key={name}
                            onClick={() => setMoodColor(name as MoodColor)}
                            className={`aspect-square rounded-xl transition-all relative ${
                              moodColor === name ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : ''
                            }`}
                            style={{ 
                              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                              '--tw-ring-color': colors.primary
                            } as React.CSSProperties}
                            title={name.charAt(0).toUpperCase() + name.slice(1)}
                          >
                            {moodColor === name && (
                              <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        Current mood: <span className="font-medium capitalize">{moodColor}</span>
                      </p>
                    </CardContent>
                  </Card>

                  {/* Subscription */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        Subscription
                      </CardTitle>
                      <CardDescription>Manage your subscription plan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Sparkles className="w-3 h-3 mr-1" />
                            PRO Plan
                          </Badge>
                          <span className="text-sm font-medium">£9.99/month</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Renews on March 15, 2025</p>
                        <Progress value={65} className="h-1 mt-2" />
                        <p className="text-[10px] text-muted-foreground mt-1">65% of monthly AI credits used</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">Manage Plan</Button>
                        <Button variant="outline" size="sm" className="flex-1">Billing History</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notifications */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications
                      </CardTitle>
                      <CardDescription>Configure how you receive updates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Email Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive updates via email</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Push Notifications</p>
                          <p className="text-xs text-muted-foreground">Browser push alerts</p>
                        </div>
                        <Switch />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Task Reminders</p>
                          <p className="text-xs text-muted-foreground">Get reminded about tasks</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">AI Suggestions</p>
                          <p className="text-xs text-muted-foreground">Smart recommendations</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profile Settings */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile Details
                      </CardTitle>
                      <CardDescription>Update your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">First Name</Label>
                          <Input 
                            value={userProfile.firstName}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Enter first name"
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Last Name</Label>
                          <Input 
                            value={userProfile.lastName}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Enter last name"
                            className="mt-1" 
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Email Address</Label>
                        <Input 
                          value={userProfile.email}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                          type="email" 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Phone Number</Label>
                        <Input 
                          value={userProfile.phone}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number"
                          type="tel"  
                          className="mt-1" 
                        />
                      </div>
                      <Button className="w-full bg-lime-500 hover:bg-lime-600 text-black">
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Security */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Security
                      </CardTitle>
                      <CardDescription>Keep your account secure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-white/5 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Lock className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Password</p>
                            <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Change</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-white/5 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/20">
                            <Key className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Two-Factor Auth</p>
                            <p className="text-xs text-muted-foreground">Not enabled</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Enable</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Danger Zone */}
                <Card className="glass-card border-red-500/20">
                  <CardHeader>
                    <CardTitle className="text-base text-red-500 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Delete Account</p>
                      <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" size="sm">Delete Account</Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Emergency Modal */}
      <Dialog open={emergencyModalOpen} onOpenChange={setEmergencyModalOpen}>
        <DialogContent className="glass max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Siren className="w-5 h-5" />
              {selectedProtocol?.title || 'Emergency Protocols'}
            </DialogTitle>
            <DialogDescription>{selectedProtocol?.description}</DialogDescription>
          </DialogHeader>
          {selectedProtocol && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Steps:</p>
                <ol className="space-y-2">
                  {JSON.parse(selectedProtocol.steps || '[]').map((step: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Password Dialog */}
      <Dialog open={addPasswordOpen} onOpenChange={setAddPasswordOpen}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-lime-500" />
              Add New Password
            </DialogTitle>
            <DialogDescription>Save a new password to your vault</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Website/App Name *</Label>
                <Input
                  value={newPassword.website}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="Google"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select
                  value={newPassword.category}
                  onValueChange={(value) => setNewPassword(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Username/Email *</Label>
              <Input
                value={newPassword.username}
                onChange={(e) => setNewPassword(prev => ({ ...prev, username: e.target.value }))}
                placeholder="username@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Password *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type={showPassword === 'new' ? 'text' : 'password'}
                  value={newPassword.password}
                  onChange={(e) => setNewPassword(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(showPassword === 'new' ? null : 'new')}
                >
                  {showPassword === 'new' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    generatePassword()
                    if (generatedPassword) {
                      setNewPassword(prev => ({ ...prev, password: generatedPassword }))
                    }
                  }}
                  title="Use generated password"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              {newPassword.password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getPasswordStrength(newPassword.password).bg}`}
                      style={{ width: `${Math.min(getPasswordStrength(newPassword.password).label === 'Weak' ? 25 : getPasswordStrength(newPassword.password).label === 'Fair' ? 50 : getPasswordStrength(newPassword.password).label === 'Strong' ? 75 : 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${getPasswordStrength(newPassword.password).color}`}>
                    {getPasswordStrength(newPassword.password).label}
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Website URL</Label>
              <Input
                value={newPassword.url}
                onChange={(e) => setNewPassword(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={newPassword.notes}
                onChange={(e) => setNewPassword(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPasswordOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={addPasswordEntry}
              className="bg-lime-500 hover:bg-lime-600 text-black"
              disabled={!newPassword.website || !newPassword.username || !newPassword.password}
            >
              Save Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Up Dialog */}
      <Dialog open={signUpOpen} onOpenChange={setSignUpOpen}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-lime-500" />
              Create Account
            </DialogTitle>
            <DialogDescription>Join KaiCommand and start managing your digital life</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">First Name</Label>
                <Input
                  value={signUpForm.firstName}
                  onChange={(e) => setSignUpForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Last Name</Label>
                <Input
                  value={signUpForm.lastName}
                  onChange={(e) => setSignUpForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last name"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                value={signUpForm.email}
                onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                value={signUpForm.password}
                onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Create a strong password"
                className="mt-1"
              />
              {signUpForm.password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getPasswordStrength(signUpForm.password).bg}`}
                      style={{ width: `${Math.min(getPasswordStrength(signUpForm.password).label === 'Weak' ? 25 : getPasswordStrength(signUpForm.password).label === 'Fair' ? 50 : getPasswordStrength(signUpForm.password).label === 'Strong' ? 75 : 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${getPasswordStrength(signUpForm.password).color}`}>
                    {getPasswordStrength(signUpForm.password).label}
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Confirm Password</Label>
              <Input
                type="password"
                value={signUpForm.confirmPassword}
                onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                className="mt-1"
              />
              {signUpForm.confirmPassword && signUpForm.password !== signUpForm.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <div className="flex items-start gap-2">
              <CheckSquare className="w-4 h-4 mt-0.5 text-lime-500" />
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2">
            <Button 
              onClick={() => {
                if (signUpForm.password === signUpForm.confirmPassword && signUpForm.email && signUpForm.firstName) {
                  setUserProfile({
                    firstName: signUpForm.firstName,
                    lastName: signUpForm.lastName,
                    email: signUpForm.email,
                    phone: ''
                  })
                  setIsLoggedIn(true)
                  setSignUpOpen(false)
                  setSignUpForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
                }
              }}
              className="w-full bg-lime-500 hover:bg-lime-600 text-black"
              disabled={!signUpForm.email || !signUpForm.firstName || !signUpForm.password || signUpForm.password !== signUpForm.confirmPassword}
            >
              Create Account
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{' '}
              <button 
                className="text-lime-500 hover:underline"
                onClick={() => {
                  setSignUpOpen(false)
                  setActiveTab('settings')
                }}
              >
                Sign In
              </button>
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Floating Button & Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed z-50 ${aiExpanded ? 'inset-4 md:inset-8' : 'bottom-24 right-6 w-[400px] max-w-[calc(100vw-3rem)]'}`}
          >
            <Card className="glass-card h-full flex flex-col shadow-2xl border-purple-500/30">
              {/* Header */}
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        KaiCommand AI
                        <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0">PRO</Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Your intelligent assistant</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setAiExpanded(!aiExpanded)}
                    >
                      {aiExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={clearAiChat}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setAiModalOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {aiMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                        <Wand2 className="w-8 h-8 text-sky-400" />
                      </div>
                      <h4 className="font-semibold mb-2">How can I help you today?</h4>
                      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                        Ask me anything! I can help with tasks, answer questions, give advice, or just chat.
                      </p>
                      
                      {/* Quick Prompts */}
                      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                        {quickPrompts.slice(0, 4).map((prompt, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            className="h-auto py-2 px-3 text-xs justify-start border-white/10 hover:bg-white/5"
                            onClick={() => sendAiMessage(prompt.text)}
                          >
                            <prompt.icon className="w-3 h-3 mr-2 shrink-0" />
                            <span className="truncate">{prompt.text}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiMessages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              msg.role === 'user' 
                                ? 'bg-lime-500/20 text-lime-500' 
                                : 'bg-gradient-to-br from-lime-500 to-emerald-500 text-white'
                            }`}>
                              {msg.role === 'user' 
                                ? <span className="text-xs font-bold">
                                    {isLoggedIn && userProfile.firstName 
                                      ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase()
                                      : 'U'}
                                  </span> 
                                : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`rounded-2xl px-4 py-2 ${
                              msg.role === 'user' 
                                ? 'bg-lime-500/20 text-lime-100 rounded-tr-sm' 
                                : 'bg-white/5 rounded-tl-sm'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground">
                                  {msg.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.role === 'assistant' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 opacity-0 hover:opacity-100 transition-opacity"
                                    onClick={() => copyToClipboard(msg.content, `msg-${i}`)}
                                  >
                                    {copiedMessage === `msg-${i}` ? (
                                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                              <div className="flex gap-1">
                                <motion.div
                                  animate={{ opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                  className="w-2 h-2 bg-purple-400 rounded-full"
                                />
                                <motion.div
                                  animate={{ opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                  className="w-2 h-2 bg-purple-400 rounded-full"
                                />
                                <motion.div
                                  animate={{ opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                  className="w-2 h-2 bg-purple-400 rounded-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={aiMessagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Input Area */}
              <CardFooter className="pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 w-full">
                  {speechSupported && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`shrink-0 ${isListening ? 'text-red-400 animate-pulse' : ''}`}
                      onClick={startVoiceInput}
                      disabled={aiLoading}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                  )}
                  <div className="flex-1 relative">
                    <Input
                      ref={aiInputRef}
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder={isListening ? "Listening..." : "Ask me anything..."}
                      className="pr-10 bg-white/5 border-white/10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendAiMessage()
                        }
                      }}
                      disabled={aiLoading || isListening}
                    />
                    {!aiInput && !isListening && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
                        <Command className="w-3 h-3" />
                        <span className="text-xs">Enter</span>
                      </div>
                    )}
                  </div>
                  <Button
                    className="shrink-0 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    size="icon"
                    onClick={() => sendAiMessage()}
                    disabled={(!aiInput.trim() && !isListening) || aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Button - Desktop only */}
      {!isMobile && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAiModalOpen(!aiModalOpen)}
          className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
            aiModalOpen 
              ? 'bg-red-500/20 border border-red-500/30' 
              : 'bg-gradient-to-r from-lime-500 to-emerald-500'
          }`}
        >
          {aiModalOpen ? (
            <X className="w-6 h-6 text-red-400" />
          ) : (
            <div className="relative">
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-lime-400 rounded-full border-2 border-background animate-pulse" />
            </div>
          )}
        </motion.button>
      )}

      {/* Keyboard shortcut hint - Desktop only */}
      {!aiModalOpen && !isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="fixed bottom-24 right-6 z-40 text-xs text-muted-foreground flex items-center gap-1"
        >
          <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">K</kbd>
          <span className="ml-1">to open</span>
        </motion.div>
      )}

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelect={handleTabChange}
      />

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 mobile-nav safe-area-bottom z-50"
        >
          <div className="flex items-center justify-around py-2">
            {mobileNavItems.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all tap-target ${
                  activeTab === item.id
                    ? 'text-lime-500'
                    : 'text-muted-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-lime-500' : ''}`} />
                <span className={`text-[10px] font-medium ${activeTab === item.id ? 'text-lime-500' : ''}`}>
                  {item.label}
                </span>
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-0 w-8 h-0.5 bg-lime-500 rounded-full"
                  />
                )}
              </motion.button>
            ))}
            {/* AI Assistant Button in Mobile Nav */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setAiModalOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all tap-target text-lime-500"
            >
              <div className="relative">
                <Bot className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
              </div>
              <span className="text-[10px] font-medium text-lime-500">AI</span>
            </motion.button>
          </div>
        </motion.nav>
      )}
    </div>
  )
}
