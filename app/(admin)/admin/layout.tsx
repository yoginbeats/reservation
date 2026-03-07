import { getRole } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role, branch } = await getRole();

    return (
        <div className="flex min-h-[calc(100vh-64px)]">
            <AdminSidebar role={role} branch={branch} />
            {/* Main Content */}
            <div className="flex-1 p-8 print:p-0 print:block">{children}</div>
        </div>
    );
}
