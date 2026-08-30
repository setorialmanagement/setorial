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
exports.WebController = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
let WebController = class WebController {
    root(req, res) {
        const url = req.url || '';
        if (url.startsWith('/api') || url.startsWith('/admin') || url.startsWith('/auth') || url.startsWith('/_next')) {
            return res.status(404).send();
        }
        if (url.startsWith('/public/')) {
            const safePath = url.replace(/^\/public\//, '');
            const filePath = (0, path_1.join)(__dirname, '..', '..', 'web', 'public', safePath);
            return res.sendFile(filePath, (err) => {
                if (err)
                    return res.status(404).send();
            });
        }
        const indexPath = (0, path_1.join)(__dirname, '..', '..', 'web', 'index.html');
        return res.sendFile(indexPath);
    }
};
exports.WebController = WebController;
__decorate([
    (0, common_1.Get)('*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WebController.prototype, "root", null);
exports.WebController = WebController = __decorate([
    (0, common_1.Controller)()
], WebController);
//# sourceMappingURL=web.controller.js.map