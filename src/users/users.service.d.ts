import { PrismaService } from '../common/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    invite(companyId: string, invitedBy: string, data: {
        name: string;
        email: string;
        role: string;
    }): Promise<{
        user: any;
        tempPassword: string;
        message: string;
    }>;
    findAll(companyId: string): Promise<any>;
    changeRole(userId: string, newRole: string, changedBy: string): Promise<{
        message: string;
    }>;
    deactivate(userId: string, deactivatedBy: string): Promise<{
        message: string;
    }>;
    private generateTempPassword;
}
//# sourceMappingURL=users.service.d.ts.map