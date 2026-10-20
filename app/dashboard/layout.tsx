export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div 
            className="min-h-[calc(100vh-80px)] w-full relative bg-cover bg-center bg-no-repeat bg-fixed text-zinc-100"
            style={{
                backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.85), rgba(9, 9, 11, 0.92)), url('/scenic_highway_bg.jpg')`
            }}
        >
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">{children}</main>
        </div>
    );
}
