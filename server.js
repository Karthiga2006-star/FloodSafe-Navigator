const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/reports", require("./routes/reports"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/routes", require("./routes/routing"));
app.use("/api/predict", require("./routes/predict"));
app.use("/api/rescue", require("./routes/rescue"));

app.get("/", (req, res) => res.json({ message: "FloodNav API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
