require("dotenv").config();

const express = require("express");
const cors = require("cors");

const exceptionRoutes = require("./routes/exceptionRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Supervity Exception Resolution API",
    status: "running"
  });
});

app.use("/api/exceptions", exceptionRoutes);
app.use("/api/invoices", invoiceRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});