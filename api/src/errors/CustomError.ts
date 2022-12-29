export abstract class CustomError extends Error {
    abstract statusCode: number;

    constructor(message: string) {
        super(message);

        Object.setPrototypeOf(this, new.target.prototype);
    }

    abstract serializeErrors(): Array<{ message: string; field?: string }>;
}
