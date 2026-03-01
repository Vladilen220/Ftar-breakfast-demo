import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const registerCompanySchema = z.object({
  companyName: z.string().min(1, "Company name is required").min(3, "Company name must be at least 3 characters"),
  companyEmail: z.string().email("Invalid company email address"),
  requesterName: z.string().min(1, "Your name is required").min(2, "Name must be at least 2 characters"),
  requesterEmail: z.string().email("Invalid email address"),
  companyCode: z.string().optional(),
  notes: z.string().optional(),
});

type RegisterCompanyFormData = z.infer<typeof registerCompanySchema>;

export default function RegisterCompany() {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ companyName: string; requesterEmail: string } | null>(null);

  const form = useForm<RegisterCompanyFormData>({
    resolver: zodResolver(registerCompanySchema),
    defaultValues: {
      companyName: "",
      companyEmail: "",
      requesterName: "",
      requesterEmail: "",
      companyCode: "",
      notes: "",
    },
  });

  const submitMutation = trpc.company.submitRequest.useMutation({
    onSuccess: () => {
      // Store submitted data for display
      const formValues = form.getValues();
      setSubmittedData({
        companyName: formValues.companyName,
        requesterEmail: formValues.requesterEmail,
      });
      setSubmitted(true);
      form.reset();
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const onSubmit = (data: RegisterCompanyFormData) => {
    submitMutation.mutate(data);
  };

  if (submitted && submittedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle>Registration Request Submitted</CardTitle>
            <CardDescription>{submittedData.companyName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your company registration request has been submitted successfully. Our admin team will review your request and send you an approval email at <strong>{submittedData.requesterEmail}</strong> with next steps.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600">
              Typical review time: 24-48 hours. Please check your email for updates.
            </p>
            <Button
              onClick={() => setLocation("/login")}
              className="w-full"
              variant="default"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register Your Company</CardTitle>
          <CardDescription>
            Join Ftar and manage your orders efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Company Inc" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requesterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requesterEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., COMP001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about your company..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Registration"
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="text-blue-600 hover:underline"
                >
                  Login here
                </button>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
