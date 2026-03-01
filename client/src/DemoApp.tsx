import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";

const menuItems = [
  { name: "فول", price: 20 },
  { name: "طعمية", price: 15 },
  { name: "بيض", price: 18 },
  { name: "جبنة", price: 22 },
];

const sampleSummary = [
  { user: "أحمد", total: 55 },
  { user: "سارة", total: 42 },
  { user: "محمد", total: 38 },
];

export default function DemoApp() {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50" dir="rtl">
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="container py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-orange-700">فطار React</h1>
              <Badge variant="secondary">Demo</Badge>
            </div>
            <Button variant="outline" disabled>
              تسجيل الدخول معطل في النسخة التجريبية
            </Button>
          </div>
        </header>

        <main className="container py-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>نسخة عرض جاهزة للنشر</CardTitle>
              <CardDescription>
                هذه نسخة تجريبية ثابتة بدون خادم أو قاعدة بيانات، مناسبة للعرض على GitHub Pages.
              </CardDescription>
            </CardHeader>
          </Card>

          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>قائمة اليوم (بيانات تجريبية)</CardTitle>
                <CardDescription>أمثلة لواجهة إدارة المنيو.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {menuItems.map(item => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                  >
                    <span className="font-medium">{item.name}</span>
                    <Badge>{item.price} جنيه</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ملخص الطلبات (بيانات تجريبية)</CardTitle>
                <CardDescription>عرض شكل صفحة الملخص النهائية.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sampleSummary.map(row => (
                  <div
                    key={row.user}
                    className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                  >
                    <span className="font-medium">{row.user}</span>
                    <span className="text-sm text-muted-foreground">{row.total} جنيه</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>تشغيل النسخة الكاملة</CardTitle>
              <CardDescription>
                النسخة الكاملة ما زالت تعمل كما هي عند تشغيل المشروع العادي باستخدام الخادم وMongoDB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline">pnpm dev</Badge>
                <Badge variant="outline">pnpm build</Badge>
                <Badge variant="outline">pnpm start</Badge>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
