import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Users, Ticket, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";

export default async function SalesAdminPage() {
    const supabase = await createClient();

    // Mock analytics data (normally calculated via Supabase RPC or aggregate queries)
    const stats = [
        { label: "Total Revenue", value: "₱128,450", change: "+12.5%", trend: "up", icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
        { label: "Tickets Sold", value: "842", change: "+5.2%", trend: "up", icon: Ticket, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Active Users", value: "1,204", change: "+2.1%", trend: "up", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Avg. Fill Rate", value: "78%", change: "-1.4%", trend: "down", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales & Analytics</h1>
                    <p className="text-muted-foreground italic">Monitor revenue performance and business growth.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Last 30 Days
                    </Button>
                    <Button className="bg-blue-600">Export Report</Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm shadow-zinc-200 dark:shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg} dark:bg-zinc-800`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tighter">{stat.value}</div>
                            <div className="flex items-center pt-1 text-xs">
                                {stat.trend === "up" ? (
                                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-600" />
                                ) : (
                                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-600" />
                                )}
                                <span className={stat.trend === "up" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                    {stat.change}
                                </span>
                                <span className="ml-1 text-muted-foreground italic">from last month</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue Chart Placeholder */}
            <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Comparison</CardTitle>
                        <CardDescription>Monthly revenue growth and performance highlights.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl m-6 border-2 border-dashed">
                        <div className="text-center space-y-2">
                            <TrendingUp className="h-10 w-10 text-zinc-300 mx-auto" />
                            <p className="text-sm text-muted-foreground italic">Interactive Chart Loading...</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Top Routes</CardTitle>
                        <CardDescription>Performance by destination.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        {[
                            { route: "Manila → Baguio", sales: "₱42,000", share: 35, color: "bg-blue-600" },
                            { route: "Manila → Aparri", sales: "₱28,450", share: 22, color: "bg-green-600" },
                            { route: "Cabanatuan → Manila", sales: "₱18,200", share: 15, color: "bg-purple-600" },
                            { route: "Manila → Tuguegarao", sales: "₱15,800", share: 12, color: "bg-orange-600" },
                        ].map((item) => (
                            <div key={item.route} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{item.route}</span>
                                    <span className="font-bold text-zinc-900 dark:text-zinc-50">{item.sales}</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color}`} style={{ width: `${item.share}%` }} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
