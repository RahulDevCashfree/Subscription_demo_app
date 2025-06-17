require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path"); // Add this

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '11123595750e973ecc95c94ec5532111';
const CASHFREE_SECRET = process.env.CASHFREE_SECRET || 'TEST307e06bddd583cc3f86edf02f410fa8a69653d7d';

// Plan mapping
const PLANS = {
  basic: "Basic_Day_Plan",
  standard: "Standard_Monthly_Plan",
  premium: "Premium_Yearly_Plan"
};

app.post("/api/subscribe", async (req, res) => {
  const { plan } = req.body;
  
  // Validate input
  if (!plan || !PLANS[plan]) {
    return res.status(400).json({
      message: "Invalid plan selected",
      validPlans: Object.keys(PLANS)
    });
  }

  try {
    // Generate subscription ID
    const subscriptionId = `Sub_${Date.now()}`;

    // Calculate charge date (2 days from now at 10:00 AM UTC)
    const chargeDate = new Date();
    chargeDate.setUTCDate(chargeDate.getUTCDate() + 2);
    chargeDate.setUTCHours(10, 0, 0, 0);
    const isoFormatted = chargeDate.toISOString().split('.')[0] + "Z";

    // Request payload
    const requestBody = {
      subscription_id: subscriptionId,
      customer_details: {
        customer_email: "r.rahul@cashfree.com",
        customer_phone: "9998887765",
        customer_name: "Rahul Raman"
      },
      plan_details: {
        plan_id: PLANS[plan]
      },
      authorization_details: {
        authorization_amount: 1,
        authorization_amount_refund: false
      },
      subscription_meta: {
        return_url: "https://www.google.com",
        notification_channel: ["EMAIL", "SMS"]
      },
      subscription_first_charge_time: isoFormatted,
      subscription_note: "Test subscription created via API"
    };

    // Generate curl command
    const curlCommand = `curl --request POST \\
  --url https://sandbox.cashfree.com/pg/subscriptions \\
  --header 'Content-Type: application/json' \\
  --header 'x-api-version: 2025-01-01' \\
  --header 'x-client-id: ${CASHFREE_APP_ID}' \\
  --header 'x-client-secret: ${CASHFREE_SECRET}' \\
  --data '${JSON.stringify(requestBody)}'`;

    // Call Cashfree API
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/subscriptions", 
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2025-01-01",
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET
        }
      }
    );

    // Return success response
    res.json({
      message: "Subscription created successfully!",
      data: response.data,
      curl: curlCommand
    });
  } catch (error) {
    console.error("Cashfree API Error:", error.response?.data || error.message);
    
    // Return detailed error
    res.status(500).json({
      message: "Subscription creation failed",
      error: error.response?.data || error.message,
      curl: curlCommand
    });
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});