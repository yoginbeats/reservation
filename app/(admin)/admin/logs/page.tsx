import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Clock, User, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAuditLogsPage() {
    const supabase = await createClient();

    const { data: logs } = await supabase
        .from('audit_logs')
        .select(`
            id,
            action,
            entity_name,
            record_id,
            details,
            created_at,
            user_id
        `)
        .order('created_at', { ascending: false })
        .limit(20);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
                <p className="text-muted-foreground">Trace all critical actions including bookings, seat locks, payment updates, and QR verifications.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent System Audit Trail</CardTitle>
                    <CardDescription>Security and operational log records.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase">
                                <tr className="text-left">
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Entity</th>
                                    <th className="p-4">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs && logs.length > 0 ? (
                                    logs.map((log: any) => (
                                        <tr key={log.id} className="border-b hover:bg-muted/40">
                                            <td className="p-4 text-xs font-mono text-muted-foreground">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-4 font-bold text-blue-600 dark:text-blue-400">
                                                {log.action}
                                            </td>
                                            <td className="p-4 font-mono text-xs">{log.entity_name}</td>
                                            <td className="p-4 text-xs font-mono text-muted-foreground truncate max-w-xs">
                                                {JSON.stringify(log.details)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            No audit logs recorded yet. Logs will populate automatically on bookings and verifications.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
