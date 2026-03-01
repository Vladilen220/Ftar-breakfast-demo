import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function CompanyRequestsAdmin() {
  const [, setLocation] = useLocation();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "deny" | null>(null);
  const [denyReason, setDenyReason] = useState("");

  const { data: requests, isLoading, refetch } = trpc.company.getPendingRequests.useQuery();

  const approveMutation = trpc.company.approveRequest.useMutation({
    onSuccess: () => {
      setSelectedRequestId(null);
      setActionType(null);
      refetch();
    },
  });

  const denyMutation = trpc.company.denyRequest.useMutation({
    onSuccess: () => {
      setSelectedRequestId(null);
      setActionType(null);
      setDenyReason("");
      refetch();
    },
  });

  const handleApprove = () => {
    if (selectedRequestId) {
      approveMutation.mutate({ requestId: selectedRequestId });
    }
  };

  const handleDeny = () => {
    if (selectedRequestId) {
      denyMutation.mutate({ requestId: selectedRequestId, reason: denyReason });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getRequestId = (req: any): string => {
    // Handle both string and ObjectId types
    const id = req.id || req._id || "";
    return typeof id === "string" ? id : id?.toString?.() || "";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Registration Requests</h1>
          <p className="text-gray-600 mt-2">Review and manage pending company registration requests</p>
        </div>
        <Button onClick={() => setLocation('/')}>العودة إلى لوحة القيادة</Button>
      </div>

      {(!requests || requests.length === 0) && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            No pending requests. All company registrations have been processed.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {requests?.map((request) => {
          const requestId = getRequestId(request);
          const createdDate = new Date(request.createdAt);
          
          return (
            <Card key={requestId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{request.companyName}</CardTitle>
                    <CardDescription>
                      Request ID: {requestId.slice(-8)} • Submitted {format(createdDate, "PPp")}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Requester Name</p>
                    <p className="text-base">{request.requesterName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Requester Email</p>
                    <p className="text-base break-all">{request.requesterEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Company Email</p>
                    <p className="text-base break-all">{request.companyEmail}</p>
                  </div>
                  {request.companyCode && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Company Code</p>
                      <p className="text-base">{request.companyCode}</p>
                    </div>
                  )}
                </div>

                {request.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Notes</p>
                    <p className="text-sm bg-gray-50 p-3 rounded border border-gray-200">
                      {request.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setSelectedRequestId(requestId);
                      setActionType("approve");
                    }}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedRequestId(requestId);
                      setActionType("deny");
                    }}
                    disabled={denyMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Deny
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Approve Dialog */}
      <Dialog open={actionType === "approve"} onOpenChange={() => actionType === "approve" && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Company Registration?</DialogTitle>
            <DialogDescription>
              An invitation email will be sent to the requester with a link to set up their admin account.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The company will be marked as approved and the invite token will be valid for 72 hours.
            </AlertDescription>
          </Alert>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionType(null);
                setSelectedRequestId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Confirm Approval"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={actionType === "deny"} onOpenChange={() => actionType === "deny" && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Company Registration</DialogTitle>
            <DialogDescription>
              Provide a reason for the denial. The requester will receive an email notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter reason for denial..."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              className="min-h-24"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionType(null);
                setSelectedRequestId(null);
                setDenyReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeny}
              disabled={denyMutation.isPending}
            >
              {denyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Denying...
                </>
              ) : (
                "Confirm Denial"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

