# ═══════════════════════════════════════════════════════════
# BIZLEDGER ERP — DEPLOYMENT GUIDE
# Plain English: Step-by-step instructions to get your ERP
# live on the internet. No prior technical knowledge needed.
# ═══════════════════════════════════════════════════════════

## WHAT YOU WILL HAVE AT THE END
- Your ERP accessible at https://yourdomain.com
- Secure login for 30+ users with 4 roles
- All data saved permanently in a secure database
- Automatic daily backups
- HTTPS encryption on all traffic
- Cost: ₹0–₹67/month to start

---

## STEP 1 — Create your free accounts (30 minutes)

You need accounts on 3 free services. All are free to start.

### 1A. Railway (your server + database)
1. Go to https://railway.app
2. Click "Sign Up" → use your Google account
3. That's it — we'll use this in Step 3

### 1B. Vercel (your frontend hosting — free forever)
1. Go to https://vercel.com
2. Click "Sign Up" → use your Google account
3. That's it

### 1C. Cloudflare (domain + file storage — free)
1. Go to https://cloudflare.com
2. Create a free account
3. We'll use R2 storage for PDFs (first 10GB free forever)

---

## STEP 2 — Buy your domain name (15 minutes, ₹800/year)

1. Go to https://namecheap.com or https://godaddy.com
2. Search for "bizledger.in" or your preferred name
3. Add to cart and buy (₹600–₹900/year)
4. In your domain settings, point Nameservers to Cloudflare:
   - Cloudflare will give you two nameserver addresses
   - Paste them into your domain registrar's nameserver fields

---

## STEP 3 — Deploy the database (20 minutes, free)

1. Log in to Railway
2. Click "New Project" → "Deploy from GitHub"
   (Or "Add Service" → "Database" → "PostgreSQL")
3. Railway creates a PostgreSQL database automatically
4. Click on the database → "Connect" tab
5. Copy the "DATABASE_URL" — it looks like:
   postgresql://postgres:xxxxx@monorail.proxy.rlwy.net:12345/railway
6. Save this — you'll need it in Step 4

---

## STEP 4 — Deploy the backend (30 minutes, free)

1. In Railway, click "New Service" → "GitHub Repo"
2. Connect your GitHub account and upload the bizledger-backend folder
   (Or use Railway CLI — instructions at railway.app/docs)
3. In Railway → your backend service → "Variables" tab, add:

   DATABASE_URL = (paste from Step 3)
   JWT_ACCESS_SECRET = (generate: go to https://generate-secret.vercel.app/64)
   JWT_REFRESH_SECRET = (generate another one, different from above)
   ENCRYPTION_KEY = (generate exactly 32 characters)
   FRONTEND_URL = https://yourdomain.com
   NODE_ENV = production

4. Railway automatically deploys and gives you a URL like:
   https://bizledger-backend-production.up.railway.app
5. Save this URL — it's your API address

---

## STEP 5 — Run the database setup (5 minutes)

This creates all the filing cabinet drawers (tables) in your database.

In Railway → your backend service → "Shell" tab, type:
   npx prisma migrate deploy
   node dist/prisma/seed.js

This creates:
- All database tables
- Your admin account (you'll set the password)
- Default company settings

---

## STEP 6 — Deploy the frontend (15 minutes, free forever)

1. Log in to Vercel
2. Click "New Project" → Import your bizledger frontend files
3. In "Environment Variables", add:
   NEXT_PUBLIC_API_URL = https://bizledger-backend-production.up.railway.app/api
4. Click "Deploy"
5. Vercel gives you a URL like: https://bizledger.vercel.app

---

## STEP 7 — Connect your domain (20 minutes)

### Point domain to Vercel (frontend):
1. In Vercel → your project → "Domains"
2. Add "yourdomain.com"
3. Vercel gives you DNS records — add them in Cloudflare

### Point subdomain to Railway (backend):
1. In Cloudflare → DNS → Add Record:
   Type: CNAME
   Name: api
   Target: your-railway-url.up.railway.app
2. Now your API is at: https://api.yourdomain.com

---

## STEP 8 — Set up automatic backups (10 minutes, free)

Railway automatically backs up your PostgreSQL database daily.
To configure:
1. Railway → your database → "Backups" tab
2. Enable "Automatic Backups"
3. Set retention to 30 days

---

## STEP 9 — Create your admin account (5 minutes)

Visit: https://api.yourdomain.com/api/setup
(This only works once — the first time, before any users exist)

Enter:
- Company name: BizLedger Pvt. Ltd.
- GSTIN: your GSTIN
- Your name, email, and a strong password

Your ERP is now live. Log in at https://yourdomain.com

---

## STEP 10 — Add your team members

1. Log in as Admin
2. Go to Settings → Users → Invite User
3. Enter their name, email, and role
4. The system creates a temporary password
5. Share the temporary password with them securely (WhatsApp, in-person)
6. They log in and are forced to change their password immediately

---

## TOTAL MONTHLY COST

| Service      | Cost         |
|-------------|-------------|
| Railway      | ₹0 (free tier) |
| Vercel       | ₹0 (free forever) |
| Cloudflare   | ₹0 (free) |
| Domain       | ₹67/month (₹800/year) |
| **TOTAL**    | **₹67/month** |

When you outgrow free tiers (100+ users, 10,000+ invoices):
| Railway Pro  | ₹400/month |
| R2 Storage   | ₹150/month |
| **TOTAL**    | **₹617/month** |

---

## SECURITY CHECKLIST (do these before going live)

- [ ] Change all passwords in .env from the examples
- [ ] Generate strong random JWT secrets (64 characters)
- [ ] Set FRONTEND_URL to your exact domain (not *)
- [ ] Enable Railway's automatic backups
- [ ] Test that login lockout works (try 5 wrong passwords)
- [ ] Test that roles work (log in as Accountant, try to open Payroll)
- [ ] Verify HTTPS is working (padlock in browser)

---

## IF SOMETHING GOES WRONG

**Can't log in:** Check that DATABASE_URL and JWT secrets are set correctly in Railway environment variables.

**Database errors:** Run: npx prisma migrate deploy

**Frontend can't reach backend:** Check NEXT_PUBLIC_API_URL matches your Railway URL exactly.

**Need help:** The entire codebase is documented in plain English — every file has comments explaining what it does.
