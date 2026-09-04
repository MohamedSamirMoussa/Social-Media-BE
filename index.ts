import { config } from "dotenv";
import express from 'express'
import { resolve } from 'path'
import bootstrap from "./src/bootstrap";


config({ path: resolve('./config/.env.development') })
const app = express()

bootstrap(app)