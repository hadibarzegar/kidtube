'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Tv,
  Film,
  FolderOpen,
  Baby,
  Cog,
  Users,
  LogOut,
} from 'lucide-react'

const navLinks = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Channels', href: '/channels', icon: Tv },
  { label: 'Episodes', href: '/episodes', icon: Film },
  { label: 'Categories', href: '/categories', icon: FolderOpen },
  { label: 'Age Groups', href: '/age-groups', icon: Baby },
  { label: 'Jobs', href: '/jobs', icon: Cog },
  { label: 'Users', href: '/users', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-sidebar text-sidebar-foreground flex flex-col z-10">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
          <Tv className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight">KidTube</span>
        <span className="text-xs font-medium text-sidebar-foreground/60 ml-0.5">Admin</span>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5">
          {navLinks.map(({ label, href, icon: Icon }) => {
            const fullHref = '/admin' + href
            const isActive =
              href === '/'
                ? pathname === '/admin' || pathname === '/admin/'
                : pathname === fullHref || pathname.startsWith(fullHref + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Sign out */}
      <div className="px-3 py-3">
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground px-3"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  )
}
