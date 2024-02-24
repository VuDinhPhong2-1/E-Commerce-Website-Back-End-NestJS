import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { error } from 'console';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { retry, throwError } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import e, { Response } from 'express';
import { RolesService } from 'src/roles/roles.service';
@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        @InjectModel(User.name)
        private UserModel: SoftDeleteModel<UserDocument>,
        private configService: ConfigService,
        private readonly rolesService: RolesService
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(username);
        if (typeof user === 'string') {
            // Xử lý trường hợp lỗi ở đây, ví dụ: throw một lỗi xác thực
            throw new InternalServerErrorException("Tên đăng nhập không hợp lệ!");
        }
        const isPassword = await this.usersService.isValidPassword(pass, user.password)
        if (isPassword === false) {
            throw new InternalServerErrorException("Mật khẩu và Tên người dùng không đúng!!!");
        } else {
            // trả về thông tin người dùng => login nhận thông tin và tạo token...
            const userRole = user.role as unknown as { _id: string; name: string };
            const temp = await this.rolesService.findOne(userRole._id);
            //console.log({ permission: temp?.permissions ?? [] })
            const objUser = {
                ...user.toObject(),
                permission: temp?.permissions ?? []
            }
            return objUser; // Lưu vào request.user
        }

    }
    async loginWithProviders(type: string, username: string) {
        
    }
    async login(user: IUser, response: Response) {
        const { _id, name, email, role, permission } = user;
        const payload = {
            sub: "token login",
            iss: "from server",
            _id,
            name,
            email,
            role
        };
        // gọi tới hàm tạo refresh token để tạo token
        const refresh_token = this.createRefreshToken(payload);
        // gọi tới hàm update token cho user
        await this.usersService.updateUserToken(refresh_token, _id.toString());
        //set refresh token cần ở cookie
        response.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
            sameSite: 'strict',
            secure: false,
            path: '/',
            domain: 'localhost', // Set the appropriate domain
        });

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                _id,
                name,
                email,
            },
            role,
            permission
        };
    }

    async RegisterUser(registerUserDto: RegisterUserDto) {
        const emailExists = await this.UserModel.findOne({ email: registerUserDto.email });
        if (emailExists) {
            throw new ConflictException('Email đã tồn tại!!!');
        }
        const roleUser = 'USER';
        const pass = await this.usersService.hashPassword(registerUserDto.password)
        const result = await this.UserModel.create(
            {
                ...registerUserDto,
                role: roleUser,
                password: pass
            });
        return result;
    }

    createRefreshToken = (payload) => {
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.get<string>("JWT_REFRESH_TOKEN_SECRET"),
            expiresIn: ms(this.configService.get<string>("JWT_REFRESH_EXPIRE")) / 1000,
        });
        return refresh_token;
    }

    processNewToken = async (refreshToken: string, response: Response) => {
        try {
            this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>("JWT_REFRESH_TOKEN_SECRET")
            });
            const user = await this.usersService.findOneByRefreshToken(refreshToken);
            if (user) {
                const { _id, name, email, role } = user;
                const payload = {
                    sub: "token login",
                    iss: "from server",
                    _id,
                    name,
                    email,
                    role
                };
                // gọi tới hàm tạo refresh token để tạo token
                const refresh_token = this.createRefreshToken(payload);
                // gọi tới hàm update token cho user
                await this.usersService.updateUserToken(refresh_token, _id.toString());

                //fetch user's role
                const userRole = user.role as unknown as { _id: string; name: string };
                const temp = await this.rolesService.findOne(userRole._id);
                //set refresh token cần ở cookie
                response.clearCookie('refresh_token');
                response.cookie('refresh_token', refresh_token, {
                    httpOnly: true,
                    maxAge: ms(this.configService.get<string>("JWT_REFRESH_EXPIRE"))
                });
                return {
                    access_token: this.jwtService.sign(payload),
                    user: {
                        _id,
                        name,
                        email,
                    },
                    role,
                    permission: temp?.permissions ?? []
                };
            } else {
                throw new BadRequestException("Token không hợp lệ! Hãy login");
            }
        } catch (error) {
            throw new BadRequestException("Token không hợp lệ! Hãy login");
        }
    }

    deleteCookieAndToken = async (userId: string, response: Response) => {
        try {
            response.clearCookie('refresh_token');
            await this.usersService.updateUserToken(null, userId);
            return "ok"
        } catch (error) {
            throw new BadRequestException(error);
        }
    }
}
