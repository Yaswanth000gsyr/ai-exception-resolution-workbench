const exceptions = [
  {
    id: "EXC-1001",
    invoiceNumber: "INV-2026-001",
    vendor: "ABC Supplies",
    type: "Amount Mismatch",
    severity: "High",
    status: "Pending",
    expectedAmount: 1000,
    actualAmount: 1250,
    difference: 250,
    description: "Invoice amount is higher than the approved purchase order.",
    confidence: null,
    resolution: null
  },
  {
    id: "EXC-1002",
    invoiceNumber: "INV-2026-002",
    vendor: "Global Traders",
    type: "Duplicate Invoice",
    severity: "High",
    status: "Pending",
    expectedAmount: 850,
    actualAmount: 850,
    difference: 0,
    description: "A similar invoice from the same vendor already exists.",
    confidence: null,
    resolution: null
  },
  {
    id: "EXC-1003",
    invoiceNumber: "INV-2026-003",
    vendor: "Tech Components",
    type: "Missing Purchase Order",
    severity: "Medium",
    status: "Pending",
    expectedAmount: 600,
    actualAmount: 600,
    difference: 0,
    description: "Invoice was received without a matching purchase order.",
    confidence: null,
    resolution: null
  },
  {
    id: "EXC-1004",
    invoiceNumber: "INV-2026-004",
    vendor: "Office Mart",
    type: "Tax Mismatch",
    severity: "Medium",
    status: "Pending",
    expectedAmount: 1100,
    actualAmount: 1165,
    difference: 65,
    description: "Tax calculated on the invoice does not match the expected tax.",
    confidence: null,
    resolution: null
  },
  {
    id: "EXC-1005",
    invoiceNumber: "INV-2026-005",
    vendor: "Fast Logistics",
    type: "Quantity Mismatch",
    severity: "Low",
    status: "Pending",
    expectedAmount: 500,
    actualAmount: 550,
    difference: 50,
    description: "Invoice contains a higher quantity than the purchase order.",
    confidence: null,
    resolution: null
  }
];

module.exports = exceptions;