# Cashfree Subscription Demo App

A sample web app that shows how to integrate Cashfree's Subscriptions API
(`2025-01-01`) and JS SDK with Node.js (Express) and plain HTML/JavaScript.
The customer picks a Daily, Monthly or Yearly plan, the server creates a
subscription, and the Cashfree SDK opens subscription checkout. After checkout,
Cashfree redirects back to the app's return URL, which shows the subscription
status fetched from Cashfree.

## Features

- Three plans mapped to existing Cashfree plan IDs: Basic (daily), Standard (monthly), Premium (yearly)
- First charge scheduled at T+3, 10:00 AM UTC (3:30 PM IST)
- Return URL that accepts Cashfree's form POST and browser GET, and verifies status with the API
- Optional HTTPS return URL through ngrok for production testing
- Sandbox or production selected with one environment variable

## Plan configuration

Create these plans in your Cashfree dashboard (or with the Create Plan API) before you subscribe.

| Plan     | Plan ID               | Frequency | Payment modes    | Notes |
|----------|-----------------------|-----------|------------------|-------|
| Basic    | Basic_Day_Plan        | Daily     | UPI, card, eNACH | ₹100 is under the ₹15k limit, so no AFA is needed |
| Standard | Standard_Monthly_Plan | Monthly   | UPI, card, eNACH | ₹2,500 is under the ₹15k limit, so no AFA is needed |
| Premium  | Premium_Yearly_Plan   | Yearly    | UPI, card, eNACH | ₹25,000 is over ₹15k, so UPI/card debits need AFA; eNACH (up to ₹1 Cr) doesn't |

Rules for all plans:

- **Frequencies:** all payment methods support Day, Week, Month, Year and ad-hoc, per [Cashfree payment modes](https://www.cashfree.com/docs/payments/subscription/payment-modes).
- **Per-debit limits:** UPI and card allow ₹15,000 per debit without AFA. UPI allows up to ₹1 lakh with AFA, which Cashfree must enable. eNACH allows up to ₹1 crore.
- **Authorization:** eNACH authorization is always ₹0, and activation takes 24–48 hours.
- **First charge date:** for UPI and Indian cards, the earliest is T+1, or T+2 if the subscription is created after 9:00 PM. It can be at most 14 days ahead.
- **Pre-debit notice:** sent at least 24 hours before each debit. After that, the amount is locked.
- **Changing the amount:** create a new plan, then call `POST /subscriptions/{id}/manage` with `CHANGE_PLAN`. The new amount can't exceed the original `plan_max_amount`.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your sandbox credentials:

   ```env
   CASHFREE_APP_ID=your_cashfree_app_id
   CASHFREE_SECRET=your_cashfree_secret
   CASHFREE_ENV=sandbox
   PORT=4000
   APP_BASE_URL=http://localhost:4000
   ```

   `.env` is gitignored. Never commit real credentials.

3. Set the customer details in `server.js` (`customer_details`). The sample uses placeholders.

4. Start the server and open http://localhost:4000:

   ```bash
   npm start
   ```

5. Run the tests. They use mocked Cashfree responses and create no subscriptions:

   ```bash
   npm test
   ```

## Project structure

```text
.
├── server.js          # Express server: /api/config, /api/subscribe, /return
├── return-server.js   # Listener that exposes only /return (for an HTTPS tunnel)
├── public/
│   └── index.html     # Plans page and Cashfree JS SDK checkout
├── test/
│   └── return.test.js # Integration tests with mocked Cashfree responses
├── .env.example       # Environment variable template
└── package.json
```

## API integration

- **Base URL:** `https://sandbox.cashfree.com/pg` (sandbox) or `https://api.cashfree.com/pg` (production)
- **API version:** `2025-01-01`
- **Auth:** `x-client-id` and `x-client-secret` headers
- **SDK:** Cashfree JS SDK v3, `cashfree.subscriptionsCheckout()`

The `/api/subscribe` response includes an equivalent curl command (with credentials masked) for debugging:

```bash
curl --request POST \
  --url https://sandbox.cashfree.com/pg/subscriptions \
  --header 'Content-Type: application/json' \
  --header 'x-api-version: 2025-01-01' \
  --header 'x-client-id: <CASHFREE_APP_ID>' \
  --header 'x-client-secret: <CASHFREE_SECRET>' \
  --data '<payload>'
```

## Return URL

The return endpoint at `/return` accepts browser GET requests and Cashfree form
POSTs. Subscription creation adds the subscription ID to the return URL as a
fallback. On return, the server fetches the subscription status from Cashfree
instead of trusting the redirect payload. Opening `/return` without an ID shows
a readiness message.

Set `PORT` and `APP_BASE_URL` in `.env` to change the port or the browser-facing
base URL. A localhost return URL works when checkout runs in a browser on the same machine.

The return page shows every received POST body field and URL query parameter,
escaped for safe display, even when the status lookup fails.

Every return POST is appended to `logs/return-events.jsonl` (gitignored) before
status verification, with the receipt time, content type, query parameters,
parsed body fields and raw body. To follow it:

```bash
tail -f logs/return-events.jsonl
```

The return URL is a browser checkout redirect. It does not replace Cashfree
webhooks for later subscription events.

## HTTPS return URL for production testing

Production requires an HTTPS return URL. Start the app with `npm start`, then in
separate terminals run:

```bash
npm run start:returns   # return-only listener on port 4001
npm run tunnel          # ngrok http 4001
```

Set `APP_BASE_URL` in `.env` to the HTTPS address ngrok prints (without
`/return`) and restart both Node servers. Only `/return` is exposed through the
tunnel. Create a new subscription so its return URL uses the new address, and
keep the listener and ngrok running during checkout. ngrok's inspector at
http://127.0.0.1:4040 shows the tunnelled requests. For ongoing use, host the
return URL on a stable HTTPS endpoint.

To switch both the API and the SDK to production, set in `.env`:

```env
CASHFREE_ENV=production
CASHFREE_APP_ID=<live app ID>
CASHFREE_SECRET=<live secret>
APP_BASE_URL=https://<your-https-address>
```

Restart both Node servers. The plan IDs must also exist in your live Cashfree
account. Production checkout uses real money: the sample sets a ₹1 authorization
and schedules recurring charges for the selected plan.

## Support

For Cashfree API support, contact [care@cashfree.com](mailto:care@cashfree.com).
