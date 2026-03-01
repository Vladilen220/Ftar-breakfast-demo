import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Trash2, Edit2 } from "lucide-react";

export default function Menu() {
  const [, setLocation] = useLocation();
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemShared, setNewItemShared] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deliveryFee, setDeliveryFee] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: menuItems, isLoading, isFetching, refetch } = trpc.breakfast.getMenu.useQuery(undefined, { retry: false });
  const [showLoading, setShowLoading] = useState(false);
  const loadingStartRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const MIN_MS = 300;
    const active = isLoading || isFetching;
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
  }, [isLoading, isFetching]);
  const { data: currentFee } = trpc.breakfast.getDeliveryFeeValue.useQuery();

  useEffect(() => {
    if (currentFee !== undefined) {
      setDeliveryFee(currentFee.toString());
    }
  }, [currentFee]);

  const addMenuItemMutation = trpc.breakfast.addMenuItem.useMutation({
    onSuccess: () => {
      setSuccess("تم إضافة الصنف بنجاح!");
      setNewItemName("");
      setNewItemPrice("");
      setNewItemShared(false);
      refetch();
    },
    onError: (error: any) => {
      setError(error.message || "خطأ في إضافة الصنف");
    },
  });

  const deleteMenuItemMutation = trpc.breakfast.deleteMenuItem.useMutation({
    onSuccess: () => {
      setSuccess("تم حذف الصنف بنجاح!");
      refetch();
    },
    onError: (error: any) => {
      setError(error.message || "خطأ في حذف الصنف");
    },
  });

  const updateMenuItemMutation = trpc.breakfast.updateMenuItem.useMutation({
    onSuccess: () => {
      setSuccess("تم تحديث الصنف بنجاح!");
      setEditingItem(null);
      refetch();
    },
    onError: (error: any) => {
      setError(error.message || "خطأ في تحديث الصنف");
    },
  });

  const updateDeliveryFeeMutation = trpc.breakfast.updateDeliveryFee.useMutation({
    onSuccess: () => {
      setSuccess("تم تحديث رسم التوصيل بنجاح!");
    },
    onError: (error: any) => {
      setError(error.message || "خطأ في تحديث رسم التوصيل");
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newItemName.trim() || !newItemPrice.trim()) {
      setError("يرجى ملء جميع الحقول");
      return;
    }

    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price <= 0) {
      setError("السعر يجب أن يكون رقماً موجباً");
      return;
    }

    addMenuItemMutation.mutate({
      name: newItemName,
      price,
      shared: newItemShared,
    });
  };

  const handleDeleteItem = (itemId: string, name: string) => {
    if (confirm(`هل تريد حذف ${name}؟`)) {
      deleteMenuItemMutation.mutate({ itemId });
    }
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editingItem.name.trim() || !editingItem.price) {
      setError("يرجى ملء جميع الحقول");
      return;
    }

    const price = parseFloat(editingItem.price);
    if (isNaN(price) || price <= 0) {
      setError("السعر يجب أن يكون رقماً موجباً");
      return;
    }

    updateMenuItemMutation.mutate({
      itemId: editingItem._id || editingItem.id,
      name: editingItem.name,
      price,
      shared: editingItem.shared,
    });
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-orange-700 font-cairo">🍞 تعديل المنيو</h1>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="font-cairo"
          >
            العودة
          </Button>
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

        {/* Delivery Fee */}
        <Card className="mb-6 shadow-lg border-blue-200">
          <CardHeader>
            <CardTitle className="font-cairo">⚙️ رسم التوصيل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-gray-700 font-cairo">
                  رسم التوصيل (جنيه)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  placeholder="رسم التوصيل"
                  className="text-right font-cairo"
                  dir="rtl"
                  disabled={updateDeliveryFeeMutation.isPending}
                />
              </div>
              <Button
                onClick={() => {
                  const fee = parseFloat(deliveryFee);
                  if (isNaN(fee) || fee < 0) {
                    setError("الرسم يجب أن يكون رقماً موجباً");
                    return;
                  }
                  updateDeliveryFeeMutation.mutate({ fee });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-cairo h-10 mt-7"
                disabled={updateDeliveryFeeMutation.isPending}
              >
                {updateDeliveryFeeMutation.isPending ? "جاري..." : "حفظ"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Item Form */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="font-cairo">➕ إضافة صنف جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 font-cairo">
                    اسم الصنف
                  </label>
                  <Input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="اسم الصنف"
                    className="text-right font-cairo"
                    dir="rtl"
                    disabled={addMenuItemMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 font-cairo">
                    السعر (جنيه)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="السعر"
                    className="text-right font-cairo"
                    dir="rtl"
                    disabled={addMenuItemMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 font-cairo">
                    نوع الصنف
                  </label>
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id="newShared"
                      checked={newItemShared}
                      onChange={(e) => setNewItemShared(e.target.checked)}
                      className="w-4 h-4"
                      disabled={addMenuItemMutation.isPending}
                    />
                    <label htmlFor="newShared" className="text-sm font-cairo cursor-pointer">
                      مشترك
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-cairo h-10 mt-7"
                  disabled={addMenuItemMutation.isPending}
                >
                  {addMenuItemMutation.isPending ? "جاري..." : "إضافة"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Edit Item Form */}
        {editingItem && (
          <Card className="mb-6 shadow-lg border-blue-200">
            <CardHeader>
              <CardTitle className="font-cairo">تعديل الصنف</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 font-cairo">
                      اسم الصنف
                    </label>
                    <Input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, name: e.target.value })
                      }
                      className="text-right font-cairo"
                      dir="rtl"
                      disabled={updateMenuItemMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 font-cairo">
                      السعر (جنيه)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingItem.price}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, price: e.target.value })
                      }
                      className="text-right font-cairo"
                      dir="rtl"
                      disabled={updateMenuItemMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 font-cairo">
                      نوع الصنف
                    </label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="checkbox"
                        id="editShared"
                        checked={editingItem.shared}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, shared: e.target.checked })
                        }
                        className="w-4 h-4"
                        disabled={updateMenuItemMutation.isPending}
                      />
                      <label htmlFor="editShared" className="text-sm font-cairo cursor-pointer">
                        مشترك
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-7">
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-cairo"
                      disabled={updateMenuItemMutation.isPending}
                    >
                      {updateMenuItemMutation.isPending ? "جاري..." : "حفظ"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      variant="outline"
                      className="font-cairo"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Menu Items List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-cairo">قائمة الأصناف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {menuItems && menuItems.length > 0 ? (
                menuItems.map((item: any) => (
                  <div
                    key={item._id || item.id || item.name}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-orange-50 transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 font-cairo">{item.name}</p>
                      <div className="flex gap-2 mt-1">
                        <p className="text-sm text-gray-600 font-cairo">{item.price} جنيه</p>
                        {item.shared && (
                          <p className="text-xs text-orange-600 font-cairo">مشترك</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingItem(item)}
                        variant="outline"
                        size="sm"
                        className="font-cairo"
                      >
                        <Edit2 size={16} className="ml-1" />
                        تعديل
                      </Button>
                      <Button
                        onClick={() => handleDeleteItem(item._id || item.id, item.name)}
                        variant="destructive"
                        size="sm"
                        className="font-cairo"
                        disabled={deleteMenuItemMutation.isPending}
                      >
                        <Trash2 size={16} className="ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-4 font-cairo">لا توجد أصناف</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
