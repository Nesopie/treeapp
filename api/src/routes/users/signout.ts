import express, { Request, Response } from "express";

const router = express.Router();

router.post("/signout", (req: Request, res: Response) => {
    req.session = null;
    res.end();
});

export { router as signoutRouter };
