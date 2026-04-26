import { ClientLogoutButton } from "@/components/client-logout-button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-[calc(100vh-64px)]">
            {/* Main Content */}
            <div className="container mx-auto p-6 md:py-10">{children}</div>
        </div>
    );
}
