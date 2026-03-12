import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { fetchSamagriItems } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CreditCard, Wallet, MapPin, Phone, User } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import apiClient from '@/lib/api-client';

const CheckoutPage: React.FC = () => {
    const { items, total, clear, updateQuantity, removeItem } = useCart();
    const navigate = useNavigate();
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
        phone_number: '',
        shipping_address: '',
        city: '',
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
            
            // Handle different payment gateways
            if (response.data.gateway === 'ESEWA' && response.data.form_data) {
                // eSewa requires form POST submission
                submitEsewaForm(response.data.payment_url, response.data.form_data);
            } else if (response.data.payment_url) {
                window.location.href = response.data.payment_url;
            }
        } catch (err: any) {
            setStockError(err.response?.data?.error || "Checkout initiation failed. Please check stock and try again.");
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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow pt-24 pb-12 px-4">
                <div className="container mx-auto max-w-5xl">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Sacred Shop Checkout</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Shipping Form */}
                        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader className="bg-white border-b">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <MapPin className="text-orange-600" /> Shipping & Contact
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">Full Name *</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="full_name"
                                                required
                                                className="pl-10"
                                                value={formData.full_name}
                                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number *</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                required
                                                className="pl-10"
                                                value={formData.phone_number}
                                                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="city">City *</Label>
                                        <Input
                                            id="city"
                                            required
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Full Shipping Address *</Label>
                                        <textarea
                                            id="address"
                                            required
                                            className="w-full min-h-[100px] p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                                            value={formData.shipping_address}
                                            onChange={e => setFormData({ ...formData, shipping_address: e.target.value })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm">
                                <CardHeader className="bg-white border-b">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <CreditCard className="text-orange-600" /> Payment Method
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <RadioGroup
                                        defaultValue="ESEWA"
                                        onValueChange={(v) => setFormData({ ...formData, payment_method: v as any })}
                                        className="space-y-3"
                                    >
                                        {/* eSewa - Nepal's Leading Digital Wallet */}
                                        <Label
                                            htmlFor="esewa"
                                            className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.payment_method === 'ESEWA' ? 'border-[#60BB46] bg-[#60BB46]/5 shadow-md' : 'border-gray-200 hover:border-[#60BB46]/50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="ESEWA" id="esewa" className="text-[#60BB46]" />
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-1">
                                                    <img src="/images/esewa.jpg" alt="eSewa" className="w-full h-full object-contain" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#60BB46]">eSewa</p>
                                                    <p className="text-xs text-gray-500">Nepal's Leading Digital Wallet (NPR)</p>
                                                </div>
                                            </div>
                                        </Label>

                                        {/* Khalti */}
                                        <Label
                                            htmlFor="khalti"
                                            className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.payment_method === 'KHALTI' ? 'border-[#5C2D91] bg-[#5C2D91]/5 shadow-md' : 'border-gray-200 hover:border-[#5C2D91]/50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="KHALTI" id="khalti" className="text-[#5C2D91]" />
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-1">
                                                    <img src="/images/khalti.webp" alt="Khalti" className="w-full h-full object-contain" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#5C2D91]">Khalti</p>
                                                    <p className="text-xs text-gray-500">Digital Wallet & Mobile Banking (NPR)</p>
                                                </div>
                                            </div>
                                        </Label>

                                        {/* Stripe - International */}
                                        <Label
                                            htmlFor="stripe"
                                            className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.payment_method === 'STRIPE' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="STRIPE" id="stripe" className="text-blue-600" />
                                                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                                                    <CreditCard className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-blue-600">Card / International</p>
                                                    <p className="text-xs text-gray-500">Visa, Mastercard, etc. (USD)</p>
                                                </div>
                                            </div>
                                        </Label>
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        </form>

                        {/* Right: Order Summary */}
                        <div className="space-y-6">
                            <Card className="border-none shadow-sm sticky top-28">
                                <CardHeader className="bg-[#FFF3E0] rounded-t-xl border-b border-orange-100">
                                    <CardTitle className="text-lg text-orange-900">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                                        {items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="text-sm font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 space-y-2 border-t border-dashed">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Subtotal</span>
                                            <span className="font-medium">₹{total.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Delivery</span>
                                            <span className="text-green-600 font-medium font-bold uppercase">Free</span>
                                        </div>
                                        <div className="flex justify-between text-xl font-bold pt-4 text-orange-600">
                                            <span>Total</span>
                                            <span>₹{total.toLocaleString()}</span>
                                        </div>
                                        {formData.payment_method === 'STRIPE' && (
                                            <p className="text-[10px] text-gray-400 text-center italic mt-2">
                                                Total will be converted to USD approx: ${(total * 0.0075).toFixed(2)}
                                            </p>
                                        )}
                                    </div>

                                    {stockError && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm whitespace-pre-line">
                                            {stockError}
                                        </div>
                                    )}
                                    <Button
                                        form="checkout-form"
                                        disabled={loading || !cartValid}
                                        className={`w-full h-14 text-white font-bold text-lg rounded-xl shadow-lg ring-offset-2 focus:ring-2 transition-all active:scale-[0.98] ${
                                            formData.payment_method === 'ESEWA' 
                                                ? 'bg-[#60BB46] hover:bg-[#4fa339] focus:ring-[#60BB46]' 
                                                : formData.payment_method === 'KHALTI'
                                                ? 'bg-[#5C2D91] hover:bg-[#4a2475] focus:ring-[#5C2D91]'
                                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                        }`}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Initiating Payment...
                                            </>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                {formData.payment_method === 'ESEWA' && (
                                                    <img src="/images/esewa.jpg" alt="" className="w-6 h-6 rounded" />
                                                )}
                                                Pay with {formData.payment_method === 'STRIPE' ? 'Card' : formData.payment_method === 'KHALTI' ? 'Khalti' : 'eSewa'}
                                            </span>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
