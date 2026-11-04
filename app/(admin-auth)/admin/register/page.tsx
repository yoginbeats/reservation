"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function AdminRegisterRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace("/admin/login?notice=staff_restricted");
        }, 1200);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mb-4">
                <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mb-2">
                Public Staff Registration Disabled
            </h1>
            <p className="text-sm text-zinc-400 max-w-md leading-relaxed mb-4">
                Administrator accounts are provisioned exclusively by System Developers. Operational staff (Tellers and Conductors) receive credentials directly from the Administrator.
            </p>
            <p className="text-xs text-zinc-600 animate-pulse">
                Redirecting to official staff portal...
            </p>
        </div>
    );
}
