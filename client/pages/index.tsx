import type { GetServerSideProps, NextPage } from "next";
import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import Auth from "../components/Auth";
import { useAuth } from "../hooks/useAuth";
import { buildClient } from "../api/buildClient";
import Tree from "../components/Tree";
import { Node, NodeType, User } from "../types";
import { TextField } from "@mui/material";
import axios from "axios";

const Home: NextPage<{ rootProp: Node; userProp: User }> = ({
    rootProp,
    userProp,
}) => {
    const { user, signOut, setUser } = useAuth();

    useEffect(() => {
        setUser(userProp);
    }, []);

    const [value, setValue] = useState("");
    const [result, setResult] = useState<Node[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [root, setRoot] = useState<Node>(rootProp);

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (value.length <= 3) return;
        const response = await axios.get<Node[]>(
            `/api/nodes/search?value=${value}`
        );
        setResult(response.data);
        setValue("");
    };

    useEffect(() => {
        setLoading(true);
        (async function () {
            if (user !== null) {
                const response = await axios.get<Node>(`/api/nodes/`);
                setRoot(response.data);

                setLoading(false);
            }
        })();
    }, [user]);

    return (
        <div className="bg-[#0b1929] min-h-screen max-h-100%">
            {!user ? (
                <Auth />
            ) : (
                !loading && (
                    <>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                signOut();
                            }}
                            className="text-white"
                        >
                            Signout
                        </button>
                        <form onSubmit={onSubmit}>
                            <TextField
                                id="standard-basic"
                                label="Search"
                                variant="standard"
                                sx={{
                                    width: "100%",
                                    input: {
                                        color: "white",
                                    },
                                    label: {
                                        color: "white",
                                    },
                                }}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </form>
                        {result ? (
                            result.map((node) => (
                                <Tree
                                    data={node}
                                    lock={true}
                                    fullyExpanded={true}
                                />
                            ))
                        ) : (
                            <Tree
                                data={root}
                                lock={false}
                                fullyExpanded={false}
                            />
                        )}

                        <Toaster
                            position="bottom-right"
                            reverseOrder={true}
                            gutter={16}
                            toastOptions={{
                                style: {
                                    background: "#38bdf9",
                                    color: "#fff",
                                    minWidth: "300px",
                                },
                            }}
                        />
                    </>
                )
            )}
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const currentUser: any = await buildClient({ req }).get<{
        currentUser: string | null;
    }>("/api/users/currentUser");

    if (!currentUser.data.currentUser) {
        return {
            props: { rootProp: {}, userProp: currentUser.data.currentUser },
        };
    }

    const response = await buildClient({ req }).get("/api/nodes");
    const sort = (node: { children: Node[] }) => {
        node.children.sort((a, b) => a.order - b.order);
        node.children.map((child) => sort(child));
    };
    const root = response.data;
    sort(root);
    return {
        props: { rootProp: root, userProp: currentUser.data.currentUser },
    };
};

export default Home;
