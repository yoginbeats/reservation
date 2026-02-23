import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, Search, Filter, Plus } from "lucide-react";

export default function TicketsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
                    <p className="text-muted-foreground">Issue and validate event tickets seamlessly.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Ticket
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search tickets..." className="pl-10" />
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                </Button>
            </div>

            {/* Tickets List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Tickets</CardTitle>
                    <CardDescription>A list of all tickets in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Ticket className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Ticket #TKT-{2000 + i}</p>
                                    <p className="text-sm text-muted-foreground">Event: Annual Gala • Seat: A{i}</p>
                                </div>
                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${i % 4 === 0
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : i % 2 === 0
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    }`}>
                                    {i % 4 === 0 ? "Cancelled" : i % 2 === 0 ? "Used" : "Valid"}
                                </span>
                                <Button variant="ghost" size="sm">View</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
