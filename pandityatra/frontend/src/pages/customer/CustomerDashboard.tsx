import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Video,
  Wallet,
  Heart,
  ShoppingCart,
  ClipboardList,
  Package,
  Trash2,
  Plus,
  Minus,
  ExternalLink,
  ShoppingBag,
  FileText,
  ArrowRight,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Store,
  Download,
  Receipt,
  MapPin,
  Phone,
  User2,
  IndianRupee,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { fetchBookings, fetchPandits, fetchMyOrders, downloadBookingInvoice, downloadShopInvoice } from "@/lib/api";
import type { Booking, Pandit, ShopOrder } from "@/lib/api";
import { useFavorites, type FavoriteItem } from "@/hooks/useFavorites";
import { useCart, type CartItem } from "@/hooks/useCart";
import KundaliHistory from "@/components/dashboard/KundaliHistory";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [nextBooking, setNextBooking] = useState<any>(null);
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, spent: 0 });
  const [recommendations, setRecommendations] = useState<Pandit[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Orders
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // All bookings for Purchases tab
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  // Favorites & Cart from context
  const {
    items: favoriteItems,
    toggleFavorite,
    removeItem: removeFavorite,
    loading: favLoading,
  } = useFavorites();
  const {
    items: cartItems,
    addItem: addToCart,
    removeItem: removeCartItem,
    updateQuantity,
    clear: clearCart,
    total: cartTotal,
  } = useCart();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bookingsRes, panditsRes] = await Promise.all([
          fetchBookings(),
          fetchPandits(),
        ]);

        const upcoming = bookingsRes
          .filter((b) => ["PENDING", "ACCEPTED"].includes(b.status))
          .sort(
            (a, b) =>
              new Date(`${a.booking_date}T${a.booking_time}`).getTime() -
              new Date(`${b.booking_date}T${b.booking_time}`).getTime()
          );
        const completed = bookingsRes.filter((b) => b.status === "COMPLETED");

        setNextBooking(upcoming[0] || null);
        setStats({
          upcoming: upcoming.length,
          completed: completed.length,
          spent: completed.reduce((sum, b) => sum + Number(b.total_fee || 0), 0),
        });

        const acts = bookingsRes
          .sort(
            (a, b) =>
              new Date(b.booking_date).getTime() -
              new Date(a.booking_date).getTime()
          )
          .slice(0, 5)
          .map((b) => ({
            id: b.id,
            text:
              b.status === "PENDING"
                ? `Request sent for ${b.service_name}`
                : b.status === "ACCEPTED"
                ? `Booking confirmed with ${b.pandit_name}`
                : b.status === "COMPLETED"
                ? `Completed ${b.service_name}`
                : `Cancelled ${b.service_name}`,
            date: b.booking_date,
            status: b.status,
          }));
        setActivities(acts);

        const topPandits = panditsRes
          .sort((a, b) => Number(b.rating) - Number(a.rating))
          .slice(0, 3);
        setRecommendations(topPandits);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };
    loadData();
  }, []);

  // Load orders when marketplace tab is active
  useEffect(() => {
    if (activeTab === "marketplace") {
      loadOrders();
    }
    if (activeTab === "purchases") {
      loadPurchasesData();
    }
  }, [activeTab]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadPurchasesData = async () => {
    setBookingsLoading(true);
    setOrdersLoading(true);
    try {
      const [bookingsData, ordersData] = await Promise.all([
        fetchBookings(),
        fetchMyOrders(),
      ]);
      setAllBookings(bookingsData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Failed to load purchases data", error);
    } finally {
      setBookingsLoading(false);
      setOrdersLoading(false);
    }
  };

  const handleDownloadBookingInvoice = async (bookingId: number) => {
    setDownloadingInvoice(`booking-${bookingId}`);
    try {
      await downloadBookingInvoice(bookingId);
    } catch (error) {
      console.error("Failed to download booking invoice", error);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleDownloadShopInvoice = async (orderId: number) => {
    setDownloadingInvoice(`order-${orderId}`);
    try {
      await downloadShopInvoice(orderId);
    } catch (error) {
      console.error("Failed to download shop invoice", error);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-700 border-green-200";
      case "PAID":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "SHIPPED":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle2 className="h-4 w-4" />;
      case "PAID":
        return <CreditCard className="h-4 w-4" />;
      case "SHIPPED":
        return <Truck className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED":
      case "FAILED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getBookingStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4" />;
      case "ACCEPTED":
        return <Calendar className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "CANCELLED":
      case "FAILED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout userRole="user">
      <div className="space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.full_name?.split(" ")[0]} 🙏
            </h1>
            <p className="text-muted-foreground">
              Your spiritual journey continues here
            </p>
          </div>
        </div>

        {/* TABS */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setSearchParams({ tab: val })}
          className="w-full"
        >
          <TabsList className="flex w-full overflow-x-auto gap-1 bg-orange-50/80 p-1 rounded-xl">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Marketplace</span>
              {(cartItems.length + favoriteItems.length) > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-orange-600 hover:bg-orange-600 text-[10px]">
                  {cartItems.length + favoriteItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">My Purchases</span>
            </TabsTrigger>
            <TabsTrigger value="kundali" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Kundali</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN */}
              <div className="lg:col-span-2 space-y-8">
                {/* NEXT PUJA */}
                <Card className="border-primary/30 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Next Puja
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nextBooking ? (
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-lg">
                            {nextBooking.service_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            With {nextBooking.pandit_name}
                          </p>
                          <p className="text-sm">
                            {nextBooking.booking_date} at{" "}
                            {nextBooking.booking_time}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {(nextBooking.daily_room_url ||
                            nextBooking.video_room_url) && (
                            <Button
                              onClick={() =>
                                navigate(`/puja-room/${nextBooking.id}`)
                              }
                            >
                              <Video className="mr-2 h-4 w-4" />
                              Join Video
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => navigate("/my-bookings")}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p>No upcoming puja scheduled.</p>
                        <Button onClick={() => navigate("/booking")}>
                          Book a Puja
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* QUICK ACTION CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card
                    className="cursor-pointer hover:shadow-md transition-all hover:border-orange-300 group"
                    onClick={() => setSearchParams({ tab: "cart" })}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <ShoppingCart className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{cartItems.length}</p>
                        <p className="text-xs text-muted-foreground">
                          Items in Cart
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="cursor-pointer hover:shadow-md transition-all hover:border-orange-300 group"
                    onClick={() => setSearchParams({ tab: "favorites" })}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <Heart className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {favoriteItems.length}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Saved Favorites
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="cursor-pointer hover:shadow-md transition-all hover:border-orange-300 group"
                    onClick={() => setSearchParams({ tab: "orders" })}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <ClipboardList className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{orders.length || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          Past Orders
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* RECOMMENDATIONS */}
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    Recommended for You
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendations.map((pandit) => (
                      <Card
                        key={pandit.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/pandits/${pandit.id}`)}
                      >
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                          <Avatar className="h-16 w-16 border-2 border-orange-200">
                            <AvatarImage
                              src={pandit.user_details.profile_pic}
                              alt={pandit.user_details.full_name}
                            />
                            <AvatarFallback>
                              <span className="text-2xl pt-4 block text-gray-400">
                                🕉
                              </span>
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm line-clamp-1">
                              {pandit.user_details.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pandit.expertise}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          >
                            ★ {pandit.rating}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                    {recommendations.length === 0 && (
                      <div className="col-span-3 text-center text-muted-foreground py-8 border rounded-lg border-dashed">
                        Explore our pandits to get recommendations.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-8">
                {/* QUICK STATS */}
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Upcoming
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.upcoming}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Spent
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold flex items-center gap-1">
                        <Wallet className="h-4 w-4 text-muted-foreground" /> ₹
                        {stats.spent}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* RECENT ACTIVITY */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activities.length > 0 ? (
                        activities.map((activity, i) => (
                          <div
                            key={i}
                            className="flex gap-3 pb-3 border-b last:border-0 last:pb-0"
                          >
                            <div
                              className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                                activity.status === "ACCEPTED"
                                  ? "bg-green-500"
                                  : activity.status === "COMPLETED"
                                  ? "bg-blue-500"
                                  : activity.status === "CANCELLED"
                                  ? "bg-red-500"
                                  : "bg-orange-500"
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {activity.text}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {activity.date}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No recent activity.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI ASSISTANT */}
                <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-none">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">Need Guidance?</h3>
                    <p className="text-white/90 text-sm mb-4">
                      Our AI assistant can help you find the right puja or
                      answer spiritual questions.
                    </p>
                    <Button
                      variant="secondary"
                      className="w-full text-primary"
                      onClick={() =>
                        window.dispatchEvent(new Event("open-ai-chat"))
                      }
                    >
                      Ask AI Guru
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========================= MARKETPLACE TAB ========================= */}
          <TabsContent value="marketplace" className="mt-4">
            <div className="space-y-6">
              {/* Marketplace Sub-tabs */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                {[
                  { key: 'cart', label: 'My Cart', icon: ShoppingCart, count: cartItems.length },
                  { key: 'favorites', label: 'My Favorites', icon: Heart, count: favoriteItems.length },
                  { key: 'orders', label: 'My Orders', icon: ClipboardList, count: orders.length },
                ].map((sub) => {
                  const subTab = searchParams.get('sub') || 'cart';
                  const isActive = subTab === sub.key;
                  return (
                    <button
                      key={sub.key}
                      onClick={() => setSearchParams({ tab: 'marketplace', sub: sub.key })}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <sub.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{sub.label}</span>
                      {sub.count > 0 && (
                        <Badge className="h-5 min-w-[20px] px-1 flex items-center justify-center bg-orange-600 hover:bg-orange-600 text-[10px]">
                          {sub.count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ---------- SUB: MY CART ---------- */}
              {(searchParams.get('sub') || 'cart') === 'cart' && (
                <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                  My Cart
                </h2>
                {cartItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={clearCart}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart className="h-10 w-10 text-orange-300" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Your cart is empty
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Browse our shop to find puja samagri, books, and other
                      spiritual items.
                    </p>
                    <Button
                      onClick={() => navigate("/shop/samagri")}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Browse Shop
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    <AnimatePresence>
                      {cartItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Package className="h-6 w-6" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm line-clamp-1">
                                  {item.title}
                                </h4>
                                <p className="text-sm font-bold text-orange-600 mt-1">
                                  ₹
                                  {Number(item.price).toLocaleString("en-IN")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      Math.max(1, item.quantity - 1)
                                    )
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-semibold text-sm">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1)
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="font-bold text-sm w-20 text-right hidden sm:block">
                                ₹
                                {(
                                  Number(item.price) * item.quantity
                                ).toLocaleString("en-IN")}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                onClick={() => removeCartItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <Card className="sticky top-24 border-orange-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Order Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Subtotal ({cartItems.length} items)
                            </span>
                            <span className="font-medium">
                              ₹{cartTotal.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Shipping
                            </span>
                            <span className="text-green-600 font-medium">
                              Free
                            </span>
                          </div>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-orange-600">
                              ₹{cartTotal.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                        <Button
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          onClick={() => navigate("/shop/checkout")}
                        >
                          Proceed to Checkout
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate("/shop/samagri")}
                        >
                          Continue Shopping
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- SUB: FAVORITES ---------- */}
          {(searchParams.get('sub')) === 'favorites' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Heart className="h-6 w-6 text-red-500" />
                  My Favorites
                  {favoriteItems.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700"
                    >
                      {favoriteItems.length} saved
                    </Badge>
                  )}
                </h2>
              </div>

              {favLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
                </div>
              ) : favoriteItems.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                      <Heart className="h-10 w-10 text-red-200" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      No favorites yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Tap the heart icon on any item in the shop to save it
                      here for easy access.
                    </p>
                    <Button
                      onClick={() => navigate("/shop/samagri")}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Explore Shop
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {favoriteItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-all group">
                          <div className="relative h-40 bg-gray-100 overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Package className="h-12 w-12" />
                              </div>
                            )}
                            <button
                              className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-red-50 rounded-full flex items-center justify-center shadow-sm transition-colors"
                              onClick={() => removeFavorite(item.id)}
                            >
                              <Heart className="h-4 w-4 text-red-500 fill-current" />
                            </button>
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-sm line-clamp-1 mb-1">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {item.description}
                              </p>
                            )}
                            {item.price && (
                              <p className="text-lg font-bold text-orange-600 mb-3">
                                ₹{Number(item.price).toLocaleString("en-IN")}
                              </p>
                            )}
                            <Button
                              className="w-full bg-orange-600 hover:bg-orange-700 text-sm"
                              size="sm"
                              onClick={() => {
                                addToCart({
                                  id: item.id,
                                  title: item.name,
                                  price: Number(item.price) || 0,
                                  image: item.image,
                                });
                                setSearchParams({ tab: "marketplace", sub: "cart" });
                              }}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1.5" />
                              Add to Cart
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* ---------- SUB: MY ORDERS ---------- */}
          {(searchParams.get('sub')) === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                  My Orders
                  {orders.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      {orders.length} orders
                    </Badge>
                  )}
                </h2>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
                </div>
              ) : orders.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <ClipboardList className="h-10 w-10 text-blue-200" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      No orders yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Once you purchase items from the shop, your order
                      history will appear here.
                    </p>
                    <Button
                      onClick={() => navigate("/shop/samagri")}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Start Shopping
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card
                      key={order.id}
                      className="overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">Order </span>
                            <span className="font-bold">#{order.id}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Placed </span>
                            <span className="font-medium">
                              {new Date(order.created_at).toLocaleDateString("en-IN", {
                                year: "numeric", month: "short", day: "numeric",
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total </span>
                            <span className="font-bold text-orange-600">
                              ₹{Number(order.total_amount).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                        <Badge
                          className={`${getStatusColor(order.status)} border gap-1.5 font-medium`}
                          variant="outline"
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 py-2 border-b last:border-0">
                              <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                                <Package className="h-5 w-5 text-orange-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-1">{item.item_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity} × ₹{Number(item.price_at_purchase).toLocaleString("en-IN")}
                                </p>
                              </div>
                              <p className="font-semibold text-sm">
                                ₹{(Number(item.price_at_purchase) * item.quantity).toLocaleString("en-IN")}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-4 border-t gap-3">
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p>
                              <span className="font-medium">Shipping:</span> {order.shipping_address}, {order.city}
                            </p>
                            <p>
                              <span className="font-medium">Payment:</span> {order.payment_method}
                              {order.transaction_id && (
                                <span className="ml-2 text-gray-400">({order.transaction_id.slice(0, 12)}...)</span>
                              )}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            onClick={() => navigate("/shop/samagri")}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Buy Again
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

            </div>
          </TabsContent>

          {/* ========================= MY PURCHASES TAB ========================= */}
          <TabsContent value="purchases" className="mt-4">
            <div className="space-y-6">
              {/* Purchases Sub-tabs */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                {[
                  { key: 'bookings', label: 'Booking History', icon: Calendar, count: allBookings.length },
                  { key: 'shop-orders', label: 'Shop Orders', icon: Package, count: orders.length },
                ].map((sub) => {
                  const subTab = searchParams.get('sub') || 'bookings';
                  const isActive = subTab === sub.key;
                  return (
                    <button
                      key={sub.key}
                      onClick={() => setSearchParams({ tab: 'purchases', sub: sub.key })}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <sub.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{sub.label}</span>
                      {sub.count > 0 && (
                        <Badge className="h-5 min-w-[20px] px-1 flex items-center justify-center bg-orange-600 hover:bg-orange-600 text-[10px]">
                          {sub.count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ---------- SUB: BOOKING HISTORY ---------- */}
              {(searchParams.get('sub') || 'bookings') === 'bookings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-orange-600" />
                      Booking History
                      {allBookings.length > 0 && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          {allBookings.length} bookings
                        </Badge>
                      )}
                    </h2>
                  </div>

                  {bookingsLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
                    </div>
                  ) : allBookings.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                          <Calendar className="h-10 w-10 text-orange-200" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                          Book a puja with our verified pandits to get started on your spiritual journey.
                        </p>
                        <Button onClick={() => navigate("/booking")} className="bg-orange-600 hover:bg-orange-700">
                          <Calendar className="h-4 w-4 mr-2" />
                          Book a Puja
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {allBookings.map((booking) => {
                          const isExpanded = expandedBooking === booking.id;
                          return (
                            <motion.div
                              key={booking.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                                {/* Header Row */}
                                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800/50 dark:to-gray-800/30 px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Booking </span>
                                      <span className="font-bold">#{booking.id}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Date </span>
                                      <span className="font-medium">
                                        {new Date(booking.booking_date).toLocaleDateString("en-IN", {
                                          year: "numeric", month: "short", day: "numeric",
                                        })}
                                      </span>
                                    </div>
                                    {booking.booking_time && (
                                      <div>
                                        <span className="text-muted-foreground">Time </span>
                                        <span className="font-medium">{booking.booking_time}</span>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-muted-foreground">Total </span>
                                      <span className="font-bold text-orange-600">
                                        ₹{Number(booking.total_fee || 0).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge
                                    className={`${getBookingStatusColor(booking.status)} border gap-1.5 font-medium`}
                                    variant="outline"
                                  >
                                    {getBookingStatusIcon(booking.status)}
                                    {booking.status}
                                  </Badge>
                                </div>

                                {/* Main Content */}
                                <CardContent className="p-6">
                                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    {/* Left: Service Info */}
                                    <div className="flex-1 space-y-2">
                                      <h3 className="text-lg font-semibold">{booking.service_name}</h3>
                                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                          <User2 className="h-4 w-4" />
                                          <span>{booking.pandit_full_name || booking.pandit_name || 'Pandit'}</span>
                                        </div>
                                        {booking.pandit_expertise && (
                                          <div className="flex items-center gap-1.5">
                                            <FileText className="h-4 w-4" />
                                            <span>{booking.pandit_expertise}</span>
                                          </div>
                                        )}
                                        {booking.service_location && (
                                          <div className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4" />
                                            <span>{booking.service_location}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-wrap gap-2">
                                      {(booking.daily_room_url || booking.video_room_url) &&
                                        ['ACCEPTED', 'PENDING'].includes(booking.status) && (
                                        <Button
                                          size="sm"
                                          className="bg-blue-600 hover:bg-blue-700"
                                          onClick={() => navigate(`/puja-room/${booking.id}`)}
                                        >
                                          <Video className="h-4 w-4 mr-1.5" />
                                          Join Video
                                        </Button>
                                      )}
                                      {booking.recording_url && booking.recording_available && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(booking.recording_url!, '_blank')}
                                        >
                                          <Video className="h-4 w-4 mr-1.5" />
                                          Recording
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                        onClick={() => handleDownloadBookingInvoice(booking.id)}
                                        disabled={downloadingInvoice === `booking-${booking.id}`}
                                      >
                                        {downloadingInvoice === `booking-${booking.id}` ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-1.5" />
                                        ) : (
                                          <Download className="h-4 w-4 mr-1.5" />
                                        )}
                                        Invoice
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                                      >
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Expanded Details */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* Fee Breakdown */}
                                          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 space-y-2">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                              <IndianRupee className="h-4 w-4 text-orange-600" />
                                              Fee Breakdown
                                            </h4>
                                            <div className="space-y-1 text-sm">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Service Fee</span>
                                                <span>₹{Number(booking.service_fee || 0).toLocaleString("en-IN")}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Samagri Fee</span>
                                                <span>₹{Number(booking.samagri_fee || 0).toLocaleString("en-IN")}</span>
                                              </div>
                                              <div className="flex justify-between font-bold border-t pt-1">
                                                <span>Total</span>
                                                <span className="text-orange-600">₹{Number(booking.total_fee || 0).toLocaleString("en-IN")}</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Payment Details */}
                                          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 space-y-2">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                              <CreditCard className="h-4 w-4 text-blue-600" />
                                              Payment Details
                                            </h4>
                                            <div className="space-y-1 text-sm">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Status</span>
                                                <Badge variant="outline" className={booking.payment_status ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                                                  {booking.payment_status ? 'Paid' : 'Unpaid'}
                                                </Badge>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Method</span>
                                                <span className="font-medium">{booking.payment_method || 'N/A'}</span>
                                              </div>
                                              {booking.transaction_id && (
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Transaction ID</span>
                                                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                                    {booking.transaction_id.length > 20 ? booking.transaction_id.slice(0, 20) + '...' : booking.transaction_id}
                                                  </span>
                                                </div>
                                              )}
                                              {booking.created_at && (
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Booked On</span>
                                                  <span>{new Date(booking.created_at).toLocaleDateString("en-IN", {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                  })}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

              {/* ---------- SUB: SHOP ORDERS ---------- */}
              {searchParams.get('sub') === 'shop-orders' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Package className="h-6 w-6 text-blue-600" />
                      Shop Orders
                      {orders.length > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {orders.length} orders
                        </Badge>
                      )}
                    </h2>
                  </div>

                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
                    </div>
                  ) : orders.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                          <Package className="h-10 w-10 text-blue-200" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No shop orders yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                          Purchase puja samagri and spiritual items from our shop.
                        </p>
                        <Button onClick={() => navigate("/shop/samagri")} className="bg-orange-600 hover:bg-orange-700">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Browse Shop
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {orders.map((order) => {
                          const isExpanded = expandedOrder === order.id;
                          return (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-800/30 px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Order </span>
                                      <span className="font-bold">#{order.id}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Placed </span>
                                      <span className="font-medium">
                                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                                          year: "numeric", month: "short", day: "numeric",
                                        })}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Items </span>
                                      <span className="font-medium">{order.items.length}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Total </span>
                                      <span className="font-bold text-orange-600">
                                        ₹{Number(order.total_amount).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge
                                    className={`${getStatusColor(order.status)} border gap-1.5 font-medium`}
                                    variant="outline"
                                  >
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                  </Badge>
                                </div>

                                {/* Items List */}
                                <CardContent className="p-6">
                                  <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-4 py-2 border-b last:border-0">
                                        <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                                          <Package className="h-5 w-5 text-orange-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm line-clamp-1">{item.item_name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Qty: {item.quantity} × ₹{Number(item.price_at_purchase).toLocaleString("en-IN")}
                                          </p>
                                        </div>
                                        <p className="font-semibold text-sm">
                                          ₹{(Number(item.price_at_purchase) * item.quantity).toLocaleString("en-IN")}
                                        </p>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Actions Row */}
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-4 border-t gap-3">
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                        onClick={() => handleDownloadShopInvoice(order.id)}
                                        disabled={downloadingInvoice === `order-${order.id}`}
                                      >
                                        {downloadingInvoice === `order-${order.id}` ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-1.5" />
                                        ) : (
                                          <Download className="h-4 w-4 mr-1.5" />
                                        )}
                                        Download Invoice
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate("/shop/samagri")}
                                      >
                                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                        Buy Again
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        {isExpanded ? 'Less' : 'Details'}
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Expanded Payment & Shipping Details */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* Payment Details */}
                                          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 space-y-2">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                              <CreditCard className="h-4 w-4 text-blue-600" />
                                              Payment Details
                                            </h4>
                                            <div className="space-y-1 text-sm">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Method</span>
                                                <span className="font-medium">{order.payment_method || 'N/A'}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Amount</span>
                                                <span className="font-bold text-orange-600">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
                                              </div>
                                              {order.transaction_id && (
                                                <div className="flex justify-between">
                                                  <span className="text-muted-foreground">Transaction ID</span>
                                                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                                    {order.transaction_id.length > 20 ? order.transaction_id.slice(0, 20) + '...' : order.transaction_id}
                                                  </span>
                                                </div>
                                              )}
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Date</span>
                                                <span>{new Date(order.created_at).toLocaleDateString("en-IN", {
                                                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Shipping Details */}
                                          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 space-y-2">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                              <Truck className="h-4 w-4 text-green-600" />
                                              Shipping Details
                                            </h4>
                                            <div className="space-y-1 text-sm">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Name</span>
                                                <span className="font-medium">{order.full_name}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Phone</span>
                                                <span>{order.phone_number}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Address</span>
                                                <span className="text-right max-w-[200px]">{order.shipping_address}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">City</span>
                                                <span>{order.city}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ========================= KUNDALI TAB ========================= */}
          <TabsContent value="kundali" className="mt-4">
            <KundaliHistory />
          </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
