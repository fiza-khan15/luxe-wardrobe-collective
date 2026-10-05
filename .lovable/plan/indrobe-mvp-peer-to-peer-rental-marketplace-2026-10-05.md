# indrobe MVP: Peer-to-Peer Rental Marketplace

This version builds only what's in Sections B, C and D of your doc, plus the Section I defaults. Nothing from Section H or from the deferred items in Section E gets built: no reviews, messaging, wishlist, keyword search, referrals or cart.

## What users will see

**Home (current landing page, kept as is)**
- The main "I want to Rent" button goes straight to /browse. No account is needed to browse.
- The "I want to Earn" button goes to "List an item".
- The waitlist form stays.

**Renter path**
1. **/browse**: listing grid with filters (category, size, city, price). Each card shows a "Same city" or "Ships from another city" badge. No login.
2. **/items/:id**: 3 or more photos, size, measurements, price per day, deposit, condition and cleaning method, plus a calendar that blocks taken dates.
3. **Request**: pick dates (1 to 10 days). New users do a light signup with name and phone (OTP).
4. **Verify + pay** (one screen, only once per person):
   - full address, city, and an 18+ confirmation (under-18 is hard-blocked)
   - rental agreement checkbox, kept separate from the ID-check consent
   - Razorpay payment covering the rental fee and the deposit together
   - the person's account waits for your manual approval in admin
5. **My rentals**: status timeline. "Mark received" requires a photo. "Mark returned" requires a photo and a cleaning checkbox ("I have cleaned this as instructed").

**Giver path**
1. **List an item**: at least 3 photos, item value capped at ₹5,000, and a suggested price of 8–10% of value per day (you can edit it). Deposit equals the full item value. An ownership checkbox is required. No ID check is needed to publish.
2. **Incoming requests**: accept or decline. The ID check is triggered on the first "accept".
3. **Mark dispatched**: requires a photo. The giver books their own courier.
4. **Confirm return**: release the deposit, or press "Report issue".

**Admin (/admin, you only)**
- Approve or reject identity checks. A rejected user sees the reason and can retry.
- Suspend users.
- View disputes and all requests.
- Issue refunds.

## Rules the system enforces (Section D)
- **Date blocking uses the full cycle:** dispatch + transit out + rental days + transit back + 1 extra cleaning day if the item is dry-clean only.
- **Auto-expiry:**
  - a pending request expires after 48h if the giver doesn't respond
  - an accepted request expires after 24h if the renter doesn't verify and pay
- **Cancellation:** full refund before dispatch; only the deposit is refunded after dispatch.
- **Payment hold:** money is held at payment and released to the giver after the renter confirms good-condition receipt.
- **Notifications:** on-site and email at every status change. SMS can be added later with a provider.
- **Estimates:** delivery and "available again" dates are always labeled as estimated.

## What I'll need from you
- **Razorpay Key ID and Key Secret.** I'll ask for these securely during the build. Test-mode keys are fine to start.
- **Your admin email.** This account gets the admin role.

## Technical details
- **Tables:**
  - profiles (name, phone, city, address, verification status, is_18_plus)
  - user_roles (admin)
  - listings
  - listing_photos (in a storage bucket)
  - rental_requests (status enum: pending, accepted, paid, dispatched, received, returned, completed, cancelled, expired, disputed)
  - condition_photos
  - payments
  - disputes
  - notifications
- **Security:** row-level security throughout. Listings are publicly readable; requests are visible only to the renter, the giver and admins.
- **Date blocking:** a database function computes blocked windows and rejects overlapping requests.
- **Payments:** a server function creates the Razorpay order. A Razorpay webhook (with signature verified) marks the payment as paid. Refunds go through the Razorpay API.
- **Expiry:** a scheduled job hits an expiry endpoint every 15 minutes.
- **Sign-in:** phone OTP needs an SMS provider. Until one is connected, I'll use email + password sign-in and collect the phone number as a profile field. This is flagged as a follow-up.
