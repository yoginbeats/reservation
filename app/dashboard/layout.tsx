import { ClientLogoutButton } from "@/components/client-logout-button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-[calc(100vh-64px)]">
            {/* Client Navigation Bar */}
            <nav className="border-b bg-white dark:bg-zinc-950">
                <div className="container mx-auto flex h-12 items-center px-4">
                    <div className="ml-auto">
                        <ClientLogoutButton />
                    </div>
                </div>
            </nav>
            {/* Main Content */}
            <div className="container mx-auto p-6">{children}</div>
        </div>
    );
}
