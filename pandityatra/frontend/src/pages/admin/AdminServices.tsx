import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchAllPujas, type Puja, fetchPujaCategories, type PujaCategory } from "@/lib/api";
import apiClient from "@/lib/api-client";
import { DataTablePagination } from "@/components/common/DataTablePagination";
import { Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ActionConfirmationDialog } from "@/components/common/ActionConfirmationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminPuja extends Puja {
  is_available: boolean;
}

export default function AdminServices() {
  const [pujas, setPujas] = useState<AdminPuja[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<PujaCategory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; description: string; onConfirm: () => void }>({
    title: "",
    description: "",
    onConfirm: () => { }
  });

  const [form, setForm] = useState<{
    name: string;
    description: string;
    category: string;
    base_duration_minutes: number;
    base_price: string;
    is_available: boolean;
    image: File | null;
  }>({
    name: "",
    description: "",
    category: "",
    base_duration_minutes: 60,
    base_price: "",
    is_available: true,
    image: null,
  });
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [pujasData, catsData] = await Promise.all([
        fetchAllPujas(),
        fetchPujaCategories()
      ]);
      setPujas(pujasData as AdminPuja[]);
      setCategories(catsData);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load services data." });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? (files ? files[0] : null) : value,
    }));
  };

  const handleEdit = (puja: AdminPuja) => {
    setEditingId(puja.id);
    setForm({
      name: puja.name || "",
      description: puja.description || "",
      category: puja.category ? String(puja.category) : "",
      base_duration_minutes: puja.base_duration_minutes || 60,
      base_price: puja.base_price ? String(puja.base_price) : "",
      is_available: puja.is_available,
      image: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      category: "",
      base_duration_minutes: 60,
      base_price: "",
      is_available: true,
      image: null,
    });
  };

  const handleDelete = async (id: number) => {
    setConfirmConfig({
      title: "Delete Service?",
      description: "Are you sure you want to delete this puja service? This action is permanent.",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/services/${id}/`);
          toast({ title: "Success", description: "Puja deleted successfully." });
          loadData();
          setConfirmOpen(false);
        } catch (err: any) {
          console.error(err);
          toast({ title: "Error", description: "Failed to delete puja." });
        }
      }
    });
    setConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'image' && value === null) return;

      if (value !== null && value !== "") {
        if ((value as any) instanceof File) {
          formData.append(key, value as File);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const uploadToastId = toast({
      title: form.image ? "Saving service to Cloudinary..." : "Saving service details...",
      description: "Please wait while we synchronize the service media.",
      duration: Infinity,
    }).id;

    try {
      if (editingId) {
        await apiClient.patch(`/services/${editingId}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({ title: "Success", description: "Puja updated successfully." });
      } else {
        await apiClient.post("/services/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({ title: "Success", description: "New puja added successfully." });
      }
      handleCancel();
      loadData();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.response?.data?.detail || err.message || "Failed to save puja." });
    }
  };

  const totalPages = Math.ceil(pujas.length / itemsPerPage);
  const currentPujas = pujas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout userRole="admin">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editingId ? "Edit Puja/Service" : "Add New Puja/Service"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
            <Input name="base_price" value={form.base_price} onChange={handleChange} placeholder="Base Price (₹)" required type="number" min="0" />
            <Input name="base_duration_minutes" value={form.base_duration_minutes} onChange={handleChange} placeholder="Duration (min)" required type="number" min="1" />
            
            <Select 
              value={form.category} 
              onValueChange={(val) => setForm(prev => ({ ...prev, category: val }))}
              required
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2">
              <Input name="image" type="file" accept="image/*" onChange={handleChange} />
              {editingId && <span className="text-xs text-gray-500">Leave empty to keep existing image</span>}
            </div>
            <Input name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_available" checked={form.is_available} onChange={handleChange} /> Available
            </label>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">{editingId ? "Update Puja" : "Add Puja"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All Pujas/Services</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price (₹)</TableHead>
                      <TableHead>Duration (min)</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPujas.map((puja) => (
                      <TableRow key={puja.id}>
                        <TableCell>{puja.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{puja.description}</TableCell>
                        <TableCell>
                          {puja.category_details?.name || <span className="text-gray-400 italic">None</span>}
                        </TableCell>
                        <TableCell>{puja.base_price}</TableCell>
                        <TableCell>{puja.base_duration_minutes}</TableCell>
                        <TableCell>{puja.is_available ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleEdit(puja)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Service</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(puja.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Service</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
              <DataTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </CardContent>
      </Card>
      <ActionConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        onConfirm={confirmConfig.onConfirm}
      />
    </DashboardLayout>
  );
}
