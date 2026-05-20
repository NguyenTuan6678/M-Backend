import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/users.schema';
import { RegisterAccountDto } from '@users/auth/dto/register.req';
import { MessageResponse } from '@app-types/message.res';
import { ERROR_RES, ERROR_INFO } from '@common/constants/error.const';
import { ChangePasswordDto } from '@users/auth/dto/change-password.req';
import { LoginReqType } from '@users/auth/dto/login.req';
import { LoginRes } from '@users/auth/dto/login.res';
import { comparePassword } from '@utils/validate-password';
import { RefreshTokenDto } from '@users/auth/dto/refresh-token.req';
import { LoggerService } from '@common/logs/logger.service';
import { Role } from '@utils/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModal: Model<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  logger = new LoggerService(AuthService.name);

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
      role: isExitingUser.role,
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
      const { username, password, role } = registerAccountDTO;
      if (!username || !password) {
        response = {
          code: ERROR_RES.BAD_REQUEST_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Invalid input',
        };
        return response;
      }

      const isExistingAdmin = await this.userModal.countDocuments({
        role: Role.ADMIN,
      });

      this.logger.log(`Existing admin count: ${isExistingAdmin}`);
      if (isExistingAdmin > 0) {
        response = {
          code: ERROR_RES.CONFLICT_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Admin account existed!',
        };
        return response;
      }

      const admin = await this.userModal.findOne({ role: Role.ADMIN });

      if (admin) {
        response = {
          code: ERROR_RES.CONFLICT_ERROR.statusCode,
          info: ERROR_INFO.FAIL,
          message: 'Account Existed!',
        };
        return response;
      }

      const adminRole = role ?? Role.ADMIN;

      const newAdmin = new this.userModal({
        username,
        password,
        role: adminRole,
      });

      await newAdmin.save();

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Register successfully',
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `There is a problem while registering account: ${error.message}`,
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
      // this.logger.log(`Password match result: ${isMatch}`);

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
        code: ERROR_RES.SUCCESS.statusCode,
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
        message: `There is a problem while login: ${error.message}`,
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
    // console.log('🚀 ~ AuthService ~ userId:', userId);
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

      user.password = new_password;

      await user.save();

      response = {
        code: ERROR_RES.SUCCESS.statusCode,
        info: ERROR_INFO.SUCCESS,
        message: 'Change password successfully',
      };
    } catch (error: any) {
      response = {
        code: ERROR_RES.INTERNAL_ERROR.statusCode,
        info: ERROR_INFO.FAIL,
        message: `There is a problem while changing password: ${error.message}`,
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
        code: ERROR_RES.SUCCESS.statusCode,
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
        message: `There is a reToken problem: ${error.message}`,
        content: null,
      };
    }
    return response;
  }
}
