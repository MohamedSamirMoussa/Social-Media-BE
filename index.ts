import './src/env'
import express from "express";
import bootstrap from "./src/bootstrap";

const app = express();
const server = bootstrap(app);

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default server;
