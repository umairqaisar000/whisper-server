import bodyParser from "body-parser"
import dotenv from "dotenv"
import express, { Application } from "express"
import Router from "./api/routes"
import SocketServer from "./socket"

const cors = require('cors')

dotenv.config()

console.log(process.env.PORT)

// // Secret key for signing JWTs (stored in .env)
// const secret = process.env.JWT_SECRET || 'no-salt';
// let userIdCount = 0;

const PORT: number =
    (process.env.PORT ?? "").length > 0 ? Number(process.env.PORT) : 8080

const app: Application = express()

// Then, use this middleware in your app before your routes
if (process.env.NODE_ENV === "development") {
    // app.use(logResponseBody)
}

// Now, all responses sent via res.send or res.json will be logged.
const corsOptions = {
    methods: ['GET', 'POST'], // Allow GET and POST methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers
};

app.use(bodyParser.json())
// app.use(colourizedMorgan(true))
app.use(express.static("public"))
app.use(cors(corsOptions))

app.use(Router)

const server = app.listen(PORT, () => {
    console.log("Server is running on port", PORT)
})

SocketServer.initialize(server)
