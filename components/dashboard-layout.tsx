"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  FileText, 
  Settings, 
  LogOut,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, loading, isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  // Authentication validation
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated])

  // Show loading state while checking authentication
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

  // Don't render the layout if user is not authenticated
  if (!isAuthenticated) {
    return null
  }

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, current: true },
    { name: "Customers", href: "/customer", icon: Users, current: false },
    { name: "Vehicles", href: "/vehicles", icon: Car, current: false },
    { name: "Reports", href: "/reports", icon: FileText, current: false },
    { name: "Settings", href: "/settings", icon: Settings, current: false },
  ]

  function getInitials(firstName: string, lastName: string) {
    console.log(sidebarOpen)
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <SidebarProvider defaultOpen={false} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold hidden sm:block">VOS System</h1>
              <h1 className="text-lg font-semibold sm:hidden">VOS</h1>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <Link href={item.href} className="w-full">
                    <SidebarMenuButton
                      className={`w-full justify-start gap-3 ${
                        item.current ? "bg-blue-50 text-blue-700" : ""
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="hidden sm:inline">{item.name}</span>
                      <span className="sm:hidden text-xs">{item.name}</span>
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
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left hidden sm:block">
                        <span className="text-sm font-medium truncate">{`${user.firstName} ${user.lastName}`}</span>
                        <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                      </div>
                      <div className="flex flex-col text-left sm:hidden">
                        <span className="text-xs font-medium truncate">{`${user.firstName} ${user.lastName}`}</span>
                        <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-auto flex-shrink-0" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />Profile
                  </DropdownMenuItem>
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
            <div className="flex items-center gap-2 flex-1">
              <h2 className="text-lg font-semibold hidden sm:block">Dashboard</h2>
              <h2 className="text-base font-semibold sm:hidden">Dashboard</h2>
            </div>
            <div className="flex items-center gap-2">
              {user && user.role === "admin" && (
                <Badge className="hidden sm:inline-flex" variant="secondary">Admin</Badge>
              )}
              {user && user.role === "admin" && (
                <Badge className="sm:hidden" variant="secondary">A</Badge>
              )}
              {!user && (
                <div className="ml-auto">
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="hidden sm:inline-flex">Sign in</Button>
                    <Button variant="outline" size="sm" className="sm:hidden">Login</Button>
                  </Link>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 p-0 overflow-x-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 