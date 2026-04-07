import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { fetchSamagriItems } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
    Loader2, CreditCard, ArrowLeft, ShieldCheck, Truck, Package,
    Mail, Phone, MapPin, User, Building2, ChevronRight
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

const CheckoutPage: React.FC = () => {
    const { items, total, clear, updateQuantity, removeItem } = useCart();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [stockError, setStockError] = useState<string | null>(null);
    const [cartValid, setCartValid] = useState(true);
        // Sync cart with real-time stock on mount
        useEffect(() => {
            const checkStock = async () => {
                try {
                    setStockError(null);
                    setCartValid(true);
                    const latestItems = await fetchSamagriItems();
                    let hasError = false;
                    let errorMsg = '';
                    for (const cartItem of items) {
                        const latest = latestItems.find(i => i.id === Number(cartItem.id));
                        if (!latest || latest.stock_quantity === 0) {
                            removeItem(cartItem.id);
                            hasError = true;
                            errorMsg += `\n${cartItem.title} is out of stock and was removed from your cart.`;
                        } else if (cartItem.quantity > latest.stock_quantity) {
                            updateQuantity(cartItem.id, latest.stock_quantity);
                            hasError = true;
                            errorMsg += `\n${cartItem.title} quantity reduced to ${latest.stock_quantity} due to limited stock.`;
                        }
                    }
                    if (hasError) {
                        setStockError(errorMsg.trim());
                        setCartValid(false);
                    }
                } catch (e) {
                    setStockError('Could not verify stock. Please try again.');
                    setCartValid(false);
                }
            };
            checkStock();
            // eslint-disable-next-line
        }, []);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        shipping_address: '',
        city: '',
        zip_code: '',
        payment_method: 'ESEWA' as 'STRIPE' | 'KHALTI' | 'ESEWA'
    });

    if (items.length === 0) {
        navigate('/shop/samagri');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStockError(null);
        setCartValid(true);
        // Re-check stock before payment
        try {
            const latestItems = await fetchSamagriItems();
            let hasError = false;
            let errorMsg = '';
            for (const cartItem of items) {
                const latest = latestItems.find(i => i.id === Number(cartItem.id));
                if (!latest || latest.stock_quantity === 0) {
                    removeItem(cartItem.id);
                    hasError = true;
                    errorMsg += `\n${cartItem.title} is out of stock and was removed from your cart.`;
                } else if (cartItem.quantity > latest.stock_quantity) {
                    updateQuantity(cartItem.id, latest.stock_quantity);
                    hasError = true;
                    errorMsg += `\n${cartItem.title} quantity reduced to ${latest.stock_quantity} due to limited stock.`;
                }
            }
            if (hasError) {
                setStockError(errorMsg.trim());
                setCartValid(false);
                setLoading(false);
                return;
            }
            const payload = {
                ...formData,
                items: items.map(it => ({ id: it.id, quantity: it.quantity }))
            };
            const response = await apiClient.post('/samagri/checkout/initiate/', payload);
            
            // Store payment metadata for success page
            sessionStorage.setItem('last_payment_method', formData.payment_method);
            sessionStorage.setItem('last_order_amount', totalPayable.toString());
            if (response.data.order_id) {
                sessionStorage.setItem('last_order_id', response.data.order_id.toString());
            }

            // Handle different payment gateways
            if (response.data.gateway === 'ESEWA' && response.data.form_data) {
                // eSewa requires form POST submission
                submitEsewaForm(response.data.payment_url, response.data.form_data);
            } else if (response.data.payment_url) {
                window.location.href = response.data.payment_url;
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Checkout initiation failed. Please check stock and try again.";
            setStockError(errorMsg);
            toast({
                title: "Purchase Error",
                description: errorMsg,
                variant: "destructive"
            });
            setCartValid(false);
        } finally {
            setLoading(false);
        }
    };

    // eSewa requires form submission instead of redirect
    const submitEsewaForm = (url: string, formData: Record<string, string>) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        
        Object.entries(formData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
    };

    const shippingFee = 0; // Free shipping
    const taxes = 0;
    const totalPayable = total + shippingFee + taxes;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30">
            <Navbar />
            <main className="flex-grow pt-20 pb-12">
                <div className="container mx-auto max-w-7xl px-4">
                    {/* Back Button */}
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Go Back</span>
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Side - Order Summary */}
                        <div className="lg:col-span-5 order-2 lg:order-1">
                            <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden sticky top-24">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        Order Summary
                                    </h2>
                                    <p className="text-orange-100 text-sm">{items.length} item{items.length > 1 ? 's' : ''} in your cart</p>
                                </div>

                                {/* Items List */}
                                <div className="p-6">
                                    <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                        {items.map(item => (
                                            <div key={item.id} className="flex gap-4 p-3 bg-orange-50/50 rounded-xl border border-orange-100/50 hover:shadow-md transition-shadow">
                                                {/* Product Image */}
                                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0 border border-orange-100">
                                                    <img 
                                                        src={item.image || '/images/puja1.svg'} 
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                {/* Product Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-800 truncate">{item.title}</h3>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {item.quantity}x • Size: Standard
                                                    </p>
                                                    <p className="text-orange-600 font-bold mt-2">
                                                        ₹{item.price.toLocaleString()}
                                                    </p>
                                                </div>
                                                {/* Item Total */}
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-800">
                                                        ₹{(item.price * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="mt-6 pt-6 border-t-2 border-dashed border-orange-200 space-y-3">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span className="font-semibold">₹{total.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Shipping</span>
                                            <span className="text-green-600 font-bold">FREE</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Taxes</span>
                                            <span className="font-semibold">₹{taxes.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xl font-bold pt-4 border-t border-orange-200">
                                            <span className="text-orange-600">Total payable</span>
                                            <span className="text-orange-600">₹{totalPayable.toLocaleString()}</span>
                                        </div>
                                        {formData.payment_method === 'STRIPE' && (
                                            <p className="text-xs text-gray-400 text-center italic">
                                                ≈ ${(totalPayable * 0.0075).toFixed(2)} USD
                                            </p>
                                        )}
                                    </div>

                                    {/* Security Badges */}
                                    <div className="mt-6 pt-6 border-t border-orange-100 flex justify-center gap-6">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <ShieldCheck className="w-4 h-4 text-green-500" />
                                            <span>SSL Encrypted</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Truck className="w-4 h-4 text-orange-500" />
                                            <span>Free Delivery</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Form */}
                        <div className="lg:col-span-7 order-1 lg:order-2">
                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Stock Error Alert */}
                                {stockError && (
                                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
                                        <p className="font-medium">Stock Issue</p>
                                        <p className="text-sm whitespace-pre-line mt-1">{stockError}</p>
                                    </div>
                                )}

                                {/* Shipping Information */}
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b">
                                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-orange-500" />
                                            Shipping Information
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <Label className="text-gray-700 font-medium">Full Name *</Label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <Input
                                                    placeholder="Enter your full name"
                                                    required
                                                    className="pl-12 h-12 border-gray-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl"
                                                    value={formData.full_name}
                                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Email & Phone Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-gray-700 font-medium">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                    <Input
                                                        type="email"
                                                        placeholder="your@email.com"
                                                        className="pl-12 h-12 border-gray-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl"
                                                        value={formData.email}
                                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-gray-700 font-medium">Phone Number *</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                    <Input
                                                        type="tel"
                                                        placeholder="+977 98XXXXXXXX"
                                                        required
                                                        className="pl-12 h-12 border-gray-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl"
                                                        value={formData.phone_number}
                                                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Full Address */}
                                        <div className="space-y-2">
                                            <Label className="text-gray-700 font-medium">Full Address *</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                                <textarea
                                                    placeholder="House no., Street name, Landmark..."
                                                    required
                                                    rows={3}
                                                    className="w-full pl-12 pt-3 pr-4 pb-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
                                                    value={formData.shipping_address}
                                                    onChange={e => setFormData({ ...formData, shipping_address: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* City & Zip Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-gray-700 font-medium">City *</Label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                    <Input
                                                        placeholder="Kathmandu"
                                                        required
                                                        className="pl-12 h-12 border-gray-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl"
                                                        value={formData.city}
                                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-gray-700 font-medium">Zip/Postal Code</Label>
                                                <Input
                                                    placeholder="44600"
                                                    className="h-12 border-gray-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl"
                                                    value={formData.zip_code}
                                                    onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b">
                                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-orange-500" />
                                            Payment Method
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <RadioGroup
                                            defaultValue="ESEWA"
                                            onValueChange={(v) => setFormData({ ...formData, payment_method: v as any })}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                        >
                                            {/* eSewa */}
                                            <Label
                                                htmlFor="esewa"
                                                className={`relative flex flex-col items-center p-5 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                                                    formData.payment_method === 'ESEWA' 
                                                        ? 'border-[#60BB46] bg-gradient-to-br from-[#60BB46]/10 to-[#60BB46]/5 shadow-lg shadow-[#60BB46]/20' 
                                                        : 'border-gray-200 hover:border-[#60BB46]/50'
                                                }`}
                                            >
                                                <RadioGroupItem value="ESEWA" id="esewa" className="sr-only" />
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center p-2 mb-3">
                                                    <img src="/images/esewa.jpg" alt="eSewa" className="w-full h-full object-contain" />
                                                </div>
                                                <p className="font-bold text-gray-800">eSewa</p>
                                                <p className="text-xs text-gray-500 text-center mt-1">Digital Wallet</p>
                                                {formData.payment_method === 'ESEWA' && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#60BB46] rounded-full flex items-center justify-center">
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </Label>

                                            {/* Khalti */}
                                            <Label
                                                htmlFor="khalti"
                                                className={`relative flex flex-col items-center p-5 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                                                    formData.payment_method === 'KHALTI' 
                                                        ? 'border-[#5C2D91] bg-gradient-to-br from-[#5C2D91]/10 to-[#5C2D91]/5 shadow-lg shadow-[#5C2D91]/20' 
                                                        : 'border-gray-200 hover:border-[#5C2D91]/50'
                                                }`}
                                            >
                                                <RadioGroupItem value="KHALTI" id="khalti" className="sr-only" />
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center p-2 mb-3">
                                                    <img src="/images/khalti.webp" alt="Khalti" className="w-full h-full object-contain" />
                                                </div>
                                                <p className="font-bold text-gray-800">Khalti</p>
                                                <p className="text-xs text-gray-500 text-center mt-1">Mobile Banking</p>
                                                {formData.payment_method === 'KHALTI' && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#5C2D91] rounded-full flex items-center justify-center">
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </Label>

                                            {/* Stripe */}
                                            <Label
                                                htmlFor="stripe"
                                                className={`relative flex flex-col items-center p-5 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                                                    formData.payment_method === 'STRIPE' 
                                                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg shadow-blue-500/20' 
                                                        : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                            >
                                                <RadioGroupItem value="STRIPE" id="stripe" className="sr-only" />
                                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center mb-3">
                                                    <CreditCard className="w-8 h-8 text-white" />
                                                </div>
                                                <p className="font-bold text-gray-800">Card</p>
                                                <p className="text-xs text-gray-500 text-center mt-1">International</p>
                                                {formData.payment_method === 'STRIPE' && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </Label>
                                        </RadioGroup>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={loading || !cartValid}
                                    className={`w-full h-14 text-white font-bold text-lg rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 ${
                                        formData.payment_method === 'ESEWA' 
                                            ? 'bg-gradient-to-r from-[#60BB46] to-[#4fa339] hover:from-[#4fa339] hover:to-[#3d8a2d]' 
                                            : formData.payment_method === 'KHALTI'
                                            ? 'bg-gradient-to-r from-[#5C2D91] to-[#4a2475] hover:from-[#4a2475] hover:to-[#3a1c5e]'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-3">
                                            {formData.payment_method === 'ESEWA' && (
                                                <img src="/images/esewa.jpg" alt="" className="w-7 h-7 rounded-lg" />
                                            )}
                                            {formData.payment_method === 'KHALTI' && (
                                                <img src="/images/khalti.webp" alt="" className="w-7 h-7 rounded-lg" />
                                            )}
                                            {formData.payment_method === 'STRIPE' && (
                                                <CreditCard className="w-6 h-6" />
                                            )}
                                            Process to Checkout
                                            <ChevronRight className="w-5 h-5" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Custom scrollbar styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #fff7ed;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #fdba74;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #f97316;
                }
            `}</style>
        </div>
    );
};

export default CheckoutPage;
