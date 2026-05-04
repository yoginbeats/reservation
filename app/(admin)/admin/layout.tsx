import { getRole } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role, branch } = await getRole();

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-zinc-950">
            <AdminSidebar role={role} branch={branch} className="hidden md:flex" />
            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 print:block">
                {/* Admin Topbar */}
                <header className="h-[72px] bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between px-6 shrink-0 print:hidden">
                    <div className="flex items-center gap-4">
                        <MobileSidebar role={role} branch={branch} />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Welcome, <span className="font-bold">{role === 'admin' ? 'Administrator' : `${branch} Admin`}</span>
                        </div>
                        <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-700 dark:text-red-400 font-bold uppercase shadow-sm">
                            {role === 'admin' ? 'A' : branch?.charAt(0) || 'U'}
                        </div>
                    </div>
                </header>
                
                {/* Page Content */}
                <main className="flex-1 p-6 md:p-8 print:p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
