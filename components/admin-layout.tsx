"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
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
  Users,
  FileText,
  Code,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  User,
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

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, current: pathname === "/admin" },
    { name: "User Management", href: "/admin/users", icon: Users, current: pathname === "/admin/users" },
    { name: "Customers", href: "/admin/customers", icon: Users, current: pathname === "/admin/customers" },
    { name: "OBD2 Codes", href: "/admin/obd2-codes", icon: Code, current: pathname === "/admin/obd2-codes" },
    { name: "Reports", href: "/admin/reports", icon: FileText, current: pathname === "/admin/reports" },
  ]

  function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-semibold">VOS Admin</h1>
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
                        <span className="text-sm font-medium">{`${user.firstName} ${user.lastName}`}</span>
                        <span className="text-xs text-muted-foreground">{user.role}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
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
              <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            </div>
            {user && (
              <Badge className="ml-auto mr-4" variant="secondary">
                <User className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </header>

          <main className="flex-1 p-0">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 