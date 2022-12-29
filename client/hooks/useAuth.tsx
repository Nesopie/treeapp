import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";

export interface IAuthProviderProps {
    children: React.ReactNode;
}

export interface IAuthContext {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    signIn: (username: string, password: string) => Promise<void>;
    signUp: (username: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    loading: Boolean;
}

const AuthContext = createContext<IAuthContext>({
    user: null,
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
    setUser: () => {},
    loading: false,
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }: IAuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    const signIn = async (username: string, password: string) => {
        setLoading(true);
        try {
            const response = await axios.post<User>("/api/users/signin", {
                username,
                password,
            });
            setUser(response.data);
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (username: string, password: string) => {
        setLoading(true);
        try {
            console.log("starting");
            const response = await axios.post<User>("/api/users/signup", {
                username,
                password,
            });
            setUser({ username: response.data.username });
        } catch (err: unknown) {
            console.log("in the error");
            if (err instanceof Error) {
                alert(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await axios.post("/api/users/signout");
            setUser(null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.log(err.message);
            }
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, signIn, signUp, loading, signOut, setUser }}
        >
            {children}
        </AuthContext.Provider>
    );
};
