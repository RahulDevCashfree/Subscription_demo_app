# Subscription_demo_app
This is a demo app created to show how to implement the subscription API and JS SDK to a web project.

Absolutely! Below is a copy-paste-ready `README.md` in plain text format — just paste this directly into your GitHub repo:

---

````markdown
# 💳 Cashfree Subscription Demo App

A sample web application demonstrating how to integrate Cashfree's Subscription APIs using Node.js (Express) and HTML/JavaScript. This app allows users to choose between different plans (Daily, Monthly, Yearly) and initiates a subscription checkout using the Cashfree SDK.

## 🚀 Features

- Dynamic plan selection: Basic, Standard, Premium
- First charge scheduled at T+2 at 10:00 AM UTC
- Uses Cashfree's `2025-01-01` Subscriptions API version
- Displays curl command for debugging
- Frontend built with HTML/CSS + vanilla JavaScript

## 📦 Plan Configuration

| Plan Name        | Plan ID                | Frequency | Notes                                                                 |
|------------------|------------------------|-----------|-----------------------------------------------------------------------|
| Basic            | Basic_Day_Plan         | Daily     | eNACH not supported, first charge date must be T+2 to T+30           |
| Standard         | Standard_Monthly_Plan  | Monthly   | All auth modes supported, T+2 to T+365 supported                      |
| Premium          | Premium_Yearly_Plan    | Yearly    | UPI not supported, large limits supported via eNACH                  |

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/Subscription_demo_app.git
cd Subscription_demo_app
````

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root of the project with the following content:

```env
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET=your_cashfree_secret
```

### 4. Start the server

```bash
node server.js
```

Then, open your browser and navigate to: [http://localhost:4000](http://localhost:4000)

## 📁 Project Structure

```
.
├── index.js             # Express backend server
├── .env                 # API credentials (not committed to Git)
├── public/
│   ├── index.html       # Frontend interface
│   ├── script.js        # JS logic (fetch, Cashfree SDK trigger)
│   └── style.css        # Optional CSS styling
├── package.json
└── README.md
```

## 🔐 API Integration Info

* **Base URL**: `https://sandbox.cashfree.com/pg/subscriptions`
* **API Version**: `2025-01-01`
* **Auth**: Uses `x-client-id` and `x-client-secret` in headers
* **SDK**: Cashfree JS SDK (`cashfree.subscriptionsCheckout()`)

## 🧾 Sample curl (generated in response)

```bash
curl --request POST \
  --url https://sandbox.cashfree.com/pg/subscriptions \
  --header 'Content-Type: application/json' \
  --header 'x-api-version: 2025-01-01' \
  --header 'x-client-id: <APP_ID>' \
  --header 'x-client-secret: <CLIENT_SECRET>' \
  --data '<payload>'
```

## 📬 Support

For Cashfree API support, contact: [care@cashfree.com](mailto:care@cashfree.com)

```


