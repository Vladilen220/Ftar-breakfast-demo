import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Trash2 } from "lucide-react";

export default function Users() {
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Determine if user is company admin or system admin
  const isCompanyAdmin = Boolean(user?.role === 'company-admin' && user?.companyId);
  const isSystemAdmin = Boolean(user?.role === 'admin' && !user?.companyId);

  // Use appropriate endpoints based on admin type
  const companyUsersQuery = trpc.breakfast.getCompanyUsers.useQuery(undefined, {
    enabled: isCompanyAdmin,
    retry: false,
  });

  const systemUsersQuery = trpc.breakfast.getUsers.useQuery(undefined, {
    enabled: isSystemAdmin,
    retry: false,
  });

  const users = isCompanyAdmin ? companyUsersQuery.data : systemUsersQuery.data;
  const isLoading = isCompanyAdmin ? companyUsersQuery.isLoading : systemUsersQuery.isLoading;
  const refetch = isCompanyAdmin ? companyUsersQuery.refetch : systemUsersQuery.refetch;

  const formatErrorMessage = (errorMsg: string | undefined): string => {
    if (!errorMsg) return "حدث خطأ غير متوقع";
    
    try {
      const parsed = JSON.parse(errorMsg);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((err: any) => err.message || err.code).join("، ");
      }
    } catch {
      // Not JSON, return as is
    }
    
    return errorMsg;
  };

  const addCompanyUserMutation = trpc.breakfast.addCompanyUser.useMutation({
    onSuccess: () => {
      setSuccess("تم إضافة المستخدم بنجاح!");
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setIsAdmin(false);
      refetch();
    },
    onError: (error) => {
      setError(formatErrorMessage(error.message));
    },
  });

  const addUserMutation = trpc.breakfast.addUser.useMutation({
    onSuccess: () => {
      setSuccess("تم إضافة المستخدم بنجاح!");
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setIsAdmin(false);
      refetch();
    },
    onError: (error) => {
      setError(formatErrorMessage(error.message));
    },
  });

  const deleteCompanyUserMutation = trpc.breakfast.deleteCompanyUser.useMutation({
    onSuccess: () => {
      setSuccess("تم حذف المستخدم بنجاح!");
      refetch();
    },
    onError: (error) => {
      setError(formatErrorMessage(error.message));
    },
  });

  const deleteUserMutation = trpc.breakfast.deleteUser.useMutation({
    onSuccess: () => {
      setSuccess("تم حذف المستخدم بنجاح!");
      refetch();
    },
    onError: (error) => {
      setError(formatErrorMessage(error.message));
    },
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newUsername.trim() || !newPassword.trim()) {
      setError("يرجى ملء جميع الحقول");
      return;
    }

    if (isCompanyAdmin) {
      addCompanyUserMutation.mutate({
        username: newUsername,
        password: newPassword,
        name: newName || newUsername,
      });
    } else if (isSystemAdmin) {
      addUserMutation.mutate({
        username: newUsername,
        password: newPassword,
        admin: isAdmin,
      });
    }
  };

  const handleDeleteUser = (username: string) => {
    if (confirm(`هل تريد حذف المستخدم ${username}؟`)) {
      if (isCompanyAdmin) {
        deleteCompanyUserMutation.mutate({ username });
      } else if (isSystemAdmin) {
        deleteUserMutation.mutate({ username });
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="font-cairo text-red-600">⚠️ خطأ في الجلسة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle size={20} className="flex-shrink-0" />
              <p className="text-sm font-cairo">يرجى تسجيل الدخول أولاً</p>
            </div>
            <Button
              onClick={() => setLocation("/login")}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-cairo"
            >
              ← العودة لتسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isCompanyAdmin && !isSystemAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="font-cairo text-red-600">⚠️ خطأ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle size={20} className="flex-shrink-0" />
              <p className="text-sm font-cairo">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
            </div>
            <Button
              onClick={() => setLocation("/")}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-cairo"
            >
              ← العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50" dir="rtl">
        <p className="text-gray-600 font-cairo">جاري تحميل المستخدمين...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-orange-700 font-cairo">👥 إدارة المستخدمين</h1>
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

        {/* Add User Form */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="font-cairo">➕ إضافة مستخدم جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 font-cairo">
                    اسم المستخدم
                  </label>
                  <Input
                    type="text"
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      setError("");
                    }}
                    placeholder="اسم المستخدم"
                    className="text-right font-cairo"
                    dir="rtl"
                    disabled={addCompanyUserMutation.isPending || addUserMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 font-cairo">
                    كلمة المرور
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="كلمة المرور"
                    className="text-right font-cairo"
                    dir="rtl"
                    disabled={addCompanyUserMutation.isPending || addUserMutation.isPending}
                  />
                </div>

                {isCompanyAdmin && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 font-cairo">
                      الاسم الكامل
                    </label>
                    <Input
                      type="text"
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        setError("");
                      }}
                      placeholder="الاسم الكامل (اختياري)"
                      className="text-right font-cairo"
                      dir="rtl"
                      disabled={addCompanyUserMutation.isPending}
                    />
                  </div>
                )}

                {isSystemAdmin && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 font-cairo">
                      الصلاحيات
                    </label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="checkbox"
                        id="newAdmin"
                        checked={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.checked)}
                        className="w-4 h-4"
                        disabled={addUserMutation.isPending}
                      />
                      <label htmlFor="newAdmin" className="text-sm font-cairo cursor-pointer">
                        مسؤول
                      </label>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-cairo h-10 mt-7"
                  disabled={addCompanyUserMutation.isPending || addUserMutation.isPending}
                >
                  {addCompanyUserMutation.isPending || addUserMutation.isPending ? "جاري..." : "إضافة"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-cairo">قائمة المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users && users.length > 0 ? (
                users.map((user: any) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-orange-50 transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 font-cairo">{user.username}</p>
                      <div className="flex gap-2 mt-1">
                        {(user.admin || user.role === "admin") && (
                          <p className="text-xs text-orange-600 font-cairo">مسؤول</p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteUser(user.username)}
                      variant="destructive"
                      size="sm"
                      className="font-cairo"
                      disabled={deleteCompanyUserMutation.isPending || deleteUserMutation.isPending}
                    >
                      <Trash2 size={16} className="ml-1" />
                      حذف
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-4 font-cairo">لا توجد مستخدمين</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
