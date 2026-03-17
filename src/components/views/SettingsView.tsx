'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Edit, LogOut, LogIn, UserPlus, Sun, Moon, Laptop, Palette, Crown, Check, Sparkles } from 'lucide-react'
import { useTheme, MOOD_COLORS } from '@/lib/theme-context'
import type { MoodColor } from '@/lib/theme-context'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface SettingsViewProps {
  userProfile: UserProfile
  profileImage: string
  isLoggedIn: boolean
  setProfileImage: (image: string) => void
  setSignInOpen: (open: boolean) => void
  setSignUpOpen: (open: boolean) => void
  signOut: (options?: any) => void
  setSignInError: (error: string | null) => void
}

export function SettingsView({
  userProfile,
  profileImage,
  isLoggedIn,
  setProfileImage,
  setSignInOpen,
  setSignUpOpen,
  signOut,
  setSignInError
}: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme, moodColor, setMoodColor, resolvedTheme } = useTheme()

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

  return (
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
      </div>
    </motion.div>
  )
}
