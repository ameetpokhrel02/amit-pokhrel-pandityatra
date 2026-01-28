import React, { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const AdminErrorLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/adminpanel/error-logs/");
      setLogs(res.data);
    } catch (err: any) {
      setError("Failed to load error logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const markResolved = async (id: number) => {
    setUpdating(id);
    try {
      await apiClient.post("/adminpanel/error-logs/", { id, resolved: true });
      fetchLogs();
    } catch {
      setError("Failed to update log");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Payment & Booking Error Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin mr-2" /> Loading...
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : logs.length === 0 ? (
          <div className="text-gray-500">No error logs found.</div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-orange-50"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={log.resolved ? "success" : "destructive"}>
                      {log.resolved ? "Resolved" : "Unresolved"}
                    </Badge>
                    <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div className="font-semibold text-orange-900">{log.error_type}</div>
                  <div className="text-sm text-gray-800 mb-1">{log.message}</div>
                  {log.context && (
                    <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto mb-1">
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  )}
                  <div className="text-xs text-gray-500">
                    User: {log.user || "-"} | Booking: {log.booking_id || "-"} | Payment: {log.payment_id || "-"}
                  </div>
                  {log.admin_note && (
                    <div className="text-xs text-blue-700 mt-1">Note: {log.admin_note}</div>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[120px] items-end">
                  {log.resolved ? (
                    <CheckCircle className="text-green-500 w-6 h-6" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating === log.id}
                      onClick={() => markResolved(log.id)}
                    >
                      {updating === log.id ? <Loader2 className="animate-spin w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminErrorLogs;
