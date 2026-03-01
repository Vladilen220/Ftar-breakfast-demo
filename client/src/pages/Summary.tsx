import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, RotateCcw } from "lucide-react";

export default function Summary() {
  const [, setLocation] = useLocation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const { user } = useAuthContext();

  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const username = meQuery.data ? (meQuery.data as any).username : "";

  useEffect(() => {
    if (meQuery.isLoading) return;
    if (!meQuery.data) {
      setSessionError(true);
      try {
        localStorage.removeItem("username");
        localStorage.removeItem("auth-user-info");
      } catch {}
    } else {
      // keep localStorage in sync for legacy pages
      try {
        localStorage.setItem("username", (meQuery.data as any).username || "");
      } catch {}
      setSessionError(false);
    }
  }, [meQuery.isLoading, meQuery.data]);

  const { data: summary, isLoading, refetch, error } = trpc.breakfast.getSummary.useQuery(
    undefined,
    {
      enabled: !!username,
      retry: false,
    }
  );

  const removeItemMutation = trpc.breakfast.removeItem.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const resetOrdersMutation = trpc.breakfast.resetOrders.useMutation({
    onSuccess: () => {
      refetch();
      setShowResetConfirm(false);
    },
  });

  if (sessionError || (!username && !isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4" dir="rtl">
        <div className="w-full max-w-md shadow-lg bg-white rounded-lg p-6">
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-cairo">يرجى تسجيل الدخول أولاً</p>
          </div>
          <Button
            onClick={() => setLocation("/login")}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-cairo"
          >
            ← العودة لتسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50" dir="rtl">
        <p className="text-gray-600 font-cairo">جاري تحميل الملخص...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4" dir="rtl">
        <div className="w-full max-w-md shadow-lg bg-white rounded-lg p-6">
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-cairo">{error?.message || "حدث خطأ في تحميل الملخص"}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => refetch()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-cairo"
            >
              إعادة محاولة
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="flex-1 font-cairo"
            >
              العودة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-orange-700 font-cairo">📊 ملخص الطلبات</h1>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="font-cairo"
          >
            <ArrowRight className="ml-2" size={18} />
            العودة
          </Button>
        </div>

        {/* Date & Info */}
        <div className="mb-6 text-gray-600 font-cairo">
          <p>التاريخ: <span className="font-semibold text-gray-800">{summary.date}</span></p>
        </div>

        {/* User Orders Section - Simplified Layout */}
        <div className="space-y-4 mb-8">
          {summary.orders.map((order: any, index: number) => {
            let userSubtotal = 0;
            order.orders.forEach((item: any) => {
              if (item.shared) {
                userSubtotal += summary.sharedPrices[item.item] || item.price;
              } else {
                userSubtotal += item.count * item.price;
              }
            });

            return (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* User Header */}
                <div className="bg-gradient-to-r from-orange-100 to-amber-100 px-4 py-3 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 font-cairo">{order.username}</h2>
                  <span className="text-sm text-gray-700 font-cairo">{order.totalItems} أصناف</span>
                </div>

                {/* User Items */}
                <div className="px-4 py-3 space-y-2">
                  {order.orders.map((item: any, itemIdx: number) => {
                    let itemTotal = 0;
                    if (item.shared) {
                      itemTotal = summary.sharedPrices[item.item] || item.price;
                    } else {
                      itemTotal = item.count * item.price;
                    }

                    const unitPrice = item.shared
                      ? summary.sharedPrices[item.item] ?? item.price
                      : item.price;

                    return (
                      <div key={itemIdx} className="flex items-center justify-between py-2 text-gray-700">
                        <div className="flex-1 font-cairo">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">
                              {item.item} × {item.count} — {unitPrice.toFixed(2)} جنيه لكل وحدة
                            </span>
                            {item.shared && <span className="text-orange-600 text-sm">(مشترك)</span>}
                          </div>
                          <div className="text-right text-sm text-gray-700 mt-1">
                            {itemTotal.toFixed(2)} جنيه
                          </div>
                          {item.timestamp && (
                            <div className="text-right text-xs text-gray-500 mt-1 font-cairo">
                              {new Date(item.timestamp).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {order.username === username && (
                          <div className="flex items-center gap-3 mr-3">
                            <Button
                              onClick={() =>
                                removeItemMutation.mutate({
                                  username: order.username,
                                  item: item.item,
                                })
                              }
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white h-8 w-8 p-0 flex items-center justify-center"
                              disabled={removeItemMutation.isPending}
                              title={`حذف ${item.item}`}
                              aria-label={`حذف ${item.item}`}
                            >
                              ❌
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* User Subtotal + Delivery */}
                <div className="bg-gray-50 px-4 py-3 border-t">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between font-cairo text-gray-700">
                      <span>الأصناف:</span>
                      <span className="font-semibold">{userSubtotal.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex items-center justify-between font-cairo text-gray-700">
                      <span>رسوم التوصيل:</span>
                      <span className="font-semibold">{summary.deliveryFeePerUser.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-lg border-t pt-2 font-cairo text-orange-700">
                      <span>الإجمالي:</span>
                      <span>{order.total.toFixed(2)} جنيه</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shared Items Info */}
        {Object.keys(summary.sharedPrices).length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-bold text-orange-700 font-cairo mb-3">🔄 الأصناف المشتركة</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(summary.sharedPrices).map(([itemName, price]: any) => (
                <div key={itemName} className="flex items-center justify-between font-cairo text-gray-700">
                  <span>{itemName}</span>
                  <span className="font-semibold">{price.toFixed(2)} جنيه للفرد</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grand Summary - Blue Section */}
        <div className="bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="space-y-3 font-cairo text-base">
            {/* Item Summary */}
            {Object.entries(summary.itemSummary).map(([itemName, details]: any) => {
              const unitPrice = details.price;
              const total = details.count * unitPrice;

              return (
                <div key={itemName} className="flex items-center justify-between w-full">
                  <div className="flex-1">
                    <span className="font-semibold">
                      {details.count} {itemName} <span className="font-normal text-sm">(سعر الصنف {unitPrice.toFixed(2)} جنيه)</span>
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <span>({details.count} × {unitPrice.toFixed(2)}) = </span>
                    <span className="font-semibold">{total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}

            {/* Divider */}
            <div className="border-t border-blue-400 my-4" />

            {/* Delivery Fee */}
            <div className="flex items-center justify-between text-lg">
              <span>إجمالي رسوم التوصيل: {summary.totalDelivery.toFixed(2)} جنيه</span>
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between text-2xl font-bold pt-2 border-t border-blue-400">
              <span>إجمالي كل العناصر: {summary.grandTotalItems}</span>
              <span>المجموع = {summary.grandTotal.toFixed(2)} جنيه (شامل رسوم التوصيل)</span>
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setLocation("/")}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-cairo py-5 text-base min-w-[120px]"
          >
            ← العودة للطلبات
          </Button>

          {/* Menu edit: role is admin/company-admin OR (has companyId) */}
          {((user?.role === 'admin' || user?.role === 'company-admin') || user?.companyId) && (
            <Button
              onClick={() => setLocation("/menu")}
              variant="outline"
              className="flex-1 font-cairo py-5 text-base min-w-[120px]"
            >
              🍞 تعديل المنيو
            </Button>
          )}

          {/* User management: role is admin/company-admin */}
          {(user?.role === 'admin' || user?.role === 'company-admin') && (
            <Button
              onClick={() => setLocation("/users")}
              variant="outline"
              className="flex-1 font-cairo py-5 text-base min-w-[120px]"
            >
              👥 إدارة المستخدمين
            </Button>
          )}

          {/* Reset orders: system admins only (role = admin, no companyId) */}
          {user?.role === 'admin' && !user?.companyId && (
            <>
              {!showResetConfirm ? (
                <Button
                  onClick={() => setShowResetConfirm(true)}
                  variant="destructive"
                  className="font-cairo py-5 text-base"
                >
                  <RotateCcw size={18} className="ml-2" />
                  إعادة تعيين
                </Button>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={() => resetOrdersMutation.mutate()}
                    variant="destructive"
                    className="flex-1 font-cairo"
                    disabled={resetOrdersMutation.isPending}
                  >
                    {resetOrdersMutation.isPending ? "جاري..." : "تأكيد الحذف"}
                  </Button>
                  <Button
                    onClick={() => setShowResetConfirm(false)}
                    variant="outline"
                    className="flex-1 font-cairo"
                  >
                    إلغاء
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
