const express = require("express");
const { sequelize } = require("./src/models");
const router = require("./src/routes/index");
const cors = require("cors");

const app = express();
require("dotenv").config();

app.use(express.json());
app.use(cors());

app.use("/api",router);

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
.then(()=>console.log("✅ PostgreSQL connected"))
.catch(err => console.error('❌ Connection error:', err));

app.listen(PORT,()=>{
    console.log("server is running ",PORT);
})