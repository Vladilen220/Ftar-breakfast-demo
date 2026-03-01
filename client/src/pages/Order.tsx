import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Plus, Minus } from "lucide-react";

interface MenuItem {
  _id?: string;
  name: string;
  price: number;
  shared: boolean;
  participants?: string[];
}

interface OrderItem {
  item: string;
  count: number;
  price: number;
  shared: boolean;
}

export default function Order() {
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Record<string, number>>({});
  const [sharedItems, setSharedItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [username, setUsername] = useState("");
  const { user, logout } = useAuthContext();

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      try {
        localStorage.setItem("username", user.username || "");
      } catch {}
    } else {
      setUsername("");
      try {
        localStorage.removeItem("username");
        localStorage.removeItem("auth-user-info");
      } catch {}
    }
  }, [user]);

  const { data: menuItems, isLoading: menuLoading, isFetching: menuFetching } = trpc.breakfast.getMenu.useQuery(undefined, { retry: false });
  const [showLoading, setShowLoading] = useState(false);
  const loadingStartRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const MIN_MS = 300;
    const active = menuLoading || menuFetching;
    if (active) {
      loadingStartRef.current = Date.now();
      setShowLoading(true);
    } else {
      const start = loadingStartRef.current;
      if (start) {
        const elapsed = Date.now() - start;
        if (elapsed >= MIN_MS) {
          setShowLoading(false);
        } else {
          timer = window.setTimeout(() => setShowLoading(false), MIN_MS - elapsed);
        }
      } else {
        setShowLoading(false);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [menuLoading, menuFetching]);
  const addOrderMutation = trpc.breakfast.addOrder.useMutation({
    onSuccess: () => {
      setSuccess("تم إرسال الطلب بنجاح!");
      setOrders({});
      setSharedItems(new Set());
      setTimeout(() => {
        setLocation("/summary");
      }, 1500);
    },
    onError: (error) => {
      setError(error.message || "خطأ في إرسال الطلب");
    },
  });

  useEffect(() => {
    // legacy: keep username in sync if meQuery already has data
    const storedUsername = localStorage.getItem("username");
    if (!username && storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleIncrement = (itemName: string) => {
    setOrders((prev) => ({
      ...prev,
      [itemName]: (prev[itemName] ?? 0) + 1,
    }));
  };

  const handleDecrement = (itemName: string) => {
    setOrders((prev) => ({
      ...prev,
      [itemName]: Math.max(0, (prev[itemName] ?? 0) - 1),
    }));
  };

  const handleToggleShared = (itemName: string) => {
    setSharedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    setError("");
    setSuccess("");

    if (!username) {
      setError("يجب تسجيل الدخول أولاً");
      return;
    }

    const orderItems: OrderItem[] = [];

    if (menuItems) {
      for (const item of menuItems) {
        const quantity = orders[item.name] ?? 0;
        const isShared = sharedItems.has(item.name);

        if (item.shared) {
          if (isShared) {
            orderItems.push({
              item: item.name,
              count: 1,
              price: item.price,
              shared: true,
            });
          }
        } else if (quantity > 0) {
          orderItems.push({
            item: item.name,
            count: quantity,
            price: item.price,
            shared: false,
          });
        }
      }
    }

    if (orderItems.length === 0) {
      setError("يرجى اختيار طلب واحد على الأقل");
      return;
    }

    addOrderMutation.mutate({ orders: orderItems });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="text-gray-600 font-cairo">جاري تحميل القائمة...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-orange-700 font-cairo">🥐 طلب الفطار</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-cairo">مرحباً {username}</span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="font-cairo"
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-cairo">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-cairo">{success}</p>
          </div>
        )}

        {/* Menu Items */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-cairo">القائمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {menuItems?.map((item: MenuItem) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-orange-50 transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 font-cairo">
                    {item.name}
                    {item.shared && <span className="text-orange-600"> (مشترك)</span>}
                  </p>
                  <p className="text-sm text-gray-600 font-cairo">{item.price} جنيه</p>
                  {item.shared && item.participants && item.participants.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1 font-cairo">
                      المشاركون: {item.participants.length}
                    </p>
                  )}
                </div>

                {item.shared ? (
                  // Shared Item Toggle
                  <button
                    onClick={() => handleToggleShared(item.name)}
                    className={`px-4 py-2 rounded-lg font-cairo transition ${
                      sharedItems.has(item.name)
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-gray-700"
                    } ${item.participants?.includes(username) ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={item.participants?.includes(username)}
                  >
                    {item.participants?.includes(username)
                      ? "✅ مشارك"
                      : sharedItems.has(item.name)
                        ? "مشارك"
                        : "غير مشارك"}
                  </button>
                ) : (
                  // Quantity Counter
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrement(item.name)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-8 text-center font-semibold font-cairo">
                      {orders[item.name] ?? 0}
                    </span>
                    <button
                      onClick={() => handleIncrement(item.name)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-cairo py-6 text-lg"
            disabled={addOrderMutation.isPending}
          >
            {addOrderMutation.isPending ? "جاري الإرسال..." : "📤 إرسال الطلب"}
          </Button>
          <Button
            onClick={() => setLocation("/summary")}
            variant="outline"
            className="flex-1 font-cairo py-6 text-lg"
          >
            📊 عرض الملخص
          </Button>
          {/* Menu edit: role is admin/company-admin OR (has companyId) */}
          {((user?.role === 'admin' || user?.role === 'company-admin') || user?.companyId) && (
            <Button
              onClick={() => setLocation("/menu")}
              variant="outline"
              className="flex-1 font-cairo py-6 text-lg"
            >
              🍞 تعديل المنيو
            </Button>
          )}

          {/* User management: role is admin/company-admin */}
          {(user?.role === 'admin' || user?.role === 'company-admin') && (
            <Button
              onClick={() => setLocation("/users")}
              variant="outline"
              className="flex-1 font-cairo py-6 text-lg"
            >
              👥 إدارة المستخدمين
            </Button>
          )}

          {/* Company approval: system admins only (role = admin, no companyId) */}
          {user?.role === 'admin' && !user?.companyId && (
            <Button
              onClick={() => setLocation("/admin/company-requests")}
              variant="outline"
              className="flex-1 font-cairo py-6 text-lg bg-indigo-50"
            >
              📋 مراجعة طلبات الشركات
            </Button>
          )}
          {user?.role === 'admin' && !user?.companyId && (
            <Button
              onClick={() => setLocation("/admin/all-companies")}
              variant="outline"
              className="flex-1 font-cairo py-6 text-lg bg-emerald-50"
            >
              إدارة كل الشركات
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
