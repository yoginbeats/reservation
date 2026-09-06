import { createClient } from '@/lib/supabase/server';

interface AuditLogParams {
    userId?: string | null;
    action: string;
    entityName: string;
    recordId?: string | null;
    details?: Record<string, any>;
}

export async function logAuditEvent(params: AuditLogParams) {
    try {
        const supabase = await createClient();
        
        await supabase.from('audit_logs').insert({
            user_id: params.userId || null,
            action: params.action,
            entity_name: params.entityName,
            record_id: params.recordId || null,
            details: params.details || {},
        });
    } catch (err) {
        console.error('Failed to log audit event:', err);
    }
}
