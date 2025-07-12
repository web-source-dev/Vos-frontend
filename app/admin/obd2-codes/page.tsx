"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Plus, FileText, Trash2, Edit, Search } from "lucide-react";

// Define OBD2 code interface
interface OBD2Code {
  _id: string;
  code: string;
  description: string;
  codeType: string;
  commonCauses: string;
  criticality: number;
  estimatedRepairCost: string;
  createdAt: string;
  updatedAt: string;
}

export default function OBD2CodesAdminPage() {
  // State for code list and pagination
  const [codes, setCodes] = useState<OBD2Code[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCodes, setTotalCodes] = useState<number>(0);

  // State for add/edit dialog
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentCode, setCurrentCode] = useState<Partial<OBD2Code>>({
    code: '',
    description: '',
    codeType: '',
    commonCauses: '',
    criticality: 3,
    estimatedRepairCost: ''
  });
  const { toast } = useToast();

  // Fetch codes on component mount
  useEffect(() => {
    fetchCodes();
  }, [page, searchTerm]);

  // Fetch codes from API
  const fetchCodes = async () => {
    setLoading(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/obd2?page=${page}&limit=50${searchTerm ? `&search=${searchTerm}` : ''}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch OBD2 codes');
      }

      const data = await response.json();
      
      if (data.success) {
        setCodes(data.data);
        setTotalPages(data.pages);
        setTotalCodes(data.total);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch codes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching OBD2 codes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add or update code
  const handleSaveCode = async () => {
    // Validate required fields
    if (!currentCode.code || !currentCode.description || !currentCode.criticality) {
      toast({
        title: "Validation Error",
        description: "Code, description, and criticality are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/obd2${editMode && currentCode._id ? `/${currentCode._id}` : ''}`;
      
      const response = await fetch(apiUrl, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentCode),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save code');
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: editMode ? "Code Updated" : "Code Added",
          description: `Successfully ${editMode ? 'updated' : 'added'} OBD2 code ${currentCode.code}`,
        });
        
        setDialogOpen(false);
        fetchCodes();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving OBD2 code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Delete code
  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this code?')) {
      return;
    }
    
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/obd2/${id}`;
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete code');
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Code Deleted",
          description: "Successfully deleted OBD2 code",
        });
        
        fetchCodes();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting OBD2 code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const getCriticalityLabel = (level: number) => {
    switch (level) {
      case 1: return <Badge className="bg-green-100 text-green-800">Low (1)</Badge>;
      case 2: return <Badge className="bg-green-100 text-green-800">Moderate (2)</Badge>;
      case 3: return <Badge className="bg-yellow-100 text-yellow-800">Medium (3)</Badge>;
      case 4: return <Badge className="bg-orange-100 text-orange-800">High (4)</Badge>;
      case 5: return <Badge className="bg-red-100 text-red-800">Critical (5)</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">OBD2 Code Management</h1>
            <p className="text-muted-foreground">
              Create and manage OBD2 diagnostic codes for vehicle assessment
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => {
              setEditMode(false);
              setCurrentCode({
                code: '',
                description: '',
                codeType: '',
                commonCauses: '',
                criticality: 3,
                estimatedRepairCost: ''
              });
              setDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Code
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Codes Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>OBD2 Diagnostic Codes</CardTitle>
              <span className="text-sm text-muted-foreground">
                {totalCodes} total codes
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                  <p className="text-gray-600">Loading codes...</p>
                </div>
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center p-12 border rounded-lg">
                <div className="mx-auto mb-4">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-lg font-medium mb-2">No codes found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? "No codes match your search criteria." 
                    : "There are no OBD2 codes in the database yet."}
                </p>
                <Button
                  onClick={() => {
                    setEditMode(false);
                    setCurrentCode({
                      code: '',
                      description: '',
                      codeType: '',
                      commonCauses: '',
                      criticality: 3,
                      estimatedRepairCost: ''
                    });
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Code
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Code</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Criticality</th>
                      <th className="text-left p-2">Repair Est.</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {codes.map((code) => (
                      <tr key={code._id} className="hover:bg-gray-50">
                        <td className="p-2 font-medium">{code.code}</td>
                        <td className="p-2 max-w-xs truncate">{code.description}</td>
                        <td className="p-2">{code.codeType}</td>
                        <td className="p-2">{getCriticalityLabel(code.criticality)}</td>
                        <td className="p-2">{code.estimatedRepairCost ? code.estimatedRepairCost : 'N/A'}</td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditMode(true);
                                setCurrentCode(code);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCode(code._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Code Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit OBD2 Code' : 'Add New OBD2 Code'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code *
              </Label>
              <Input
                id="code"
                value={currentCode.code || ''}
                onChange={(e) => setCurrentCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="P0123"
                className="col-span-3"
                disabled={editMode}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description *
              </Label>
              <Input
                id="description"
                value={currentCode.description || ''}
                onChange={(e) => setCurrentCode(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Throttle Position Sensor Circuit High Input"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codeType" className="text-right">
                Type
              </Label>
              <Input
                id="codeType"
                value={currentCode.codeType || ''}
                onChange={(e) => setCurrentCode(prev => ({ ...prev, codeType: e.target.value }))}
                placeholder="Powertrain, Body, Chassis, etc."
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="criticality" className="text-right">
                Criticality *
              </Label>
              <Select
                value={currentCode.criticality?.toString() || '3'}
                onValueChange={(value) => setCurrentCode(prev => ({ ...prev, criticality: parseInt(value) }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select criticality level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Low</SelectItem>
                  <SelectItem value="2">2 - Moderate</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - High</SelectItem>
                  <SelectItem value="5">5 - Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estimatedRepairCost" className="text-right">
                Est. Repair Cost
              </Label>
              <Input
                id="estimatedRepairCost"
                type="text"
                value={currentCode.estimatedRepairCost || ''}
                onChange={(e) => setCurrentCode(prev => ({ ...prev, estimatedRepairCost: e.target.value }))}
                placeholder="$75 - $400"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="commonCauses" className="text-right">
                Common Causes
              </Label>
              <Textarea
                id="commonCauses"
                value={currentCode.commonCauses || ''}
                onChange={(e) => setCurrentCode(prev => ({ ...prev, commonCauses: e.target.value }))}
                placeholder="Faulty sensor, loose wiring, etc."
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCode}>
              {editMode ? 'Save Changes' : 'Add Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 