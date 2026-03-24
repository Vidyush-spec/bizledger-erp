"use strict";
// ═══════════════════════════════════════════════════════════
// DATABASE SEED
// Plain English: This runs once when you first set up the ERP.
// It creates your company profile, your admin account, and
// the default chart of accounts so you're ready to use
// the ERP immediately.
// ═══════════════════════════════════════════════════════════
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Setting up BizLedger ERP for the first time...');
    // ── CREATE COMPANY ──────────────────────────────────
    const company = await prisma.company.upsert({
        where: { gstin: '19AABCB1234A1Z5' },
        update: {},
        create: {
            name: 'BizLedger Pvt. Ltd.',
            gstin: '19AABCB1234A1Z5',
            pan: 'AABCB1234A',
            address: '12, Park Street',
            city: 'Kolkata',
            state: 'West Bengal',
            pincode: '700016',
            phone: '+91 98765 43210',
            email: 'admin@bizledger.in',
            fyStart: 4, // April
        },
    });
    console.log('✓ Company created:', company.name);
    // ── CREATE ADMIN USER ───────────────────────────────
    // Plain English: The first admin account — yours.
    // Change this email and password immediately after first login!
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@bizledger.in' },
        update: {},
        create: {
            companyId: company.id,
            name: 'Vidyush K.',
            email: 'admin@bizledger.in',
            passwordHash: adminPassword,
            role: 'ADMIN',
            mustChangePassword: true, // Force password change on first login
        },
    });
    console.log('✓ Admin account created:', admin.email);
    console.log('  Temporary password: Admin@123');
    console.log('  ⚠️  Change this password immediately after first login!');
    // ── CREATE DEFAULT CHART OF ACCOUNTS ────────────────
    // Plain English: The standard set of money buckets every
    // Indian business needs. Based on standard accounting practice.
    const accounts = [
        // Assets
        { code: '1001', name: 'Cash in Hand', group: 'ASSETS', sub: 'Current Asset', side: 'DR', bal: 0 },
        { code: '1002', name: 'Bank Account – HDFC', group: 'ASSETS', sub: 'Current Asset', side: 'DR', bal: 0 },
        { code: '1003', name: 'Accounts Receivable', group: 'ASSETS', sub: 'Current Asset', side: 'DR', bal: 0 },
        { code: '1004', name: 'Inventory / Stock', group: 'ASSETS', sub: 'Current Asset', side: 'DR', bal: 0 },
        { code: '1005', name: 'Office Equipment', group: 'ASSETS', sub: 'Fixed Asset', side: 'DR', bal: 0 },
        { code: '1006', name: 'Accumulated Depreciation', group: 'ASSETS', sub: 'Fixed Asset', side: 'CR', bal: 0 },
        // Liabilities
        { code: '2001', name: 'Accounts Payable', group: 'LIABILITIES', sub: 'Current Liability', side: 'CR', bal: 0 },
        { code: '2002', name: 'GST Payable', group: 'LIABILITIES', sub: 'Tax Liability', side: 'CR', bal: 0 },
        { code: '2003', name: 'TDS Payable', group: 'LIABILITIES', sub: 'Tax Liability', side: 'CR', bal: 0 },
        { code: '2004', name: 'PF Payable', group: 'LIABILITIES', sub: 'Statutory', side: 'CR', bal: 0 },
        { code: '2005', name: 'ESI Payable', group: 'LIABILITIES', sub: 'Statutory', side: 'CR', bal: 0 },
        { code: '2006', name: 'Professional Tax Payable', group: 'LIABILITIES', sub: 'Statutory', side: 'CR', bal: 0 },
        // Equity
        { code: '3001', name: "Owner's Capital", group: 'EQUITY', sub: 'Capital', side: 'CR', bal: 0 },
        { code: '3002', name: 'Retained Earnings', group: 'EQUITY', sub: 'Reserve', side: 'CR', bal: 0 },
        { code: '3003', name: 'Current Year Profit', group: 'EQUITY', sub: 'Profit & Loss', side: 'CR', bal: 0 },
        // Income
        { code: '4001', name: 'Sales Revenue', group: 'INCOME', sub: 'Direct Income', side: 'CR', bal: 0 },
        { code: '4002', name: 'Service Income', group: 'INCOME', sub: 'Direct Income', side: 'CR', bal: 0 },
        { code: '4003', name: 'Other Income', group: 'INCOME', sub: 'Other Income', side: 'CR', bal: 0 },
        // Expenses
        { code: '5001', name: 'Purchase / COGS', group: 'EXPENSES', sub: 'Direct Expense', side: 'DR', bal: 0 },
        { code: '5002', name: 'Salaries & Wages', group: 'EXPENSES', sub: 'Indirect Expense', side: 'DR', bal: 0 },
        { code: '5003', name: 'Rent & Utilities', group: 'EXPENSES', sub: 'Indirect Expense', side: 'DR', bal: 0 },
        { code: '5004', name: 'Office Supplies', group: 'EXPENSES', sub: 'Indirect Expense', side: 'DR', bal: 0 },
        { code: '5005', name: 'Depreciation', group: 'EXPENSES', sub: 'Non-cash Expense', side: 'DR', bal: 0 },
        { code: '5006', name: 'Professional Tax (Co)', group: 'EXPENSES', sub: 'Statutory', side: 'DR', bal: 0 },
        { code: '5007', name: 'Bank Charges', group: 'EXPENSES', sub: 'Finance Cost', side: 'DR', bal: 0 },
    ];
    for (const acc of accounts) {
        await prisma.account.upsert({
            where: { companyId_code: { companyId: company.id, code: acc.code } },
            update: {},
            create: {
                companyId: company.id,
                code: acc.code,
                name: acc.name,
                group: acc.group,
                subtype: acc.sub,
                side: acc.side,
                balance: acc.bal,
                isSystem: true,
            },
        });
    }
    console.log(`✓ Chart of accounts created: ${accounts.length} accounts`);
    console.log('\n════════════════════════════════════════');
    console.log('BizLedger ERP setup complete!');
    console.log('════════════════════════════════════════');
    console.log(`Login URL:  https://yourdomain.com`);
    console.log(`Email:      admin@bizledger.in`);
    console.log(`Password:   Admin@123`);
    console.log('⚠️  CHANGE YOUR PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');
    console.log('════════════════════════════════════════\n');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map