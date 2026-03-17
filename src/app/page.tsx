'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
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
  Sun,
  Moon,
  Coffee,
  Lock,
  Unlock,
  BadgeCheck,
  Brain,
  Check,
  RotateCcw,
  Flame,
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
  UserPlus,
  Phone,
  Leaf,
  FileText,
  Scale
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import {
  DashboardView,
  WorkContextView,
  VoiceNotesView,
  CertificationsView,
  EmergencyView,
  AppManagerView,
  EmailHubView,
  FinanceView,
  PasswordVaultView,
  SettingsView
} from '@/components/views'
import { LifeManagerView } from '@/components/views/LifeManagerView'
import { SmartNotesView } from '@/components/views/SmartNotesView'
import { LegalRadarView } from '@/components/views/LegalRadarView'

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
import { PromptStudioView } from '@/components/PromptStudioView'

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
  toolResults?: any[]
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

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'prompt-studio', label: 'Prompt Studio', icon: Wand2 },
  { id: 'context', label: 'Work Context', icon: MapPin },
  { id: 'legal-radar', label: 'Legal Radar', icon: Scale },
  { id: 'voice-notes', label: 'Voice Notes', icon: Mic },
  { id: 'smart-notes', label: 'Smart Notes', icon: FileText },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'emergency', label: 'Emergency', icon: Siren },
  { id: 'network', label: 'Life Manager', icon: UserPlus },
  { id: 'apps', label: 'App Manager', icon: AppWindow },
  { id: 'emails', label: 'Email Hub', icon: Mail },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'passwords', label: 'Password Vault', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings }
]

// Mobile bottom navigation (most used items)
const mobileNavItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'prompt-studio', label: 'Prompts', icon: Wand2 },
  { id: 'apps', label: 'Apps', icon: AppWindow },
  { id: 'passwords', label: 'Vault', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings }
]

// Professional context colors
const CONTEXT_COLORS: Record<string, string> = {
  healthcare: 'bg-emerald-500',
  electrical: 'bg-amber-500',
  development: 'bg-purple-500',
  farming: 'bg-lime-500'
}

const CONTEXT_ICONS: Record<string, any> = {
  healthcare: HeartPulse,
  electrical: Zap,
  development: Code,
  farming: Leaf
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
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  
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
  
  // Auth (NextAuth) – sign-in state is driven by session
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const [profileImage, setProfileImage] = useState<string>('')
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [signInOpen, setSignInOpen] = useState(false)
  const [signInCredentials, setSignInCredentials] = useState({ email: '', password: '' })
  const [signInError, setSignInError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync profile from session when authenticated (refactored to an async effect update to avoid synchronous cascades, or handled defensively)
  useEffect(() => {
    let active = true
    if (session?.user) {
      const name = session.user.name ?? session.user.email ?? ''
      const parts = name.split(' ')
      const updatedProfile = {
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' ') ?? '',
        email: session.user.email ?? '',
        phone: ''
      }
      if (active) {
        setTimeout(() => {
          setUserProfile(updatedProfile)
        }, 0)
      }
    }
    return () => { active = false }
  }, [session?.user])
  
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
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailType | null>(null)
  // Form states
  const [newTask, setNewTask] = useState({ name: '', description: '', category: 'maintenance', scheduleType: 'daily' })

  // Professional data states
  const [workContexts, setWorkContexts] = useState<WorkContextType[]>([])
  const [voiceNotes, setVoiceNotes] = useState<VoiceNoteType[]>([])
  const [smartNotes, setSmartNotes] = useState<any[]>([])
  const [certifications, setCertifications] = useState<CertificationType[]>([])
  const [emergencyProtocols, setEmergencyProtocols] = useState<EmergencyProtocolType[]>([])
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippetType[]>([])
  const [currentContext, setCurrentContext] = useState<string>('development')
  const [energyLevel, setEnergyLevel] = useState(7)
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<EmergencyProtocolType | null>(null)

  // AI Assistant states
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiExpanded, setAiExpanded] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string; timestamp: Date; toolResults?: any[] }>>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [criticMode, setCriticMode] = useState(false)
  const [mindMapOpen, setMindMapOpen] = useState(false)
  const [selectedMindMapMsg, setSelectedMindMapMsg] = useState<ChatMessageType | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [phoneMode, setPhoneMode] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)
  const aiInputRef = useRef<HTMLInputElement>(null)
  const aiMessagesEndRef = useRef<HTMLDivElement>(null)

  // Password Vault: persisted via API
  const { data: passwordsData, isLoading: passwordsLoading } = usePasswords()
  const passwords = (passwordsData ?? []) as PasswordEntryType[]
  const addPasswordMutation = useAddPassword()
  const deletePasswordMutation = useDeletePassword()
  // Password Generator states
  const [passwordOptions, setPasswordOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })
  
  // Missing generic states stripped by greedy regex
  const [addAppOpen, setAddAppOpen] = useState(false)
  const [newApp, setNewApp] = useState({ name: '', description: '', category: 'Other' })
  const [selectedApp, setSelectedApp] = useState<AppType | null>(null)
  
  // Wellbeing/Focus states missing
  const [focusActive, setFocusActive] = useState(false)
  const [breathingActive, setBreathingActive] = useState(false)

  // Sign Up states
  const [signUpOpen, setSignUpOpen] = useState(false)
  const [signUpForm, setSignUpForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false)

  // Digest for dashboard (while you were away + suggestions)
  const { data: digest } = useDigest(activeTab === 'dashboard')

  // Quick prompts for AI assistant (including "Argue the other side")
  const quickPrompts = [
    { icon: Lightbulb, text: "What can you help me with?", category: "help" },
    { icon: Zap, text: "Quick summary of my day", category: "summary" },
    { icon: Brain, text: "Start a brain training session", category: "wellness" },
    { icon: DollarSign, text: "How's my budget looking?", category: "finance" },
    { icon: Briefcase, text: "Switch to work context", category: "context" },
    { icon: Scale, text: "Check legal compliance for Malawian agriculture", category: "legal" },
    { icon: HelpCircle, text: "What's my current context?", category: "context" },
    { icon: MessageCircle, text: "Argue the other side of my last message", category: "devil_advocate" },
  ]

  // Speech recognition & TTS setup
  useEffect(() => {
    let active = true
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition && active) {
        Promise.resolve().then(() => setSpeechSupported(true))
      }

      // Load human-like voices for TTS
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        if (active) {
          setAvailableVoices(voices)
          if (voices.length > 0) {
            // Find a good english voice (like Apple's Daniel/Samantha or Google's default)
            const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Google US English'))
            const defaultVoice = preferred || voices.find(v => v.lang.startsWith('en')) || voices[0]
            setSelectedVoice(defaultVoice.name)
          }
        }
      }
      if ('speechSynthesis' in window) {
        loadVoices()
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }
    return () => { active = false }
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

  // Hydration-safe clock
  useEffect(() => {
    setCurrentTime(prev => new Date())
    const timer = setInterval(() => setCurrentTime(prev => new Date()), 1000)
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

  // Smart Notes now manages its own data fetching internally

  const professionalTabs = ['context', 'voice-notes', 'certifications', 'emergency']
  useEffect(() => {
    if (!professionalTabs.includes(activeTab)) return
    const fetchProfessional = async () => {
      try {
        const professionalRes = await fetch('/api/professional')
        const professionalData = await professionalRes.json()
        if (professionalData.success) {
          setWorkContexts(professionalData.contexts || [])
          setVoiceNotes(professionalData.voiceNotes || [])
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

  const addActivityLog = (type: string, description: string) => {
    // In a real app this would post to an audit log endpoint
    console.log(`[ACTIVITY LOG] ${type}: ${description}`)
  }

  // Add app function
  const addAppParent = async (newApp: any) => {
    if (!newApp.name) return
    const app = {
      id: Date.now().toString(),
      ...newApp,
      status: 'healthy',
      version: '1.0.0',
      uptime: 100,
      responseTime: 150
    }
    setApps([...apps, app])
    addActivityLog('added_app', 'Added new application')
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
  const submitVoiceNoteParent = async (text: string, audioUrl?: string) => {
    try {
      const res = await fetch('/api/professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-voice-note',
          transcript: text,
          audioUrl,
          duration: 0
        })
      })
      const data = await res.json()
      if (data.success && data.note) {
        setVoiceNotes([data.note, ...voiceNotes])
        // If it also created a smart note, optimally we re-fetch them or we just rely on activeTab to re-fetch
      }
    } catch (err) {
      console.error('Failed to submit voice note:', err)
    }
  }

  const deleteVoiceNoteParent = async (id: string) => {
    try {
      const res = await fetch(`/api/professional?type=voice-note&id=${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setVoiceNotes(prev => prev.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete voice note', error)
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
          criticMode,
          voiceMode: false
        })
      })
      const data = await res.json().catch(() => ({ success: false, error: 'Invalid response from server' }))

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          toolResults: data.toolResults
        }
        setAiMessages(prev => [...prev, assistantMessage])

        // Phone Mode: Text-to-Speech
        if (phoneMode && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(data.message)
          const voice = availableVoices.find(v => v.name === selectedVoice)
          if (voice) utterance.voice = voice
          
          utterance.onend = () => {
             // If still in phone mode after speaking, start listening again
             if (phoneMode) {
               startVoiceInput()
             }
          }
          window.speechSynthesis.speak(utterance)
        }

        // Handle actions
        if (data.action) {
          handleAiAction(data.action)
        }
      } else {
        const errorText = data.error || (res.ok ? 'Something went wrong.' : `Request failed (${res.status}).`)
        setAiMessages(prev => [...prev, {
          role: 'assistant',
          content: errorText,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('AI chat error:', error)
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please check your connection and try again.",
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
        setFocusActive(true)
        break
      case 'startBreathing':
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
  

  // Copy password to clipboard
  

  // Add new password entry (persisted via API)
  const addPasswordEntryAction = async (newPassword: any) => {
    // In a real app, this would send an encrypted payload to the server
    addPasswordMutation.mutate(newPassword)
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

        <div className="absolute bottom-4 left-4 right-4 hidden md:block z-50">
          {isLoggedIn ? (
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profileImage} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-blue-500 text-white text-xs">
                      {userProfile.firstName ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase() : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : 'Guest'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {userProfile.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2 p-3 bg-card/50 backdrop-blur-md rounded-xl border border-border/50">
              <Button 
                onClick={() => { setSignInError(null); setSignInOpen(true) }} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <LogIn className="w-4 h-4 mr-2" /> Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSignUpOpen(true)} 
                className="w-full bg-background hover:bg-accent border-border/50 text-foreground transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" /> Create Account
              </Button>
            </div>
          )}
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
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {currentTime ? (
                    <>Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}!</>
                  ) : (
                    <>Welcome!</>
                  )}
                </h2>
                <p className="text-muted-foreground font-medium text-sm flex items-center gap-2 mt-1">
                  {currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  <span className="w-1 h-1 rounded-full bg-border" />
                  {currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
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
              <DashboardView 
                handleTabChange={handleTabChange}
                setEmergencyModalOpen={setEmergencyModalOpen}
                tasks={tasks}
                apps={apps}
                emails={emails}
                financeSummary={financeSummary}
                digest={digest}
              />
            )}

            {/* Work Context Tab */}
            {activeTab === 'context' && (
              <WorkContextView
                workContexts={workContexts}
                switchContext={switchContext}
              />
            )}
            
            {/* Legal Radar Tab */}
            {activeTab === 'legal-radar' && (
              <LegalRadarView alerts={[]} />
            )}

            {/* Voice Notes Tab */}
            {activeTab === 'voice-notes' && (
              <VoiceNotesView
                voiceNotes={voiceNotes}
                submitVoiceNoteParent={submitVoiceNoteParent}
                deleteVoiceNoteParent={deleteVoiceNoteParent}
              />
            )}

            {/* Smart Notes Tab */}
            {activeTab === 'smart-notes' && (
              <SmartNotesView />
            )}

            {/* Certifications Tab */}
            {activeTab === 'certifications' && (
              <CertificationsView certifications={certifications} formatDate={formatDate} />
            )}

            {/* Emergency Tab */}
            {activeTab === 'emergency' && (
              <EmergencyView 
                emergencyProtocols={emergencyProtocols}
                setSelectedProtocol={setSelectedProtocol}
                setEmergencyModalOpen={setEmergencyModalOpen}
              />
            )}

            {/* Life Manager (Network) Tab */}
            {activeTab === 'network' && (
              <LifeManagerView />
            )}

            {/* App Manager Tab */}
            {activeTab === 'apps' && (
              <AppManagerView 
                apps={apps}
                addAppParent={addAppParent}
                deleteApp={deleteApp}
                getStatusColor={getStatusColor}
                getStatusBadge={getStatusBadge}
              />
            )}

            {/* Email Hub Tab */}
            {activeTab === 'emails' && (
              <EmailHubView
                emails={emails}
                emailStats={emailStats}
                markEmailRead={markEmailRead}
                getProviderIcon={getProviderIcon}
                formatDate={formatDate}
              />
            )}

            {/* Finance Tab */}
            {activeTab === 'finance' && (
              <FinanceView
                financeSummary={financeSummary}
                transactions={transactions}
                formatDate={formatDate}
              />
            )}

            {/* Password Vault Tab */}
            {activeTab === 'passwords' && (
              <PasswordVaultView
                passwords={passwords}
                passwordsLoading={passwordsLoading}
                addPasswordEntry={addPasswordEntryAction}
                deletePasswordEntry={deletePasswordEntry}
              />
            )}

            {/* Prompt Studio Tab */}
            {activeTab === 'prompt-studio' && (
              <PromptStudioView />
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
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="w-full sm:w-auto tap-target"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                          </Button>
                        ) : (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                              size="sm" 
                              onClick={() => { setSignInError(null); setSignInOpen(true) }} 
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
                      
                      {/* Voice Selection */}
                      <div className="pt-4 mt-2 border-t border-border/50">
                        <Label className="text-xs mb-2 block">AI Voice (Phone Mode)</Label>
                        <select 
                          className="w-full bg-background border border-border/50 rounded-md p-2 text-sm focus:ring-lime-500 outline-none"
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                        >
                          {availableVoices.map(v => (
                            <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                          ))}
                        </select>
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
                      <div className="flex flex-col gap-3 p-3 rounded-lg bg-white/5 dark:bg-white/5 border border-border/50 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                              <Lock className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Password</p>
                              <p className="text-xs text-muted-foreground">Keep your account secure</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setPasswordChangeOpen(!passwordChangeOpen)}>
                            {passwordChangeOpen ? 'Cancel' : 'Change'}
                          </Button>
                        </div>
                        
                        <AnimatePresence>
                          {passwordChangeOpen && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 pt-3 border-t border-border/50">
                                <div>
                                  <Label className="text-xs">Current Password</Label>
                                  <Input type="password" placeholder="••••••••" className="mt-1" />
                                </div>
                                <div>
                                  <Label className="text-xs">New Password</Label>
                                  <Input type="password" placeholder="••••••••" className="mt-1" />
                                </div>
                                <div>
                                  <Label className="text-xs">Confirm New Password</Label>
                                  <Input type="password" placeholder="••••••••" className="mt-1" />
                                </div>
                                <Button 
                                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white mt-2" 
                                  onClick={() => {
                                    // Visual success feedback
                                    setPasswordChangeOpen(false)
                                  }}
                                >
                                  Update Password
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
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



      {/* Sign In Dialog – uses NextAuth credentials */}
      <Dialog open={signInOpen} onOpenChange={(open) => { setSignInOpen(open); if (!open) setSignInError(null) }}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-lime-500" />
              Sign In
            </DialogTitle>
            <DialogDescription>Use your email and password to sign in. Ask your admin for the demo password if needed.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setSignInError(null)
              const res = await signIn('credentials', {
                email: signInCredentials.email,
                password: signInCredentials.password,
                redirect: false,
                callbackUrl: '/'
              })
              if (res?.error) {
                setSignInError('Invalid email or password')
                return
              }
              if (res?.ok) {
                setSignInOpen(false)
                setSignInCredentials({ email: '', password: '' })
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={signInCredentials.email}
                onChange={(e) => setSignInCredentials(prev => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                value={signInCredentials.password}
                onChange={(e) => setSignInCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Password"
                className="mt-1"
                required
              />
            </div>
            {signInError && (
              <p className="text-sm text-red-500">{signInError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSignInOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-lime-500 hover:bg-lime-600 text-black">
                Sign In
              </Button>
            </DialogFooter>
          </form>
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
                  setSignUpOpen(false)
                  setSignInCredentials(prev => ({ ...prev, email: signUpForm.email, password: signUpForm.password }))
                  setSignInOpen(true)
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
                              
                              {/* Agentic Execution UI Indicators */}
                              {msg.toolResults && msg.toolResults.length > 0 && (
                                <div className="mt-2 flex flex-col gap-1.5 border-t border-white/10 pt-2">
                                  {msg.toolResults.map((tr: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-1 rounded w-fit border border-emerald-500/20 shadow-sm backdrop-blur-md">
                                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                                      <span className="font-mono tracking-tight uppercase">EXEC: {tr.name.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

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
                                {msg.role === 'assistant' && msg.toolResults && msg.toolResults.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 opacity-0 hover:opacity-100 transition-opacity text-purple-400 ml-1"
                                    title="View Thought Process"
                                    onClick={() => {
                                      setSelectedMindMapMsg(msg)
                                      setMindMapOpen(true)
                                    }}
                                  >
                                    <Brain className="w-3 h-3" />
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`shrink-0 transition-colors ${criticMode ? 'text-orange-500 bg-orange-500/10' : 'text-muted-foreground'}`}
                    onClick={() => setCriticMode(!criticMode)}
                    title={criticMode ? "Fierce Critic Mode: ON" : "Enable Critic Mode"}
                  >
                    <Flame className="w-5 h-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`shrink-0 transition-colors ${phoneMode ? 'text-lime-500 bg-lime-500/10 animate-pulse' : 'text-muted-foreground'}`}
                    onClick={() => {
                      setPhoneMode(!phoneMode)
                      if (!phoneMode) {
                        toast({ title: "Phone Mode On", description: "KaiCommand will speak responses and listen continuously." })
                        startVoiceInput()
                      } else {
                        window.speechSynthesis.cancel()
                      }
                    }}
                    title={phoneMode ? "Phone Mode: ON" : "Enable Phone Mode"}
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
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

      {/* Mind Map Decision Flow Modal */}
      <Dialog open={mindMapOpen} onOpenChange={setMindMapOpen}>
        <DialogContent className="sm:max-w-[600px] border-white/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Brain className="w-5 h-5 text-purple-400" />
              Thought Process & Executions
            </DialogTitle>
            <DialogDescription>
              A visual flow of how KaiCommand arrived at this response.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center space-y-6">
            
            {/* 1. Context Trigger */}
            <div className="flex flex-col items-center w-full">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Input Received & Context Loaded</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">System aligned with current work mode ({currentContext}) and processed prompt.</p>
                </div>
              </div>
            </div>

            <div className="w-px h-6 bg-gradient-to-b from-white/10 to-purple-500/50" />

            {/* 2. Reasoning Loop */}
            <div className="flex flex-col items-center w-full">
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <h4 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  Agent Execution Loop
                </h4>
                
                <div className="space-y-3 pl-2 border-l-2 border-white/5 ml-2">
                  {selectedMindMapMsg?.toolResults?.map((tr, idx) => (
                    <div key={idx} className="relative pl-4">
                      <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                      <div className="bg-black/20 rounded border border-white/5 p-2 text-xs backdrop-blur-sm">
                        <span className="text-emerald-400 font-mono font-semibold">TRIGGER: {tr.name}</span>
                        <div className="mt-1 text-muted-foreground truncate opacity-90 font-mono text-[10px]">
                          Result: {JSON.stringify(tr.result).substring(0, 100)}...
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selectedMindMapMsg?.toolResults || selectedMindMapMsg.toolResults.length === 0) && (
                    <div className="text-xs text-muted-foreground italic pl-4">No tools triggered for this interaction.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-px h-6 bg-gradient-to-b from-purple-500/50 to-white/10" />

            {/* 3. Output */}
            <div className="flex flex-col items-center w-full">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full flex items-center gap-4">
                <div className="p-3 rounded-full bg-lime-500/20 text-lime-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Synthesis & Formatting</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">Aggregated tool outputs into final response delivery.</p>
                </div>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
