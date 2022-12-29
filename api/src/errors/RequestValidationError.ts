import { ValidationError } from "express-validator";
import { CustomError } from "./CustomError";

export class RequestValidationError extends CustomError {
    statusCode = 400;

    constructor(private errors: Array<ValidationError>) {
        super("Invalid request parameters");

        Object.setPrototypeOf(this, new.target.prototype);
    }

    serializeErrors(): { message: string; field?: string | undefined }[] {
        return this.errors.map((error) => ({
            message: error.msg,
            field: error.param,
        }));
    }
}
