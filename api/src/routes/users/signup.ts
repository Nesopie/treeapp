import { NextFunction, Request, Response, Router } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";

import { validateRequest } from "../../middlewares/validateRequest";
import { User } from "../../models/user";
import { BadRequestError } from "../../errors/badRequestError";

const router = Router();

router.post(
    "/signup",
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

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return next(new BadRequestError("Username is already in use"));
        }

        const user = new User({ username, password });
        await user.save();

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

        res.status(201).send(user);
    }
);

export { router as signupRouter };
