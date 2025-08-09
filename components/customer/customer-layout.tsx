"use client"

import { ReactNode, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  User as UserIcon,
  KeyRound,
  Car,
  LogOut,
  ChevronDown,
} from "lucide-react"

interface LayoutProps {
  children: ReactNode
}

export function CustomerLayout({ children }: LayoutProps) {
  const { user, logout, loading, isAuthenticated, isCustomer } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login")
        return
      }
      if (!isCustomer) {
        router.push("/")
        return
      }
    }
  }, [loading, isAuthenticated, isCustomer, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isCustomer) {
    return null
  }

  const navigation = [
    { name: "Dashboard", href: "/customer-dashboard", icon: LayoutDashboard, current: pathname === "/customer-dashboard" },
    { name: "Profile", href: "/customer-dashboard/profile", icon: UserIcon, current: pathname === "/customer-dashboard/profile" },
    { name: "Change Password", href: "/customer-dashboard/change-password", icon: KeyRound, current: pathname === "/customer-dashboard/change-password" },
  ]

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName && user?.email) return user.email.substring(0, 2).toUpperCase()
    return `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase()
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Vin On Spot</h1>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <Link href={item.href} className="w-full">
                    <SidebarMenuButton className={`w-full justify-start gap-3 ${item.current ? "bg-blue-50 text-blue-700" : ""}`}>
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start px-2">
                    <div className="flex items-center gap-2 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium">{user.firstName || user.email}</span>
                        <span className="text-xs text-muted-foreground">Customer</span>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="h-4 w-4 mr-2" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
            <SidebarTrigger className="-ml-2" />
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
          </header>

          <main className="flex-1 p-0">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}


