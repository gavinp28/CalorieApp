# Payments setup: Stripe, Netlify, Resend

How the unlock works, with no database:

1. **Buy.** The Unlock button opens your Stripe Payment Link. Stripe collects the buyer's email.
2. **Return.** Stripe redirects to `/unlock?session_id=cs_...`. The `unlock` function asks Stripe
   whether that Checkout Session is complete, paid, $3.99 USD, not refunded, and (optionally) from
   your Payment Link. If so it returns an unlock token signed with `UNLOCK_SECRET`, which the browser keeps.
3. **Play.** Locked puzzles come from the `puzzle` function, which only answers when the token's
   signature checks out. Locked puzzle data is never in the public site files.
4. **Restore.** On a new device the buyer either:
   - opens their **personal restore link** (shown after paying), or
   - enters their **email** on `/restore`. The function finds their paid purchase in Stripe and
     emails a sign-in link that works for 30 minutes. The page answers the same whether or not the
     email has bought, so it can't be used to check who has paid.

Stripe is the purchase history: every purchase, with its email, is in your Stripe dashboard.

---

## 1. Stripe

### Payment Link settings

In the Stripe Dashboard, go to **Payment Links**, open your link, and click **Edit**:

- **After payment** tab: choose **Don't show confirmation page** → **Redirect customers to your website**, and enter exactly:

  ```
  https://calorieguesser.com/unlock?session_id={CHECKOUT_SESSION_ID}
  ```

  Type `{CHECKOUT_SESSION_ID}` literally, braces included; Stripe fills it in for each payment.
- **Options**: leave **Allow promotion codes** and **Let customers adjust quantity** off. The server
  only accepts payments of exactly $3.99, so a discounted or multi-quantity payment would not unlock.
- Click **Update link**.

Note the link's ID: it is shown on the link's page and starts with `plink_`. You'll use it as `STRIPE_PAYMENT_LINK_ID`.

### API key (use a restricted key)

Go to **Developers → API keys → Create restricted key**, name it "Calorie Guesser unlock", and give it **Read** on:

- Checkout Sessions
- Payment Intents
- Charges

Everything else stays **None**. Copy the key (`rk_live_...`). It can't move money or change anything.

### Test mode first

1. Turn on **Test mode** (top right of the Dashboard).
2. Create a $3.99 product and a Payment Link for it, with the same redirect as above. For a Netlify
   preview deploy, use that deploy's address instead of calorieguesser.com.
3. Create a test restricted key the same way (`rk_test_...`).
4. Pay with card `4242 4242 4242 4242`, any future expiry, any CVC, and an email you can read.
5. To test a refund, refund that payment in the Dashboard; the purchase should stop restoring.

## 2. Netlify environment variables

In Netlify, open your site and go to **Site configuration → Environment variables → Add a variable → Add a single variable**.
For each row: enter the key, tick **Contains secret values** where marked, choose the scopes, and use
**Different value for each deploy context** so Production gets live values and Deploy Previews / Branch deploys get test values.

| Key | Secret | Scopes | Production value | Preview / branch value |
| --- | --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | ✔ | Functions | `rk_live_...` | `rk_test_...` |
| `UNLOCK_SECRET` | ✔ | Functions | 32+ random characters (see below) | a *different* random value |
| `STRIPE_PAYMENT_LINK_ID` | | Functions | live `plink_...` | test `plink_...` |
| `RESEND_API_KEY` | ✔ | Functions | `re_...` | same |
| `EMAIL_FROM` | | Functions | `Calorie Guesser <hello@calorieguesser.com>` | same |
| `SITE_URL` | | Functions | `https://calorieguesser.com` | your preview URL, or leave unset |
| `SITE_NAME` | | Functions | `Calorie Guesser` | same |
| `VITE_PAYMENT_LINK` | | Builds | `https://buy.stripe.com/fZu6oH1nZfRCfYJ4QldIA01` | your test Payment Link URL |

Generate `UNLOCK_SECRET` on your computer with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Keep it secret and don't change it casually: changing it signs everyone out of their unlock, and they would need to restore.

After adding or changing variables, go to **Deploys → Trigger deploy → Deploy site** so they take effect.

No secret is ever in the browser: only `VITE_PAYMENT_LINK` is public, and it's just the checkout URL.

## 3. Resend (restore emails)

1. Sign up at https://resend.com (the free plan covers 3,000 emails a month).
2. **Domains → Add domain**: enter `calorieguesser.com`.
3. Resend shows several DNS records (an MX record and TXT records for SPF and DKIM). Add each one at
   the company where you bought the domain, under its DNS settings, exactly as shown. If your domain's
   DNS is managed by Netlify, add them under **Netlify → Domains → calorieguesser.com → DNS records** instead.
4. Back in Resend, click **Verify**. It can take from a few minutes to a few hours.
5. **API Keys → Create API key** with **Sending access** for that domain. Paste it into Netlify as `RESEND_API_KEY`.

## 4. Check it works

On a preview deploy with test values:

1. Open the Archive, tap a locked day, then tap **Unlock**. Pay with the 4242 test card.
2. You land on "Everything's unlocked" with your email and a personal restore link. Older days and bonus puzzles now open.
3. Open the site in a private window and go to `/restore`:
   - paste the restore link → unlocked;
   - or enter your email → a restore email arrives → tap it → unlocked.
4. Try `/unlock?session_id=cs_test_nonsense`: you should see "We couldn't find that purchase".

If the unlock page says "Something went wrong", open **Netlify → Logs → Functions** for the reason.
`misconfigured` means an environment variable is missing.
