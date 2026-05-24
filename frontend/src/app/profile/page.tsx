// app/profile/page.tsx
"use client";

import AuthLayout from "@/components/general/AuthLayout";
import { useUser } from "@/context/UserContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
export default function ProfilePage() {
    const { user } = useUser();
    if (!user) return <p>Loading...</p>;

    return (
        <AuthLayout>
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <p><strong>Name:</strong> {user.name} {user.surname}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
