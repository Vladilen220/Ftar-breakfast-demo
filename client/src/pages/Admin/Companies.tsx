import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AdminCompanies() {
  const { data: companies, isLoading, refetch } = trpc.company.getApprovedCompanies.useQuery();

  useEffect(() => {
    refetch();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">إدارة الشركات المسجلة</h1>
      {(!companies || companies.length === 0) && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">لا توجد شركات مسجلة</div>
      )}

      <div className="grid gap-3">
        {companies?.map((c: any) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle>{c.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>{c.code ? `Code: ${c.code}` : ""}</div>
              <div className="flex gap-2">
                <Button onClick={() => window.alert('Open details for ' + c.name)}>
                  تفاصيل
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
