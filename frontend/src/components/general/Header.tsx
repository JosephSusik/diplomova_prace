import { BookOpen, ChevronDown, LogOutIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

const Header = () => {
    const router = useRouter();
    const { user, logout } = useUser();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <header className="bg-white shadow-sm shadow-amber-500 border-b h-[56px] box-border flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <h1 className="ml-2 text-xl font-semibold text-gray-900 cursor-pointer" onClick={() => router.push("/dashboard")}>Bookly</h1>
                    </div>


                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-gray-100 rounded-md p-1">
                            <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <span className="flex items-center gap-1">
                                <p className="text-sm font-medium text-gray-900">{user?.name} {user?.surname}</p>
                                <ChevronDown size={14} />
                            </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {user?.role === "Admin" && (
                                <>
                                    <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer">Admin</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">Profile</DropdownMenuItem>
                            <DropdownMenuItem>Billing</DropdownMenuItem>
                            <DropdownMenuItem>Team</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                                <LogOutIcon color="red" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}

export default Header;