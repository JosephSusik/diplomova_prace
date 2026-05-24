"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/context/UserContext";

const QUICK_USERS = [
  { label: "Admin", email: "admin@bookly.com", initials: "A", color: "bg-indigo-500" },
  { label: "John", email: "user@bookly.com", initials: "J", color: "bg-emerald-500" },
  { label: "Alice", email: "alice@bookly.com", initials: "A", color: "bg-violet-500" },
  { label: "Bob", email: "bob@bookly.com", initials: "B", color: "bg-amber-500" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useUser();

  useEffect(() => {
    const hostname = window.location.hostname;
    setIsLocalhost(hostname === "localhost" || hostname === "127.0.0.1");
  }, []);

  const loginWithCredentials = async (loginEmail: string, loginPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to Bookly
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Track and manage your book collection
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" /> Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Register here
              </Link>
            </p>

            {isLocalhost && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400 tracking-wider">
                      Quick access
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {QUICK_USERS.map((u) => (
                    <button
                      key={u.email}
                      type="button"
                      disabled={isLoading}
                      onClick={() => loginWithCredentials(u.email, "Test1234.")}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${u.color}`}
                      >
                        {u.initials}
                      </span>
                      <span className="truncate">Login as {u.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
