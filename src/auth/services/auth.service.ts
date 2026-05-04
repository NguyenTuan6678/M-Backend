import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@users/schemas/users.schema';
import { RegisterAccountDto } from '@auth/dto/register.req';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_RES, ERROR_INFO } from '@common/constants/error.const';
import { hashPassword } from '@utils/hash-password';
import { ChangePasswordDto } from '@auth/dto/change-password.req';
import { LoginReqType } from '@auth/dto/login.req';
import { LoginRes } from '@auth/dto/login.res';
import { comparePassword } from '@utils/validate-password';
import { RefreshTokenDto } from '@auth/dto/refresh-token.req';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModal: Model<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateToken(userInfo: User) {
    const isExitingUser = await this.userModal.findOne({
      username: userInfo.username,
    });

    if (!isExitingUser) {
      throw new NotFoundException('username not found');
    }

    const payload = {
      id: isExitingUser?._id.toString(),
      username: userInfo.username,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '12h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '24h',
    });

    const accessTokenExpiresIn = new Date();
    accessTokenExpiresIn.setMinutes(accessTokenExpiresIn.getMinutes() + 15);

    const refreshTokenExpiresIn = new Date();
    refreshTokenExpiresIn.setDate(refreshTokenExpiresIn.getDate() + 7);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: accessTokenExpiresIn.getTime(),
      refreshTokenExpiresIn: refreshTokenExpiresIn.getTime(),
    };
  }

  async register(
    registerAccountDTO: RegisterAccountDto,
  ): Promise<MessageResponse | null> {
    let response: MessageResponse | null = null;
    try {
      const { username, password } = registerAccountDTO;
      if (!username || !password) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Invalid input',
        };
        return response;
      }

      const isExistingAdmin = await this.userModal.countDocuments();
      if (isExistingAdmin > 0) {
        response = {
          code: ERROR_RES.CONFLICT_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Admin account existed!',
        };
        return response;
      }

      const admin = await this.userModal.findOne({ username });

      if (admin) {
        response = {
          code: ERROR_RES.CONFLICT_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Account Existed!',
        };
        return response;
      }

      const new_password = await hashPassword(password);

      const newAdmin = new this.userModal({
        username,
        password: new_password,
      });

      await newAdmin.save();

      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Register successfully',
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }

    return response;
  }
  async login(loginDto: LoginReqType): Promise<LoginRes | null> {
    let response: LoginRes | null = null;
    try {
      const { username, password } = loginDto;
      if (!username || !password) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Invalid input',
          content: null,
        };
        return response;
      }

      const admin = await this.userModal
        .findOne({ username })
        .select('+password');

      if (!admin) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Account not exist!',
          content: null,
        };
        return response;
      }

      const isMatch = await comparePassword(password, admin.password);

      if (!isMatch) {
        response = {
          code: ERROR_RES.INVALID_CREDENTIALS_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Password is incorrect',
          content: null,
        };
        return response;
      }

      const token = await this.generateToken(admin);
      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Login successfully',
        content: {
          accessToken: token.accessToken,
          expiresToken: token.accessTokenExpiresIn,
          refreshToken: token.refreshToken,
          expRefreshToken: token.refreshTokenExpiresIn,
        },
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
        content: null,
      };
    }
    return response;
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    userId: string,
  ): Promise<MessageResponse | null> {
    let response: MessageResponse | null = null;
    console.log('🚀 ~ AuthService ~ userId:', userId);
    try {
      const { new_password, old_password } = changePasswordDto;
      if (!new_password && !old_password) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Old password and new password is required',
        };
        return response;
      }

      const user = await this.userModal.findById(userId).select('+password');

      if (!user) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'User not found',
        };
        return response;
      }

      const isMatch = await comparePassword(old_password, user.password);

      if (!isMatch) {
        response = {
          code: ERROR_RES.INVALID_CREDENTIALS_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Old password is incorrect',
        };
        return response;
      }

      const password = await hashPassword(new_password);

      user.password = password;

      await user.save();

      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Change password successfully',
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
      };
    }
    return response;
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginRes | null> {
    let response: LoginRes | null = null;
    try {
      const { refreshToken } = refreshTokenDto;
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const admin = await this.userModal.findById(payload.id);

      if (!admin) {
        response = {
          code: ERROR_RES.NOT_FOUND_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'User not found',
          content: null,
        };
        return response;
      }

      const token = await this.generateToken(admin);
      response = {
        code: 200,
        info: ERROR_INFO.SUCCESS,
        message: 'Token refreshed successfully',
        content: {
          accessToken: token.accessToken,
          expiresToken: token.accessTokenExpiresIn,
          refreshToken: token.refreshToken,
          expRefreshToken: token.refreshTokenExpiresIn,
        },
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INVALID_CREDENTIALS_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: error.message,
        content: null,
      };
    }
    return response;
  }
}
