"use client"
import { CustomerDashboard } from '@/components/customer-dashboard'
import { AdminLayout } from '@/components/admin-layout'

export default function VosSystem() {


  return (
    <AdminLayout>
      <CustomerDashboard />
    </AdminLayout>
  )
}
