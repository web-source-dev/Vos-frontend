"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Plus, Trash2 } from "lucide-react"
import api from "@/lib/api"
import type { User as UserType } from "@/lib/types"

export function UserManagement() {
  const [users, setUsers] = useState<UserType[]>([])
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      let response
      if (roleFilter === "all") {
        // Fetch all roles
        const roles = ["admin", "agent", "estimator", "inspector"]
        const allUsers: UserType[] = []
        for (const role of roles) {
          response = await api.getUsersByRole(role)
          if (response.success && response.data) {
            allUsers.push(...response.data)
          }
        }
        setUsers(allUsers)
      } else {
        response = await api.getUsersByRole(roleFilter)
        if (response.success && response.data) {
          setUsers(response.data)
        }
      }
    } catch (error) {
      console.log(error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [roleFilter])
  useEffect(() => {
    fetchUsers()
  }, [roleFilter, fetchUsers])

 

  const filteredUsers = users.filter((user) => {
    return (
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button variant="outline" size="sm" disabled>
          <Plus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="estimator">Estimator</SelectItem>
            <SelectItem value="inspector">Inspector</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id || user._id}>
                      <td className="px-4 py-2 whitespace-nowrap flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Badge variant="outline">{user.role}</Badge>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{user.location || "-"}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <Button variant="ghost" size="icon" disabled>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 