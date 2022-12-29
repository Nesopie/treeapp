import express, { Request, Response, NextFunction } from "express";
import { currentUser } from "../../middlewares/currentUser";

const router = express.Router();

router.get(
    "/currentUser",
    currentUser,
    (req: Request, res: Response, next: NextFunction) => {
        res.send({ currentUser: req.currentUser || null });
    }
);

export { router as currentUserRouter };
