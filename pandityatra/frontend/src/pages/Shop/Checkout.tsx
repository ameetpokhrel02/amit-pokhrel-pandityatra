import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
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
    const { items, total, clear } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        shipping_address: '',
        city: '',
        payment_method: 'STRIPE' as 'STRIPE' | 'KHALTI'
    });

    if (items.length === 0) {
        navigate('/shop/samagri');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                items: items.map(it => ({ id: it.id, quantity: it.quantity }))
            };

            const response = await apiClient.post('/samagri/checkout/initiate/', payload);

            // Redirect to payment gateway
            if (response.data.payment_url) {
                window.location.href = response.data.payment_url;
            }
        } catch (err: any) {
            console.error("Checkout failed:", err);
            alert(err.response?.data?.error || "Checkout initiation failed. Please check stock and try again.");
        } finally {
            setLoading(false);
        }
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
                                        defaultValue="STRIPE"
                                        onValueChange={(v) => setFormData({ ...formData, payment_method: v as any })}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        <Label
                                            htmlFor="stripe"
                                            className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-all ${formData.payment_method === 'STRIPE' ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="STRIPE" id="stripe" />
                                                <div>
                                                    <p className="font-bold">Card / International</p>
                                                    <p className="text-xs text-gray-500">Stripe Secure (USD)</p>
                                                </div>
                                            </div>
                                            <CreditCard className="text-gray-400" />
                                        </Label>

                                        <Label
                                            htmlFor="khalti"
                                            className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-all ${formData.payment_method === 'KHALTI' ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="KHALTI" id="khalti" />
                                                <div>
                                                    <p className="font-bold">Khalti / Nepal</p>
                                                    <p className="text-xs text-gray-500">Mobile Wallet (NPR)</p>
                                                </div>
                                            </div>
                                            <Wallet className="text-purple-600" />
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

                                    <Button
                                        form="checkout-form"
                                        disabled={loading}
                                        className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl shadow-lg ring-offset-2 focus:ring-2 focus:ring-orange-500 transition-all active:scale-[0.98]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Initiating Sacred Payment...
                                            </>
                                        ) : (
                                            `Secure Payment (${formData.payment_method})`
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
