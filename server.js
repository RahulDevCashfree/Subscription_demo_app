require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false })); // for handling POST to /return

// Environment variables
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '11123595750e973ecc95c94ec5532111';
const CASHFREE_SECRET = process.env.CASHFREE_SECRET || 'TEST307e06bddd583cc3f86edf02f410fa8a69653d7d';

// Plan mapping
const PLANS = {
  basic: "Basic_Day_Plan",
  standard: "Standard_Monthly_Plan",
  premium: "Premium_Yearly_Plan"
};

// Subscription creation endpoint
app.post("/api/subscribe", async (req, res) => {
  const { plan } = req.body;

  if (!plan || !PLANS[plan]) {
    return res.status(400).json({
      message: "Invalid plan selected",
      validPlans: Object.keys(PLANS)
    });
  }

  try {
    const subscriptionId = `Sub_${Date.now()}`;

    const chargeDate = new Date();
    chargeDate.setUTCDate(chargeDate.getUTCDate() + 3);
    chargeDate.setUTCHours(10, 0, 0, 0);
    const isoFormatted = chargeDate.toISOString().split('.')[0] + "Z";

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
        return_url: "http://localhost:4000/return",
        notification_channel: ["EMAIL", "SMS"]
      },
      subscription_first_charge_time: isoFormatted,
      subscription_note: "Test subscription created via API"
    };

    const curlCommand = `curl --request POST \\
  --url https://sandbox.cashfree.com/pg/subscriptions \\
  --header 'Content-Type: application/json' \\
  --header 'x-api-version: 2025-01-01' \\
  --header 'x-client-id: ${CASHFREE_APP_ID}' \\
  --header 'x-client-secret: ${CASHFREE_SECRET}' \\
  --data '${JSON.stringify(requestBody)}'`;

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

    res.json({
      message: "Subscription created successfully!",
      data: response.data,
      curl: curlCommand
    });

  } catch (error) {
    console.error("Cashfree API Error:", error.response?.data || error.message);

    res.status(500).json({
      message: "Subscription creation failed",
      error: error.response?.data || error.message
    });
  }
});

// ✅ Enhanced Return URL handler with debug information
app.post("/return", (req, res) => {
  try {
    const receivedSignature = req.body.signature;
    const verificationData = {...req.body};
    delete verificationData.signature;
    
    // Sort keys and create data string
    const sortedKeys = Object.keys(verificationData).sort();
    let dataString = '';
    sortedKeys.forEach(key => {
      dataString += key + String(verificationData[key]);
    });
    
    // Compute signature
    const computedSignature = crypto
      .createHmac("sha256", CASHFREE_SECRET)
      .update(dataString, 'utf8')
      .digest("base64");
    
    const isValid = receivedSignature === computedSignature;
    
    // Concise HTML response
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Signature Verification</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: Arial, sans-serif; 
            background: #f5f7fa;
            padding: 20px;
            color: #333;
          }
          .container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: ${isValid ? '#28a745' : '#dc3545'};
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 25px;
          }
          .card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          h1 { font-size: 24px; margin-bottom: 5px; }
          h2 { font-size: 18px; margin: 15px 0 10px; color: #495057; }
          .signature-status {
            font-size: 20px;
            font-weight: bold;
            margin: 10px 0;
            text-align: center;
          }
          .signature-valid { color: #28a745; }
          .signature-invalid { color: #dc3545; }
          pre {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 14px;
            margin: 10px 0;
            max-height: 200px;
            overflow-y: auto;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
          }
          @media (max-width: 600px) {
            .grid { grid-template-columns: 1fr; }
            .container { margin: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cashfree Subscription Response</h1>
            <div class="signature-status ${isValid ? 'signature-valid' : 'signature-invalid'}">
              Signature: ${isValid ? 'VALID ✅' : 'INVALID ❌'}
            </div>
          </div>
          
          <div class="content">
            <div class="grid">
              <div class="card">
                <h2>Received Signature</h2>
                <pre>${receivedSignature}</pre>
              </div>
              
              <div class="card">
                <h2>Computed Signature</h2>
                <pre>${computedSignature}</pre>
              </div>
            </div>
            
            <div class="card">
              <h2>Data String for HMAC</h2>
              <pre>${dataString}</pre>
            </div>
            
            <div class="card">
              <h2>Full Response Data</h2>
              <pre>${JSON.stringify(req.body, null, 2)}</pre>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    res.send(`
      <div style="
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        background: #f8d7da;
        color: #721c24;
        border-radius: 10px;
        text-align: center;
      ">
        <h2>Signature Verification Failed</h2>
        <p>${error.message}</p>
      </div>
    `);
  }
});
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

