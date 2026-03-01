import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

function CompanyUserSelector({
  companyId,
  value,
  onChange,
}: {
  companyId: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const usersQuery = trpc.company.getCompanyUsersById.useQuery(
    { companyId },
    { enabled: !!companyId, retry: false }
  );

  if (usersQuery.isLoading) return <div className="text-sm text-gray-500">Loading users...</div>;

  return (
    <select
      className="w-full p-2 border rounded"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">-- اختر مستخدم --</option>
      {usersQuery.data?.map((u: any) => (
        <option key={u.id} value={u.username}>
          {u.name} ({u.username})
        </option>
      ))}
    </select>
  );
}

function CompanyDetails({ companyId }: { companyId: string }) {
  const menuQuery = trpc.company.getCompanyMenu.useQuery({ companyId }, { retry: false });
  const summaryQuery = trpc.company.getCompanySummary.useQuery({ companyId }, { retry: false });

  return (
    <div className="space-y-3">
      <div className="p-3 bg-white border rounded shadow-sm">
        <h4 className="font-semibold">القائمة</h4>
        {menuQuery.isLoading ? (
          <div className="text-sm text-gray-500">Loading menu...</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {menuQuery.data && menuQuery.data.length > 0 ? (
              menuQuery.data.map((m: any) => (
                <div key={m._id || m.name} className="p-2 border rounded bg-orange-50">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-gray-600">{m.price} جنيه</div>
                  {m.shared && <div className="text-xs text-orange-700">مشترك ({(m.participants||[]).length})</div>}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">لا توجد أصناف</div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 bg-white border rounded shadow-sm">
        <h4 className="font-semibold">ملخص اليوم</h4>
        {summaryQuery.isLoading ? (
          <div className="text-sm text-gray-500">Loading summary...</div>
        ) : summaryQuery.data ? (
          <div className="text-sm text-gray-700 mt-2">
            <div>إجمالي: {summaryQuery.data.grandTotal} جنيه</div>
            <div>رسم التوصيل لكل مستخدم: {summaryQuery.data.deliveryFeePerUser} جنيه</div>
            <div className="mt-2">المستخدمون:</div>
            <ul className="list-disc pl-6">
              {summaryQuery.data.orders.map((o: any) => (
                <li key={o.username} className="text-sm">
                  {o.username} — {o.total} جنيه — {o.totalItems} أصناف
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-sm text-gray-500">لا يوجد ملخص</div>
        )}
      </div>
    </div>
  );
}

function CompanyUsersList({ companyId }: { companyId: string }) {
  const usersQuery = trpc.company.getCompanyUsersById.useQuery({ companyId }, { retry: false });

  if (usersQuery.isLoading) return <div className="text-sm text-gray-500">Loading users...</div>;

  if (!usersQuery.data || usersQuery.data.length === 0) {
    return <div className="p-3 bg-white border rounded">لا يوجد مستخدمون</div>;
  }

  return (
    <div className="p-3 bg-white border rounded space-y-2">
      {usersQuery.data.map((u: any) => (
        <div key={u.id} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{u.name}</div>
            <div className="text-sm text-gray-600">{u.username} — {u.email}</div>
          </div>
          <div className="text-sm text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAllCompanies() {
  const { data: companies, isLoading, refetch } = trpc.company.getAllCompanies.useQuery();
  const [, setLocation] = useLocation();
  const reassign = trpc.company.reassignCompanyAdmin.useMutation();
  const addMember = trpc.company.addCompanyMember.useMutation();
  const setBlocked = trpc.company.setCompanyBlocked.useMutation();

  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const [adminUsername, setAdminUsername] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [showUsersFor, setShowUsersFor] = useState<string | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">قائمة جميع الشركات</h1>
        <Button onClick={() => setLocation('/')}>العودة إلى لوحة القيادة</Button>
      </div>
      {(!companies || companies.length === 0) && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">لا توجد شركات</div>
      )}

      <div className="grid gap-3">
        {companies?.map((c: any) => (
          <div key={c.id} className="space-y-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{c.name}</CardTitle>
                    <div className="text-sm text-gray-600">Status: {c.status}</div>
                    {c.code ? <div className="text-sm text-gray-500">Code: {c.code}</div> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedCompany(c);
                        setAdminUsername("");
                        setReassignOpen(true);
                      }}
                    >
                      إعادة تعيين المشرف
                    </Button>

                    <Button
                      onClick={() => {
                        setSelectedCompany(c);
                        setMemberName("");
                        setMemberEmail("");
                        setMemberPassword("");
                        setAddMemberOpen(true);
                      }}
                    >
                      إضافة عضو
                    </Button>

                    <Button
                      variant={c.status === "blocked" ? "destructive" : "outline"}
                      onClick={async () => {
                        try {
                          await setBlocked.mutateAsync({ companyId: c.id, blocked: c.status !== "blocked" });
                          refetch();
                        } catch (e: any) {
                          alert(e?.message || "Failed");
                        }
                      }}
                    >
                      {c.status === "blocked" ? "رفع الحظر" : "حظر الشركة"}
                    </Button>

                    <Button
                      onClick={() => {
                        setSelectedCompany((prev: any) => (prev?.id === c.id ? null : c));
                      }}
                    >
                      {selectedCompany?.id === c.id ? "إخفاء التفاصيل" : "تفاصيل"}
                    </Button>

                    <Button
                      onClick={() => setShowUsersFor(prev => prev === c.id ? null : c.id)}
                    >
                      {showUsersFor === c.id ? "إخفاء المستخدمين" : "عرض المستخدمين"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">Created: {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</div>
              </CardContent>
            </Card>

            {/* Inline expanded details */}
            {selectedCompany?.id === c.id && (
              <div className="pl-4">
                <CompanyDetails companyId={c.id} />
              </div>
            )}

            {showUsersFor === c.id && (
              <div className="pl-4">
                <CompanyUsersList companyId={c.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reassign Admin Dialog */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعادة تعيين مشرف الشركة</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-gray-700">الشركة: {selectedCompany?.name}</div>
            {/* Fetch users for the selected company and let admin choose */}
            {selectedCompany ? (
              <CompanyUserSelector
                companyId={selectedCompany.id}
                value={adminUsername}
                onChange={(v: string) => setAdminUsername(v)}
              />
            ) : (
              <div className="text-sm text-gray-500">اختر شركة أولاً</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!selectedCompany || !adminUsername) return;
                try {
                  await reassign.mutateAsync({ companyId: selectedCompany.id, username: adminUsername });
                  setReassignOpen(false);
                  refetch();
                } catch (e: any) {
                  alert(e?.message || "Failed");
                }
              }}
            >
              {reassign.isPending ? "Assigning..." : "Assign Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة عضو للشركة</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-gray-700">الشركة: {selectedCompany?.name}</div>
            <Input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="الاسم" />
            <Input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="البريد الإلكتروني" />
            <Input value={memberPassword} onChange={(e) => setMemberPassword(e.target.value)} placeholder="كلمة مرور مؤقتة" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!selectedCompany || !memberName || !memberEmail || !memberPassword) return;
                try {
                  await addMember.mutateAsync({ companyId: selectedCompany.id, name: memberName, email: memberEmail, password: memberPassword });
                  setAddMemberOpen(false);
                  refetch();
                } catch (e: any) {
                  alert(e?.message || "Failed");
                }
              }}
            >
              {addMember.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
