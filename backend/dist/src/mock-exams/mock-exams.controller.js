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
exports.MockExamsController = void 0;
const common_1 = require("@nestjs/common");
const mock_exams_service_1 = require("./mock-exams.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let MockExamsController = class MockExamsController {
    mockService;
    constructor(mockService) {
        this.mockService = mockService;
    }
    getAvailableMocks(req) {
        return this.mockService.getAvailableMocks(req.user.userId, req.user.role);
    }
    getMockDetails(id) {
        return this.mockService.getMockDetails(id);
    }
    startMock(req, id) {
        return this.mockService.startMock(req.user.userId, id);
    }
    submitMock(req, id, body) {
        return this.mockService.submitMock(req.user.userId, id, body.answers, body.tabSwitches);
    }
};
exports.MockExamsController = MockExamsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MockExamsController.prototype, "getAvailableMocks", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MockExamsController.prototype, "getMockDetails", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MockExamsController.prototype, "startMock", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MockExamsController.prototype, "submitMock", null);
exports.MockExamsController = MockExamsController = __decorate([
    (0, common_1.Controller)('mocks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [mock_exams_service_1.MockExamsService])
], MockExamsController);
//# sourceMappingURL=mock-exams.controller.js.map