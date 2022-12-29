import { TextField } from "@mui/material";
import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useValue } from "../hooks/useValue";

const Auth = () => {
    const { value: username, onValueChange: onUsernameChange } = useValue("");
    const { value: password, onValueChange: onPasswordChange } = useValue("");
    const { signIn, signUp } = useAuth();

    return (
        <form>
            <div>
                <TextField
                    id="filled-basic"
                    label="Username"
                    variant="filled"
                    sx={{
                        input: {
                            color: "#66b2ff",
                        },
                        "& .MuiFormLabel-root": {
                            color: "#66b2ff",
                        },
                    }}
                    placeholder="Enter username"
                    value={username}
                    onChange={onUsernameChange}
                />
            </div>
            <div>
                <TextField
                    id="filled-basic"
                    label="Password"
                    variant="filled"
                    sx={{
                        input: {
                            color: "#66b2ff",
                        },
                        "& .MuiFormLabel-root": {
                            color: "#66b2ff",
                        },
                    }}
                    placeholder="Enter password"
                    value={password}
                    onChange={onPasswordChange}
                />
            </div>
            <div className="flex gap-2">
                <button
                    type="submit"
                    onClick={(e) => {
                        e.preventDefault();
                        signIn(username, password);
                    }}
                    className="text-white"
                >
                    Sign in
                </button>
                <button
                    type="submit"
                    onClick={(e) => {
                        e.preventDefault();
                        signUp(username, password);
                    }}
                    className="text-white"
                >
                    Sign up
                </button>
            </div>
        </form>
    );
};

export default Auth;
