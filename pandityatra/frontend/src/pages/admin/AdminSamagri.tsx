import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
    fetchSamagriItems, 
    fetchSamagriCategories, 
    createSamagriItem, 
    updateSamagriItem, 
    deleteSamagriItem,
    createSamagriCategory,
    updateSamagriCategory, // Added
    deleteSamagriCategory,
    approveSamagriItem,
    rejectSamagriItem,
    type SamagriItem,
    type SamagriCategory
} from "@/lib/api";
import { 
    Pencil, 
    Trash, 
    Plus, 
    PackageOpen, 
    Trash2, 
    Upload, 
    Image as ImageIcon, 
    X,
    Loader2,
    CheckCircle,
    XCircle,
    ShieldCheck,
    Clock
} from "lucide-react"; // Added Icons
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/common/DataTablePagination";
import { ActionConfirmationDialog } from "@/components/common/ActionConfirmationDialog";

// Cloudinary constants
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dm0vvpzs9";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "products";

export default function AdminSamagri() {
  const [items, setItems] = useState<SamagriItem[]>([]);
  const [categories, setCategories] = useState<SamagriCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false); // New state
  const [editingItem, setEditingItem] = useState<SamagriItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; description: string; onConfirm: () => void }>({
      title: "",
      description: "",
      onConfirm: () => { }
  });
  
  const [form, setForm] = useState<{
      name: string;
      description: string;
      price: string;
      price_usd: string;
      stock_quantity: string;
      category: string;
      unit: string;
      image: File | null;
  }>({
    name: "",
    description: "",
    price: "",
    price_usd: "",
    stock_quantity: "",
    category: "",
    unit: "pcs",
    image: null,
  });

  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", image: "" }); // Updated state
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null); // New state for editing
  const [uploadingCategory, setUploadingCategory] = useState(false); // New state
  
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
          price_usd: (item as any).price_usd?.toString() || "",
          stock_quantity: item.stock_quantity.toString(),
          category: item.category ? item.category.toString() : "",
          unit: item.unit || "pcs",
          image: null 
      });
      setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: number) => {
      setConfirmConfig({
          title: "Delete Inventory Item?",
          description: "Are you sure you want to delete this item? This action will permanently remove it from the inventory.",
          onConfirm: async () => {
              try {
                  await deleteSamagriItem(id);
                  toast({ title: "Success", description: "Item deleted." });
                  loadData();
                  setConfirmOpen(false);
              } catch (err: any) {
                  console.error(err);
                  const errorMsg = err.response?.data?.detail || err.message || "Failed to delete item.";
                  toast({ title: "Error", description: errorMsg });
              }
          }
      });
      setConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicitly create FormData to handle file uploads
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    if (form.price_usd) {
        formData.append("price_usd", form.price_usd);
    }
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
      setForm({ name: "", description: "", price: "", price_usd: "", stock_quantity: "", category: "", unit: "pcs", image: null });
      loadData();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Operation failed." });
    }
  };

  // --- Category Handlers ---
  const handleUploadCategoryImage = async (file: File) => {
      toast({
          title: "Uploading Category Image",
          description: "Please wait while image is uploading to Cloudinary...",
      });

      setUploadingCategory(true);
      const formData = new FormData();
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('file', file);

      try {
          const response = await fetch(
              `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
              { method: 'POST', body: formData }
          );
          
          const data = await response.json();

          if (!response.ok) {
              const errorMsg = data.error?.message || "Upload failed";
              throw new Error(errorMsg);
          }

          if (data.secure_url) {
              setCategoryForm(prev => ({ ...prev, image: data.secure_url }));
              toast({
                  title: "Upload Success",
                  description: "Category image uploaded successfully!",
              });
          } else {
              throw new Error("Upload failed: No secure URL returned");
          }
      } catch (err: any) {
          console.error("Upload Error Details:", err);
          toast({
              title: "Upload Error",
              description: err.message || "Failed to upload category image.",
              variant: "destructive"
          });
      } finally {
          setUploadingCategory(false);
      }
  };

  const handleEditCategory = (cat: SamagriCategory) => {
      setCategoryForm({
          name: cat.name,
          description: cat.description || "",
          image: cat.image || ""
      });
      setEditingCategoryId(cat.id);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (editingCategoryId) {
              await updateSamagriCategory(editingCategoryId, categoryForm);
              toast({ title: "Success", description: "Category updated." });
          } else {
              await createSamagriCategory(categoryForm);
              toast({ title: "Success", description: "Category created." });
          }
          setCategoryForm({ name: "", description: "", image: "" });
          setEditingCategoryId(null);
          loadData(); // Reload to update dropdowns
      } catch (err) {
          toast({ title: "Error", description: `Failed to ${editingCategoryId ? 'update' : 'create'} category.` });
      }
  };

  const handleDeleteCategory = async (id: number) => {
      setConfirmConfig({
          title: "Delete Category?",
          description: "Are you sure you want to delete this category? This will only work if no items are currently assigned to it.",
          onConfirm: async () => {
              try {
                  await deleteSamagriCategory(id);
                  toast({ title: "Success", description: "Category deleted." });
                  loadData();
                  setConfirmOpen(false);
              } catch (err) {
                  toast({ title: "Error", description: "Failed to delete category (Ensure it is empty)." });
              }
          }
      });
      setConfirmOpen(true);
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
                        <DialogDescription>Add, edit, or remove item categories and upload Cloudinary images.</DialogDescription>
                    </DialogHeader>
                    
                    {/* Add Category Form */}
                    <form onSubmit={handleCategorySubmit} className="space-y-4 mb-6">
                        <div className="flex gap-2">
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
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Category Image (Cloudinary)</label>
                            <div className="flex items-center gap-4">
                                {categoryForm.image ? (
                                    <div className="relative group w-16 h-16 rounded-lg overflow-hidden border">
                                        <img src={categoryForm.image} alt="Category" className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                            onClick={() => setCategoryForm(prev => ({ ...prev, image: "" }))}
                                        >
                                            <X className="h-4 w-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400">
                                        <ImageIcon className="h-5 w-5" />
                                        <span className="text-[10px]">No image</span>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => e.target.files?.[0] && handleUploadCategoryImage(e.target.files[0])}
                                        disabled={uploadingCategory}
                                    />
                                    {uploadingCategory && (
                                        <div className="flex items-center gap-2 mt-1 text-xs text-orange-600">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span>Uploading...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                             <Button type="submit" className="flex-1" disabled={uploadingCategory}>
                                {editingCategoryId ? "Update Category" : "Add Category"}
                             </Button>
                             {editingCategoryId && (
                                 <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => {
                                        setEditingCategoryId(null);
                                        setCategoryForm({ name: "", description: "", image: "" });
                                    }}
                                 >
                                    Cancel
                                 </Button>
                             )}
                        </div>
                    </form>

                    {/* List Categories */}
                    <div className="max-h-[300px] overflow-y-auto border rounded-md p-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                <div className="flex items-center gap-3">
                                    {cat.image ? (
                                        <img src={cat.image} alt={cat.name} className="h-8 w-8 object-cover rounded" />
                                    ) : (
                                        <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                                            <ImageIcon className="h-4 w-4 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{cat.name}</span>
                                        {cat.description && <span className="text-xs text-gray-500">{cat.description}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditCategory(cat)}>
                                        <Pencil className="h-4 w-4 text-blue-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)}>
                                        <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => { setEditingItem(null); setForm({ name: "", description: "", price: "", price_usd: "", stock_quantity: "", category: "", unit: "pcs", image: null }); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Item
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                        <DialogDescription>Fill in the details for the samagri item below.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input name="name" value={form.name} onChange={handleChange} placeholder="Item Name" required />
                        
                        <div className="grid grid-cols-3 gap-4">
                            <Input name="price" value={form.price} onChange={handleChange} placeholder="Price (NPR)" required type="number" min="0" />
                            <Input name="price_usd" value={form.price_usd} onChange={handleChange} placeholder="Price (USD)" type="number" min="0" step="0.01" />
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
            <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center p-4">No items found</TableCell>
                    </TableRow>
                ) : (
                    items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
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
                        <TableCell>
                            {(item as any).is_approved ? (
                                <div className="flex items-center gap-1 text-green-600 font-medium text-xs">
                                    <ShieldCheck className="h-3.5 w-3.5" /> Approved
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-orange-600 font-medium text-xs">
                                    <Clock className="h-3.5 w-3.5" /> Pending
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                                {!(item as any).is_approved && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={async () => {
                                                    try {
                                                        await approveSamagriItem(item.id);
                                                        toast({ title: "Approved", description: "Product is now live." });
                                                        loadData();
                                                    } catch (e) {
                                                        toast({ title: "Error", description: "Approval failed.", variant: "destructive" });
                                                    }
                                                }}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Approve Product</TooltipContent>
                                    </Tooltip>
                                )}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => handleEdit(item)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Item</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete Item</TooltipContent>
                                </Tooltip>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
            <div className="p-4 border-t">
                <DataTablePagination 
                    currentPage={currentPage}
                    totalPages={Math.ceil(items.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                />
            </div>
            </TooltipProvider>
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

