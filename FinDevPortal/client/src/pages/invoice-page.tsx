import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Download, FileText, Calendar, User, DollarSign, Building } from "lucide-react";

export default function InvoicePage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Fetch invoice
  const { data: invoice, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/invoice", startDate, endDate],
    queryFn: async () => {
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (startDate) params.append('start', startDate);
        if (endDate) params.append('end', endDate);
        
        const token = localStorage.getItem('finconnect_token');
        const url = `/api/invoice${params.toString() ? `?${params.toString()}` : ''}`;
        
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            return { error: 'subscription_required' };
          }
          throw new Error('Failed to fetch invoice');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching invoice:', error);
        throw error;
      }
    },
    enabled: false // Don't fetch automatically on mount
  });
  
  // Generate invoice
  const handleGenerateInvoice = () => {
    refetch();
  };
  
  // Download invoice
  const handleDownloadInvoice = () => {
    // In a real implementation, this would download a PDF
    toast({
      title: "Invoice Downloaded",
      description: "Your invoice has been downloaded successfully."
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Generating invoice...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || (invoice && 'error' in invoice)) {
    return (
      <Layout>
        <div className="p-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {invoice && 'error' in invoice && invoice.error === 'subscription_required' 
                ? 'You need to subscribe to a plan to access this feature.' 
                : 'Failed to generate invoice. Please try again later.'}
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-medium text-neutral-800">Invoice Generator</h2>
          <p className="text-neutral-600">Generate and download invoices for your API usage</p>
        </div>
        
        {/* Invoice Generator Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Invoice</CardTitle>
            <CardDescription>
              Select a date range to generate an invoice for your API usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="w-full sm:w-1/2">
                <label htmlFor="start-date" className="block text-sm font-medium text-neutral-700 mb-1">
                  Start Date
                </label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label htmlFor="end-date" className="block text-sm font-medium text-neutral-700 mb-1">
                  End Date
                </label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleGenerateInvoice}>
                Generate Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Invoice Preview */}
        {invoice && !('error' in invoice) && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoice #{invoice.invoiceId}</CardTitle>
                <CardDescription>
                  {formatDate(invoice.startDate)} - {formatDate(invoice.endDate)}
                </CardDescription>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleDownloadInvoice}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                {/* Invoice Header */}
                <div className="p-6 bg-primary/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-semibold text-primary mb-1">INVOICE</h2>
                      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
                        <FileText className="h-4 w-4" />
                        <span>Invoice #{invoice.invoiceId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar className="h-4 w-4" />
                        <span>Date: {new Date(invoice.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <h3 className="font-medium">FinConnect</h3>
                      <p className="text-sm text-neutral-600">123 Fintech Street</p>
                      <p className="text-sm text-neutral-600">San Francisco, CA 94107</p>
                      <p className="text-sm text-neutral-600">support@finconnect.io</p>
                    </div>
                  </div>
                </div>
                
                {/* Customer Info */}
                <div className="p-6 border-b border-neutral-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-neutral-800 mb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-neutral-500" />
                        Customer
                      </h4>
                      <p className="text-sm">ID: {invoice.userId}</p>
                      <p className="text-sm">Email: user@example.com</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-800 mb-2 flex items-center gap-2">
                        <Building className="h-4 w-4 text-neutral-500" />
                        Billing Details
                      </h4>
                      <p className="text-sm">Status: <span className="text-green-600 font-medium">{invoice.status}</span></p>
                      <p className="text-sm">Currency: {invoice.currency}</p>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Items */}
                <div className="p-6">
                  <h4 className="font-medium text-neutral-800 mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-neutral-500" />
                    Invoice Items
                  </h4>
                  
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50">
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.unitPrice.toFixed(3)}</TableCell>
                          <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-6 flex justify-end">
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between py-2">
                        <span className="text-neutral-600">Subtotal</span>
                        <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-neutral-200">
                        <span className="text-neutral-600">Tax (10%)</span>
                        <span className="font-medium">${invoice.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-3 font-semibold">
                        <span>Total</span>
                        <span className="text-primary">${invoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="p-6 bg-neutral-50 border-t border-neutral-200 text-center text-sm text-neutral-600">
                  <p>Thank you for using FinConnect API services.</p>
                  <p>If you have any questions about this invoice, please contact our support team.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* No Invoice Generated Yet */}
        {!invoice && !isLoading && !error && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Invoice Generated</h3>
              <p className="text-neutral-600 mb-6 text-center max-w-md">
                Select a date range above and click "Generate Invoice" to create an invoice for your API usage.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
