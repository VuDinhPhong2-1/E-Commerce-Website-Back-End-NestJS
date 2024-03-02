import { Types } from "mongoose";

export interface IUser {
    _id: Types.ObjectId;
    name: string;
    email: string;
    type: string;
    image: string;
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

export class IRegisterUserByProvider {
    name: string
    email: string
    avatar: string
    type: string

    //@IsNotEmpty({ message: 'refresh_token_by_provider Không được để trống!' })
    // refresh_token_by_provider: string
}