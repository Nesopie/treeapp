import { CustomError } from "./CustomError";

export class NotFoundError extends CustomError {
    statusCode = 404;

    constructor() {
        super("Route not found");

        Object.setPrototypeOf(this, new.target.prototype);
    }

    serializeErrors(): { message: string; field?: string | undefined }[] {
        return [{ message: "Route not found" }];
    }
}
