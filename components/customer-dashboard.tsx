"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, LayoutGrid, List, Plus, Car, User, Clock, CheckCircle, Users, Trash2, Mail, Send, Copy, Check, ArrowUp, ArrowDown, Menu, XCircle, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface CustomerData {
  _id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  stats: {
    totalCases: number
    completedCases: number
    totalValue: number
  lastActivity?: {
    timestamp: string
      caseId: string
      status: string
    }
  }
}

export function CustomerDashboard() {
  const [viewMode, setViewMode] = useState<"cards" | "list">("list")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [formUrl, setFormUrl] = useState("")
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const { isAdmin,user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.getCustomers();
        if (response.success) {
          setCustomers(response.data || []);
        } else {
          setError("Failed to fetch customers");
        }
      } catch (err) {
        setError("Error loading customers");
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "totalCases":
          aValue = a.stats.totalCases;
          bValue = b.stats.totalCases;
          break;
        case "totalValue":
          aValue = a.stats.totalValue;
          bValue = b.stats.totalValue;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a.firstName.toLowerCase();
          bValue = b.firstName.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
        } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [customers, searchTerm, sortBy, sortOrder]);

  const handleSendCustomerForm = async () => {
    if (!customerEmail || !customerName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await api.sendCustomerIntakeEmail(customerEmail, customerName);
      if (response.success) {
        setFormUrl(response.data?.formUrl || "");
        toast({
          title: "Success",
          description: "Customer form email sent successfully",
        });
        setIsEmailModalOpen(false);
        setCustomerEmail("");
        setCustomerName("");
      } else {
      toast({
        title: "Error",
          description: response.error || "Failed to send email",
        variant: "destructive",
      });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setIsLinkCopied(true);
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleOpenModal = () => {
    setIsEmailModalOpen(true);
    setFormUrl("");
    setIsLinkCopied(false);
  };

  const getStatusBadgeColor = (status: string) => {
    const statusConfig = {
      "completed": "bg-green-100 text-green-800",
      "active": "bg-blue-100 text-blue-800",
      "scheduled": "bg-yellow-100 text-yellow-800",
      "quote-ready": "bg-purple-100 text-purple-800",
      "negotiating": "bg-orange-100 text-orange-800",
      "quote-declined": "bg-red-100 text-red-800",
      "cancelled": "bg-gray-100 text-gray-800",
      "new": "bg-gray-100 text-gray-800",
    };
    return statusConfig[status as keyof typeof statusConfig] || "bg-gray-100 text-gray-800";
  };

  const handleViewCustomer = (customerId: string) => {
    if (user?.role === "agent") {
      router.push(`/agent/customers/${customerId}`)
    } else if (user?.role === "estimator") {
      router.push(`/estimator/customers/${customerId}`)
    } else if (user?.role === "admin") {
      router.push(`/admin/customers/${customerId}`)
    } else {
      router.push(`/customers/${customerId}`)
    }
  }

  const CustomerCard = ({ customer }: { customer: CustomerData }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {customer.firstName} {customer.lastName}
              </h3>
              <p className="text-sm text-gray-600">{customer.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
              <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                router.push(`/customers/${customer._id}`);
                }}
              title="View customer details"
              >
              <Eye className="h-4 w-4" />
              </Button>
          </div>
          </div>
          
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{customer.stats.totalCases}</p>
            <p className="text-xs text-gray-600">Total Cases</p>
                </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              ${customer.stats.totalValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">Total Value</p>
                </div>
            </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Member since: {new Date(customer.createdAt).toLocaleDateString()}
              </span>
          {customer.stats.lastActivity && (
            <Badge className={getStatusBadgeColor(customer.stats.lastActivity.status)}>
              {customer.stats.lastActivity.status}
            </Badge>
          )}
            </div>

        {customer.stats.lastActivity && (
          <div className="text-xs text-muted-foreground mt-2">
            Last activity: {new Date(customer.stats.lastActivity.timestamp).toLocaleDateString()}
            </div>
        )}
          </CardContent>
        </Card>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
        <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage all customer accounts</p>
          </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/customer/new")} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
            New Customer
              </Button>
          <Button onClick={handleOpenModal} className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Send Form Email
              </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
            <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
              <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

        <Card>
            <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.reduce((sum, customer) => sum + customer.stats.totalCases, 0)}
                </p>
                </div>
              <Car className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

        <Card>
            <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Completed Cases</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.reduce((sum, customer) => sum + customer.stats.completedCases, 0)}
                  </p>
                </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

        <Card>
            <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${customers.reduce((sum, customer) => sum + customer.stats.totalValue, 0).toLocaleString()}
                </p>
                </div>
              <Check className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
                </div>
                </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="totalCases">Total Cases</SelectItem>
              <SelectItem value="totalValue">Total Value</SelectItem>
              <SelectItem value="createdAt">Join Date</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "cards" ? "list" : "cards")}
          >
            {viewMode === "cards" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
              </div>
        </div>

      {/* Customer List/Grid */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer._id} customer={customer} />
            ))}
          </div>
        ) : (
        <div className="space-y-4">
              {filteredCustomers.map((customer) => (
            <Card key={customer._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                      <h3 className="font-semibold">
                        {customer.firstName} {customer.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{customer.stats.totalCases}</p>
                      <p className="text-xs text-gray-600">Cases</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        ${customer.stats.totalValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600">Value</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600">Joined</p>
                    </div>
                            <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCustomer(customer._id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                            </Button>
                          </div>
                </div>
              </CardContent>
            </Card>
          ))}
                </div>
      )}

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600">
            {searchTerm ? "Try adjusting your search terms." : "No customers have been added yet."}
          </p>
              </div>
      )}

      {/* Email Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Customer Form Email</DialogTitle>
            <DialogDescription>
              Send a customer intake form email to a potential customer.
            </DialogDescription>
          </DialogHeader>

          {!formUrl ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter customer email"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
              Cancel
            </Button>
                <Button onClick={handleSendCustomerForm} disabled={isSendingEmail}>
                  {isSendingEmail ? "Sending..." : "Send Email"}
            </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800">
                    Email sent successfully! Share this form link with the customer:
                  </p>
          </div>
                <div className="flex items-center space-x-2">
                  <Input value={formUrl} readOnly />
                  <Button onClick={handleCopyLink} variant="outline">
                    {isLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsEmailModalOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
