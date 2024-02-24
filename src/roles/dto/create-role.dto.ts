import { ArrayMinSize, IsArray, IsBoolean, IsMongoId, IsNotEmpty } from "class-validator";
import mongoose from "mongoose";

export class CreateRoleDto {
    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    description: string

    @IsNotEmpty()
    @IsBoolean()
    isActive: boolean

    @IsNotEmpty()
    @IsMongoId({ each: true }) // // Kiểm tra từng phần tử của mảng
    @IsArray()
    @ArrayMinSize(1)
    permissions: mongoose.Schema.Types.ObjectId[]
}
