import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchAllPujas, type Puja } from "@/lib/api";
import axios from "axios";

interface AdminPuja extends Puja {
  is_available: boolean;
}

export default function AdminServices() {
  const [pujas, setPujas] = useState<AdminPuja[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") formData.append(key, String(value));
    });
    try {
      await axios.post("/api/services/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      toast({ title: "Success", description: "Puja added." });
      setForm({ name: "", description: "", base_duration_minutes: 60, base_price: "", is_available: true, image: null });
      loadPujas();
    } catch (err) {
      toast({ title: "Error", description: "Failed to add puja." });
    }
  };

  return (
    <DashboardLayout userRole="admin">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Puja/Service</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
            <Input name="base_price" value={form.base_price} onChange={handleChange} placeholder="Base Price (₹)" required type="number" min="0" />
            <Input name="base_duration_minutes" value={form.base_duration_minutes} onChange={handleChange} placeholder="Duration (min)" required type="number" min="1" />
            <Input name="image" type="file" accept="image/*" onChange={handleChange} />
            <Input name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_available" checked={form.is_available} onChange={handleChange} /> Available
            </label>
            <Button type="submit">Add Puja</Button>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price (₹)</TableHead>
                  <TableHead>Duration (min)</TableHead>
                  <TableHead>Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pujas.map((puja) => (
                  <TableRow key={puja.id}>
                    <TableCell>{puja.name}</TableCell>
                    <TableCell>{puja.description}</TableCell>
                    <TableCell>{puja.base_price}</TableCell>
                    <TableCell>{puja.base_duration_minutes}</TableCell>
                    <TableCell>{puja.is_available ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
