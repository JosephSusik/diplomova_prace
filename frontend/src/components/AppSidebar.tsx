"use client"

import * as React from "react"
import {
    BookOpen,
    LayoutDashboard,
    Library,
    Compass,
    LogOut,
    User,
    Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useSidebar } from "@/components/ui/sidebar"
import { useUser } from "@/context/UserContext"
import { Separator } from "./ui/separator"

const menuItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "My Books",
        url: "/my-books",
        icon: Library,
    },
    {
        title: "Explore",
        url: "/explore",
        icon: Compass,
    },
]

const adminMenuItems = [
    {
        title: "All Books",
        url: "/admin/all-books",
        icon: BookOpen,
    },
    {
        title: "All Users",
        url: "/admin/all-users",
        icon: Users,
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useUser()
    const { state, isMobile } = useSidebar()
    const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild tooltip="Bookly">
                            <Link href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:mx-auto">
                                    <BookOpen className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-semibold">Bookly</span>
                                    <span className="truncate text-xs">Book Collection</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon className="size-4 group-data-[collapsible=icon]:size-5" />
                                            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <Separator orientation="horizontal" hidden={state !== "collapsed" || isMobile} />
                {user?.role === "Admin" && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Admin</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {adminMenuItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.url}
                                            tooltip={item.title}
                                        >
                                            <Link href={item.url}>
                                                <item.icon className="size-4 group-data-[collapsible=icon]:size-5" />
                                                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <Separator orientation="horizontal" />
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            isActive={pathname === "/profile"}
                            tooltip={user ? `${user.name} ${user.surname}` : "Profile"}
                        >
                            <Link href="/profile">
                                <User className="size-4 group-data-[collapsible=icon]:size-5" />
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-semibold">
                                        {user?.name} {user?.surname}
                                    </span>
                                    <span className="truncate text-xs">{user?.email}</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                            <AlertDialogTrigger asChild>
                                <SidebarMenuButton
                                    tooltip="Logout"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut className="size-4 group-data-[collapsible=icon]:size-5" />
                                    <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                                </SidebarMenuButton>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You will be logged out of your account. You can sign in again at any time.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleLogout}
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                        Logout
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

