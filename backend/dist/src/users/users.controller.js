"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const gamification_service_1 = require("../gamification/gamification.service");
const notifications_service_1 = require("../notifications/notifications.service");
const platform_express_1 = require("@nestjs/platform-express");
const upload_service_1 = require("../upload/upload.service");
let UsersController = class UsersController {
    usersService;
    gamificationService;
    notificationsService;
    uploadService;
    constructor(usersService, gamificationService, notificationsService, uploadService) {
        this.usersService = usersService;
        this.gamificationService = gamificationService;
        this.notificationsService = notificationsService;
        this.uploadService = uploadService;
    }
    async getMe(req) {
        const userId = req.user.userId;
        const [user, points, streak, badges, activeSub] = await Promise.all([
            this.usersService.findById(userId),
            this.usersService.getPoints(userId),
            this.gamificationService.getStreak(userId),
            this.gamificationService.getUserBadges(userId),
            this.usersService.getActiveSubscription(userId)
        ]);
        let detectedCountry = null;
        if (user && !user.billingCountry) {
            try {
                const xForwardedFor = req.headers['x-forwarded-for'];
                const ip = typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0] : req.connection.remoteAddress;
                if (ip && ip !== '::1' && ip !== '127.0.0.1') {
                    const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
                    const geoData = await geoRes.json();
                    if (geoData.status === 'success') {
                        detectedCountry = geoData.countryCode;
                    }
                }
            }
            catch (e) {
                console.warn(`IP Geolocation failed: ${e.message}`);
            }
        }
        if (user) {
            delete user.password;
        }
        return {
            ...user,
            points,
            streak,
            badges,
            activeSub,
            detectedCountry
        };
    }
    async updateMe(req, body, file) {
        let avatarUrl;
        if (file) {
            avatarUrl = await this.uploadService.uploadFile(file);
        }
        const user = await this.usersService.updateProfile(req.user.userId, {
            ...body,
            ...(avatarUrl ? { avatarUrl } : {})
        });
        delete user.password;
        return user;
    }
    async getProgress(req) {
        return this.usersService.getLearningProgress(req.user.userId);
    }
    async sendSupport(req, message) {
        const user = await this.usersService.findById(req.user.userId);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        this.notificationsService.sendSupportEmail(user.email, message).catch(err => console.warn(`Failed to queue support email: ${err.message}`));
        return { message: 'Support request submitted successfully. We will get back to you shortly.' };
    }
    async submitKyc(req, body) {
        return this.usersService.submitKyc(req.user.userId, body);
    }
    async getBanks(country) {
        return this.usersService.getBanks(country || 'nigeria');
    }
    async resolveAccount(accountNumber, bankCode) {
        return this.usersService.resolveAccount(accountNumber, bankCode);
    }
    async getUser(id) {
        const user = await this.usersService.findById(id);
        if (user) {
            delete user.password;
        }
        return user;
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('me'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me/progress'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProgress", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me/support'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "sendSupport", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me/kyc'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "submitKyc", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me/kyc/banks'),
    __param(0, (0, common_1.Query)('country')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getBanks", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me/kyc/resolve'),
    __param(0, (0, common_1.Query)('accountNumber')),
    __param(1, (0, common_1.Query)('bankCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "resolveAccount", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUser", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        gamification_service_1.GamificationService,
        notifications_service_1.NotificationsService,
        upload_service_1.UploadService])
], UsersController);
//# sourceMappingURL=users.controller.js.map