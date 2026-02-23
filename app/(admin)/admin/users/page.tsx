
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserCog, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function UsersPage() {
    const supabase = await createClient();

    // Fetch profiles. detailed join might fail if relation not defined in supabase client types or db constraints
    // Try simple fetch first
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name
        `)
        .order('full_name', { ascending: true });

    if (error) {
        console.error("Error fetching users:", error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">Manage user access and roles.</p>
                </div>
                <Button>
                    <UserCog className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-10" />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all registered users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr className="text-left">
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium">User ID</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profiles && profiles.length > 0 ? (
                                    profiles.map((profile) => (
                                        <tr key={profile.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 font-medium">{profile.full_name || "N/A"}</td>
                                            <td className="p-4 text-muted-foreground font-mono text-xs">{profile.id}</td>
                                            <td className="p-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem>View details</DropdownMenuItem>
                                                        <DropdownMenuItem>Edit role</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">Delete user</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
