import { Construction, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UnderConstruction() {
    return (
        <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-zinc-50 p-6 text-center dark:bg-zinc-950">
            <div className="max-w-md space-y-8 rounded-3xl border bg-white p-12 shadow-xl dark:bg-zinc-900">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500">
                    <Construction className="h-12 w-12 animate-pulse" />
                    <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-yellow-500" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Work in Progress
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                        Our reservation and ticketing system is currently being built. We&apos;ll be live soon with a premium experience!
                    </p>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full w-2/3 animate-[progress_2s_ease-in-out_infinite] bg-yellow-500" />
                </div>

                <div className="flex flex-col gap-4">
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 font-semibold text-white transition-all hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        Go to Login <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                        Check for updates
                    </button>
                </div>
            </div>

            <p className="mt-8 text-sm text-zinc-500">
                Estimated launch: Coming Soon
            </p>

            <style jsx>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
        </div>
    );
}
