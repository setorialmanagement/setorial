import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existing = await this.usersService.findByEmail(registerDto.email);
        if (existing) {
            throw new BadRequestException('Email already in use');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        await this.usersService.createUser({
            email: registerDto.email,
            password: hashedPassword,
            name: registerDto.name,
            emailOtp: otp,
            emailOtpExpiresAt: otpExpires,
            isEmailVerified: false,
        });

        // Fire-and-forget: queue email sending without waiting
        this.notificationsService.sendOtpEmail(registerDto.email, otp, registerDto.name || 'Student').catch(err =>
            this.logger.warn(`Failed to queue OTP email in register: ${err.message}`)
        );

        return {
            message: 'Registration successful. Please check your email for the verification code.',
            email: registerDto.email
        };
    }

    async verifyOtp(email: string, otp: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new BadRequestException('User not found');

        if (user.isEmailVerified) {
            throw new BadRequestException('Email already verified');
        }

        if (user.emailOtp !== otp) {
            throw new BadRequestException('Invalid verification code');
        }

        if (user.emailOtpExpiresAt && new Date() > user.emailOtpExpiresAt) {
            throw new BadRequestException('Verification code has expired');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailOtp: null,
                emailOtpExpiresAt: null,
            }
        });

        // Fire-and-forget: queue welcome email without waiting
        this.notificationsService.sendWelcomeEmail(updatedUser.email, updatedUser.name || 'Student').catch(err =>
            this.logger.warn(`Failed to queue welcome email in verifyOtp: ${err.message}`)
        );

        return this.generateAuthResponse(updatedUser);
    }

    async login(loginDto: LoginDto, ipCountry?: string) {
        let user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isEmailVerified) {
            throw new UnauthorizedException('Please verify your email address first');
        }

        // Fraud detection logic
        if (ipCountry && user.countryLocked && user.billingCountry && user.billingCountry.toUpperCase() !== ipCountry.toUpperCase()) {
            if (!user.isFlagged) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { isFlagged: true }
                });
            }
        }

        // Update last active
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() }
        });

        return this.generateAuthResponse(user);
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new UnauthorizedException('User not found');

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) throw new BadRequestException('Current password is incorrect');

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });

        return { message: 'Password updated successfully' };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // We return a standard success message even if the user is not found to prevent email enumeration
            return { message: 'If an account with that email exists, a password reset code has been sent.' };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailOtp: otp,
                emailOtpExpiresAt: otpExpires,
            }
        });

        // Fire-and-forget: queue password reset email without waiting
        this.notificationsService.sendPasswordResetEmail(user.email, otp, user.name || 'Student').catch(err =>
            this.logger.warn(`Failed to queue password reset email: ${err.message}`)
        );

        return { message: 'If an account with that email exists, a password reset code has been sent.' };
    }

    async resetPassword(email: string, otp: string, newPassword: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new BadRequestException('User not found');

        if (user.emailOtp !== otp) {
            throw new BadRequestException('Invalid verification code');
        }

        if (user.emailOtpExpiresAt && new Date() > user.emailOtpExpiresAt) {
            throw new BadRequestException('Verification code has expired');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                emailOtp: null,
                emailOtpExpiresAt: null,
            }
        });

        return { message: 'Password has been successfully reset. You can now log in.' };
    }

    private generateAuthResponse(user: any) {
        const payload = { sub: user.id, email: user.email, role: user.role, tier: user.tier };
        const { password, ...userWithoutPassword } = user;

        const frontendUser = {
            ...userWithoutPassword,
            name: user.name || user.email.split('@')[0],
            points: 0,
            avatarUrl: 'https://i.pravatar.cc/150?u=' + user.id
        };

        return {
            user: frontendUser,
            token: this.jwtService.sign(payload),
            refresh_token: this.jwtService.sign(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || '7d',
            }),
        };
    }
}
