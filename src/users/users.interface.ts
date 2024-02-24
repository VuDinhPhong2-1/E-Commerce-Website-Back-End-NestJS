import { Types } from "mongoose";

export interface IUser {
    _id: Types.ObjectId;
    name: string;
    email: string;
    type: string;
    role: {
        _id: string,
        name: string,
    },
    permission?: {
        _id: string,
        name: string,
        apiPath: string,
        module: string,
    }[]
}
