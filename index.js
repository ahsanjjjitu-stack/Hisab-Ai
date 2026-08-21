require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");


const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);




const app = express();



// middlewares
app.use(express.json());
app.use(cors());



app.use("/api/auth", authRoutes);
   


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("Error connecting to MongoDB:", error));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
