import express from "express";
import cors from "cors";
import mongoose from "mongoose";
const bodyParser = require("body-parser");
import cookieSession from "cookie-session";

import { errorHandler } from "./middlewares/errorHandler";
import { NotFoundError } from "./errors/NotFoundError";
import {
    signupRouter,
    signinRouter,
    signoutRouter,
    currentUserRouter,
} from "./routes/users";
import { startup, startupMega } from "./startupScript";
import { nodeRouter } from "./routes/nodes/nodeRouter";

const app = express();
app.set("trust proxy", true);
app.use(cors());
app.use(bodyParser.json());
app.use(
    cookieSession({
        signed: false,
        secure: false,
    })
);

app.use("/api/users", signupRouter);
app.use("/api/users", signinRouter);
app.use("/api/users", signoutRouter);
app.use("/api/users", currentUserRouter);
app.use("/api/nodes", nodeRouter);

app.all("*", (_req, _res, _next) => {
    throw new NotFoundError();
});

app.use(errorHandler);

(async () => {
    console.log("Starting up...");
    try {
        if (!process.env.JWT_KEY) throw new Error("JWT_KEY must be defined");
        if (!process.env.MONGO_URI)
            throw new Error("MONGO_URI must be defined");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to mongo db");
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(err.message);
        }
    }
    await startup();
    // await startupMega();
    app.listen(3000, () => console.log("Listening to port 3000!"));
})();
