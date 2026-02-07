import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
    fetchSamagriItems, 
    fetchSamagriCategories, 
    createSamagriItem, 
    updateSamagriItem, 
    deleteSamagriItem,
    createSamagriCategory, // Added
    deleteSamagriCategory, // Added
    type SamagriItem,
    type SamagriCategory
} from "@/lib/api";
import { Pencil, Trash, Plus, PackageOpen } from "lucide-react"; // PackageOpen icon

export default function AdminSamagri() {
  const [items, setItems] = useState<SamagriItem[]>([]);
  const [categories, setCategories] = useState<SamagriCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false); // New state
  const [editingItem, setEditingItem] = useState<SamagriItem | null>(null);
  
  const [form, setForm] = useState<{
      name: string;
      description: string;
      price: string;
      stock_quantity: string;
      category: string;
      unit: string;
      image: File | null;
  }>({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category: "",
    unit: "pcs",
    image: null,
  });

  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" }); // New state
  
  const { toast } = useToast();

  const loadData = async () => {
    // ... same as before
    setLoading(true);
    try {
      const [itemsData, catsData] = await Promise.all([
          fetchSamagriItems(),
          fetchSamagriCategories()
      ]);
      setItems(itemsData);
      setCategories(catsData);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load inventory." });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    // ... same as before
    if (e.target.type === "file") {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            setForm((prev) => ({ ...prev, image: files[0] }));
        }
    } else {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ... handleEdit, handleDelete, handleSubmit (Keep these)
  const handleEdit = (item: SamagriItem) => {
      setEditingItem(item);
      setForm({
          name: item.name,
          description: item.description || "",
          price: item.price.toString(),
          stock_quantity: item.stock_quantity.toString(),
          category: item.category ? item.category.toString() : "",
          unit: item.unit || "pcs",
          image: null 
      });
      setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: number) => {
      if(!confirm("Are you sure you want to delete this item?")) return;
      try {
          await deleteSamagriItem(id);
          toast({ title: "Success", description: "Item deleted." });
          loadData();
      } catch (err: any) {
          console.error(err);
          const errorMsg = err.response?.data?.detail || err.message || "Failed to delete item.";
          toast({ title: "Error", description: errorMsg });
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicitly create FormData to handle file uploads
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("stock_quantity", form.stock_quantity);
    formData.append("category", form.category);
    formData.append("unit", form.unit);
    
    if (form.image) {
        formData.append("image", form.image);
    }
    
    // Log form data for debugging
    // form.image && console.log("Uploading file:", form.image.name);

    try {
      if (editingItem) {
          await updateSamagriItem(editingItem.id, formData);
          toast({ title: "Success", description: "Item updated." });
      } else {
          await createSamagriItem(formData);
          toast({ title: "Success", description: "Item created." });
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      setForm({ name: "", description: "", price: "", stock_quantity: "", category: "", unit: "pcs", image: null });
      loadData();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Operation failed." });
    }
  };

  // --- Category Handlers ---
  const handleCategorySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await createSamagriCategory(categoryForm);
          toast({ title: "Success", description: "Category created." });
          setCategoryForm({ name: "", description: "" });
          setIsCategoryDialogOpen(false);
          loadData(); // Reload to update dropdowns
      } catch (err) {
          toast({ title: "Error", description: "Failed to create category." });
      }
  };

  const handleDeleteCategory = async (id: number) => {
      if (!confirm("Delete category? This will fail if items are assigned to it.")) return;
      try {
          await deleteSamagriCategory(id);
          toast({ title: "Success", description: "Category deleted." });
          loadData();
      } catch (err) {
          toast({ title: "Error", description: "Failed to delete category (Ensure it is empty)." });
      }
  };


  return (
    <DashboardLayout userRole="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory / Samagri Management</h1>
        <div className="flex gap-2">
            
            {/* Manage Categories Dialog */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <PackageOpen className="mr-2 h-4 w-4" /> Manage Categories
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Categories</DialogTitle>
                    </DialogHeader>
                    
                    {/* Add Category Form */}
                    <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-4">
                        <Input 
                            placeholder="New Category Name" 
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                            required
                        />
                         <Input 
                            placeholder="Description (Optional)" 
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                        />
                        <Button type="submit">Add</Button>
                    </form>

                    {/* List Categories */}
                    <div className="max-h-[300px] overflow-y-auto border rounded-md p-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                <span>{cat.name} <span className="text-xs text-gray-500">({cat.description})</span></span>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)}>
                                    <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => { setEditingItem(null); setForm({ name: "", description: "", price: "", stock_quantity: "", category: "", unit: "pcs", image: null }); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Item
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input name="name" value={form.name} onChange={handleChange} placeholder="Item Name" required />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="price" value={form.price} onChange={handleChange} placeholder="Price (NPR)" required type="number" min="0" />
                            <Input name="stock_quantity" value={form.stock_quantity} onChange={handleChange} placeholder="Stock Qty" required type="number" min="0" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <select 
                                name="category" 
                                value={form.category} 
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <Input name="unit" value={form.unit} onChange={handleChange} placeholder="Unit (e.g. kg, pcs)" />
                        </div>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <label htmlFor="image" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Item Image
                            </label>
                            <Input id="image" name="image" type="file" onChange={handleChange} accept="image/*" />
                        </div>

                        <Input name="description" value={form.description} onChange={handleChange} placeholder="Description" />
                        
                        <Button type="submit" className="w-full">{editingItem ? "Update" : "Create"}</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center p-4">No items found</TableCell>
                    </TableRow>
                ) : (
                    items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="h-10 w-10 object-cover rounded-md" />
                            ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">No Img</div>
                            )}
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{categories.find(c => c.id === item.category)?.name || '-'}</TableCell>
                        <TableCell>NPR {item.price}</TableCell>
                        <TableCell>
                            <span className={item.stock_quantity < 10 ? "text-red-500 font-bold" : ""}>
                                {item.stock_quantity} {item.stock_quantity < 10 && "(Low)"}
                            </span>
                        </TableCell>
                        <TableCell className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                                <Trash className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

