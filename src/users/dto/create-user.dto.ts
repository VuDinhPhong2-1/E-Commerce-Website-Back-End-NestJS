import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsMongoId, IsNotEmpty, IsNotEmptyObject, IsObject, IsString, ValidateNested } from 'class-validator';
import mongoose from 'mongoose';

export class CreateUserDto {
    @IsNotEmpty({ message: 'Name Không được để trống!' })
    name: string

    @IsString({ message: 'Phải là 1 chuỗi ký tự!' })
    @IsNotEmpty({ message: 'Không được để trống!' })
    @IsEmail({}, { message: 'Không đúng định dạng email!' })
    email: string

    @IsNotEmpty()
    password: string

    @IsNotEmpty({ message: 'Age Không được để trống!' })
    age: number

    @IsNotEmpty({ message: 'Address Không được để trống!' })
    address: string

    @IsNotEmpty({ message: 'Address Không được để trống!' })
    @IsMongoId()
    role: mongoose.Schema.Types.ObjectId;

}
export class RegisterUserDto {
    @IsNotEmpty({ message: 'Name Không được để trống!' })
    name: string

    @IsString({ message: 'Phải là 1 chuỗi ký tự!' })
    @IsNotEmpty({ message: 'Không được để trống!' })
    @IsEmail({}, { message: 'Không đúng định dạng email!' })
    email: string

    @IsNotEmpty()
    password: string

    @IsNotEmpty({ message: 'Age Không được để trống!' })
    age: number

    @IsNotEmpty({ message: 'Address Không được để trống!' })
    address: string

    @IsNotEmpty({ message: 'Address Không được để trống!' })
    type: string
}
export class RegisterUserByProviderDto {
    @IsNotEmpty({ message: 'Name Không được để trống!' })
    name: string

    @IsString({ message: 'Phải là 1 chuỗi ký tự!' })
    @IsNotEmpty({ message: 'Không được để trống!' })
    @IsEmail({}, { message: 'Không đúng định dạng email!' })
    email: string

    @IsNotEmpty({ message: 'avatar Không được để trống!' })
    avatar: string

    @IsNotEmpty({ message: 'type Không được để trống!' })
    type: string
}
export class UserLoginDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'ajanuw', description: 'user name login' })
    readonly username: string;
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        example: '123456',
        description: 'Password login',
    })
    readonly password: string;
}