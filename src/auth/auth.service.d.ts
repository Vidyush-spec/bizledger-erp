import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(email: string, password: string, ipAddress: string): Promise<{
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            company: {
                id: any;
                name: any;
                gstin: any;
            };
            mustChangePassword: any;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string, ipAddress: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, ipAddress: string): Promise<{
        message: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    private generateTokens;
    private generateSecureToken;
    private hashToken;
}
//# sourceMappingURL=auth.service.d.ts.map