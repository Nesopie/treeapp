import { NextFunction, Request, Response, Router } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";

import { validateRequest } from "../../middlewares/validateRequest";
import { User } from "../../models/user";
import { BadRequestError } from "../../errors/badRequestError";
import { Password } from "../../services/Password";

const router = Router();

router.post(
    "/signin",
    [
        body("username")
            .notEmpty()
            .trim()
            .isLength({ min: 4, max: 20 })
            .withMessage("Username must be between 4 and 20 characters"),
        body("password")
            .notEmpty()
            .trim()
            .isLength({ min: 4, max: 20 })
            .withMessage("Password must be between 4 and 20 characters"),
    ],
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return next(new BadRequestError("Invalid credentials"));
        }

        const passwordsMatch = Password.compare(user.password, password);
        if (!passwordsMatch) {
            return next(new BadRequestError("Invalid credentials"));
        }

        const userJwt = jwt.sign(
            {
                username: user.username,
                id: user._id,
            },
            process.env.JWT_KEY!,
            {
                expiresIn: 60 * 30,
            }
        );

        req.session = {
            ...req.session,
            jwt: userJwt,
        };

        res.status(200).send(user);
    }
);

export { router as signinRouter };
