import mongoose, { Document } from "mongoose";
import { Password } from "../services/Password";

export interface IUser {
    username: string;
    password: string;
}

export interface IUserDoc extends IUser, Document {}

const userSchema = new mongoose.Schema<IUser>({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

userSchema.set("toJSON", {
    transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
    },
});

userSchema.pre("save", async function (done: any) {
    if (this.isModified("password")) {
        this.password = await Password.toHash(this.password);
    }
    done();
});

const User = mongoose.model<IUserDoc>("User", userSchema);

export { User };
