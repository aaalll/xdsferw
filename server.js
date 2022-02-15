const express = require("express");
require("dotenv").config();
const connectDB = require("./src/db/database");
const userRouter = require("./src/routers/user");
const fileRouter = require("./src/routers/file");

const app = express();
connectDB();
app.use(express.json());
app.use(userRouter);
app.use(fileRouter);

const port = process.env.SRVPORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
