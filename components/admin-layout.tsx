"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  Settings,
  Car,
  File,
  FileText,
  Code
} from "lucide-react"

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Vehicles",
      href: "/admin/vehicles",
      icon: <Car className="h-5 w-5" />,
    },
    {
      name: "OBD2 Codes",
      href: "/admin/obd2-codes",
      icon: <Code className="h-5 w-5" />,
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm fixed top-0 bottom-0 left-0 z-10">
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b">
            <h2 className="text-xl font-bold">VOS Admin</h2>
          </div>
          <nav className="flex-1 overflow-auto py-4 px-3">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:bg-gray-100",
                      pathname === item.href ? "bg-gray-100 font-medium" : "text-gray-700"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 text-center border-t text-sm text-gray-500">
            Vehicle Offer Service v1.0
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
} 