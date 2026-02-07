import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchAllPujas, type Puja } from "@/lib/api";
import apiClient from "@/lib/api-client";
import { DataTablePagination } from "@/components/common/DataTablePagination";

interface AdminPuja extends Puja {
  is_available: boolean;
}

export default function AdminServices() {
  const [pujas, setPujas] = useState<AdminPuja[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    base_duration_minutes: number;
    base_price: string;
    is_available: boolean;
    image: File | null;
  }>({
    name: "",
    description: "",
    base_duration_minutes: 60,
    base_price: "",
    is_available: true,
    image: null,
  });
  const { toast } = useToast();

  const loadPujas = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPujas();
      setPujas(data as AdminPuja[]);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load pujas." });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPujas();
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
      base_duration_minutes: puja.base_duration_minutes || 60,
      base_price: puja.base_price ? String(puja.base_price) : "",
      is_available: puja.is_available,
      image: null, // Reset image input on edit as we can't set file input value
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      base_duration_minutes: 60,
      base_price: "",
      is_available: true,
      image: null,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this puja service?")) return;
    try {
      await apiClient.delete(`/services/${id}/`);
      toast({ title: "Success", description: "Puja deleted successfully." });
      loadPujas();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete puja." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      // Don't send null image on update unless you want to clear it (logic depends on backend)
      // Usually backend ignores valid key if not present in request. 
      // If image is null here, it means user didn't select a new file.
      if (key === 'image' && value === null) return;

      if (value !== null && value !== "") {
        if ((value as any) instanceof File) {
          formData.append(key, value as File);
        } else {
          formData.append(key, String(value));
        }
      }
    });

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
        toast({ title: "Success", description: "Puja added successfully." });
      }
      handleCancel(); // Reset form
      loadPujas();
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price (₹)</TableHead>
                  <TableHead>Duration (min)</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPujas.map((puja) => (
                  <TableRow key={puja.id}>
                    <TableCell>{puja.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{puja.description}</TableCell>
                    <TableCell>{puja.base_price}</TableCell>
                    <TableCell>{puja.base_duration_minutes}</TableCell>
                    <TableCell>{puja.is_available ? "Yes" : "No"}</TableCell>
                    <TableCell>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(puja)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(puja.id)}>Delete</Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <DataTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
