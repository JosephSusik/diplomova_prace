"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    id: string;
    email: string;
    name: string;
    surname: string;
    role: string;
    createdAt: string;
}

interface UserContextType {
    user: User | null;
    token: string | null;
    isAuthLoading: boolean;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // Load token & user from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        if (savedToken) {
            setToken(savedToken);
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${savedToken}` },
            })
                .then((res) => {
                    if (!res.ok) {
                        setToken(null);
                        localStorage.removeItem("token");
                        return;
                    }
                    return res.json();
                })
                .then((data) => data && setUser(data))
                .catch(() => {
                    setToken(null);
                    localStorage.removeItem("token");
                })
                .finally(() => setIsAuthLoading(false));
        } else {
            setIsAuthLoading(false);
        }
    }, []);

    const logout = () => {
        setUser(null);
        setToken(null);
        setIsAuthLoading(false);
        localStorage.removeItem("token");
    };

    return (
        <UserContext.Provider value={{ user, token, isAuthLoading, setUser, setToken, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used inside a UserProvider");
    return context;
};
