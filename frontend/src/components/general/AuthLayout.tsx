"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { AppSidebar } from "../AppSidebar";

interface DashboardLayoutProps {
    children: ReactNode;
    requireAdmin?: boolean;
}

export default function DashboardLayout({ children, requireAdmin = false }: DashboardLayoutProps) {
    const { user, isAuthLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const getPageTitle = () => {
        const titles: Record<string, string> = {
            "/dashboard": "Dashboard",
            "/my-books": "My Books",
            "/explore": "Explore",
            "/profile": "Profile",
            "/admin/all-books": "All Books",
            "/admin/all-users": "All Users",
        };
        return titles[pathname] || "Dashboard";
    };

    const isBookDetailPage = () => {
        return pathname?.startsWith("/book/");
    };

    const getBookDetailBreadcrumb = () => {
        // First, check query parameter
        const fromParam = searchParams?.get("from");
        if (fromParam) {
            const fromMap: Record<string, { title: string; href: string }> = {
                "my-books": { title: "My Books", href: "/my-books" },
                "dashboard": { title: "Dashboard", href: "/dashboard" },
                "explore": { title: "Explore", href: "/explore" },
                "all-books": { title: "All Books", href: "/admin/all-books" },
            };
            const from = fromMap[fromParam];
            if (from) {
                return from;
            }
        }

        // Fallback: check referrer
        if (typeof window !== "undefined" && document.referrer) {
            try {
                const referrer = new URL(document.referrer);
                // Only use referrer if it's from the same origin
                if (referrer.origin === window.location.origin) {
                    const referrerPath = referrer.pathname;

                    if (referrerPath.includes("/my-books")) {
                        return { title: "My Books", href: "/my-books" };
                    }
                    if (referrerPath.includes("/explore")) {
                        return { title: "Explore", href: "/explore" };
                    }
                    if (referrerPath.includes("/admin/all-books")) {
                        return { title: "All Books", href: "/admin/all-books" };
                    }
                    if (referrerPath.includes("/dashboard")) {
                        return { title: "Dashboard", href: "/dashboard" };
                    }
                }
            } catch {
                // Invalid referrer URL, ignore
            }
        }

        // Default fallback
        return { title: "Dashboard", href: "/dashboard" };
    };

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            router.push("/login");
            return;
        }

        if (requireAdmin && user.role !== "Admin") {
            router.push("/dashboard");
        }
    }, [user, isAuthLoading, requireAdmin, router]);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null; // Already redirected
    if (requireAdmin && user.role !== "Admin") return null;

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0 overflow-x-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            {isBookDetailPage() ? (() => {
                                const parent = getBookDetailBreadcrumb();
                                return (
                                    <>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink asChild>
                                                <Link href={parent.href}>{parent.title}</Link>
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>Detail</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </>
                                );
                            })() : (
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
                                </BreadcrumbItem>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden p-4 md:p-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
