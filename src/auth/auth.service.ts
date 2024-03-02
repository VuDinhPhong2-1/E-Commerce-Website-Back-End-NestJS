import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { error } from 'console';
import { JwtService } from '@nestjs/jwt';
import { IRegisterUserByProvider, IUser } from 'src/users/users.interface';
import { RegisterUserByProviderDto, RegisterUserDto } from 'src/users/dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { retry, throwError } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import e, { Response } from 'express';
import { RolesService } from 'src/roles/roles.service';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        @InjectModel(User.name)
        private UserModel: SoftDeleteModel<UserDocument>,
        private configService: ConfigService,
        private readonly rolesService: RolesService,
        @InjectModel(Role.name)
        private RoleModel: SoftDeleteModel<RoleDocument>,
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
    async loginWithProviders(response: Response, loginData: IRegisterUserByProvider) {
        const isExits = await this.usersService.findOneByEmailProvider(loginData.email, loginData.type);
        if (isExits !== false) {
            const { _id, name, email, role, permission } = isExits as any;
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
            await this.usersService.updateUserAvatar(loginData.avatar, _id.toString());

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
                refresh_token: refresh_token,
                user: {
                    image: loginData.avatar,
                    _id,
                    name,
                    email,
                },
                role,
                permission
            };
        } else {
            const result = await this.RegisterUserByProvider(loginData) as any;
            if (result) return this.login(result, response);
            return false;
        }
    }
    async login(user: IUser, response: Response) {
        const { _id, name, email, role, permission,image } = user;
        console.log("image",image)
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
        //console.log("user",user)
        return {
            access_token: this.jwtService.sign(payload),
            refresh_token: refresh_token,
            user: {
                image,
                _id,
                name,
                email,
            },
            role,
            permission
        };
    }
    async RegisterUserByProvider(registerUser: IRegisterUserByProvider) {
        if (!registerUser.email) {
            return false;
        } else {
            const emailExists = await this.UserModel.findOne({ email: registerUser.email });
            if (emailExists) {
                throw new ConflictException('Email đã tồn tại!!!');
            }
            const roleUser = await this.RoleModel.findOne({ name: 'USER' }) || await this.RoleModel.create({ name: 'USER' });
            const result = await this.UserModel.create(
                {
                    ...registerUser,
                    role: roleUser._id,
                });
            return result;
        }
    }
    async RegisterUser(registerUserDto: RegisterUserDto) {
        const emailExists = await this.UserModel.findOne({ email: registerUserDto.email });
        if (emailExists) {
            throw new ConflictException('Email đã tồn tại!!!');
        }
        const roleUser = await this.RoleModel.findOne({ name: 'USER' }) || await this.RoleModel.create({ name: 'USER' });
        const pass = await this.usersService.hashPassword(registerUserDto.password)
        const result = await this.UserModel.create(
            {
                ...registerUserDto,
                role: roleUser._id,
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
