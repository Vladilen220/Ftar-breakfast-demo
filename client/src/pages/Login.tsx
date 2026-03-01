import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const utils = trpc.useContext();

  const loginMutation = trpc.breakfast.login.useMutation({
    async onSuccess(data) {
      // Ensure server-side session is reflected in client cache
      try {
        await utils.auth.me.invalidate();
      } catch {}

      try {
        localStorage.setItem("username", data.username);
      } catch {}

      setSuccess("تم تسجيل الدخول بنجاح!");
      setTimeout(() => {
        setLocation("/");
      }, 800);
    },
    onError: (error) => {
      setError(error.message || "خطأ في تسجيل الدخول");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !password.trim()) {
      setError("يرجى ملء جميع الحقول");
      return;
    }

    // Login without company selection
    loginMutation.mutate({ 
      username, 
      password
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-orange-700">🥐 طلب الفطار</CardTitle>
          <p className="text-gray-600 mt-2 font-cairo">نظام طلب وجبات الفطار</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle size={20} className="flex-shrink-0" />
                <p className="text-sm font-cairo">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle size={20} className="flex-shrink-0" />
                <p className="text-sm font-cairo">{success}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 font-cairo">
                اسم المستخدم
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full text-right font-cairo"
                dir="rtl"
                disabled={loginMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 font-cairo">
                كلمة المرور
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full text-right font-cairo"
                dir="rtl"
                disabled={loginMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-cairo"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "جاري التسجيل..." : "تسجيل الدخول"}
            </Button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-4 font-cairo">
            للاختبار، استخدم أي اسم مستخدم وكلمة مرور (مثال: demo_user_1/123456)
          </p>

          <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
            <p className="text-center text-gray-600 text-sm font-cairo">هل أنت مؤسسة جديدة؟</p>
            <Button
              variant="outline"
              className="w-full font-cairo"
              onClick={() => setLocation("/register-company")}
            >
              تسجيل شركة جديدة
            </Button>
            
            <p className="text-center text-gray-600 text-sm font-cairo pt-2">لوحة التحكم</p>
            <Button
              variant="outline"
              className="w-full font-cairo text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={() => setLocation("/admin/company-requests")}
            >
              مراجعة طلبات الشركات
            </Button>
            <div className="mt-2">
              <Button
                variant="outline"
                className="w-full font-cairo text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                onClick={() => setLocation("/admin/all-companies")}
              >
                كل الشركات وإدارة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
