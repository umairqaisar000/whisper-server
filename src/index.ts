// import bodyParser from 'body-parser';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import express, { Request, Response } from 'express';
// import jwt, { JwtPayload } from 'jsonwebtoken';
// import { Socket } from 'socket.io';
// import { generateRandomRoomName, generateRoomId } from './Helpers/roomHelpers';
// import { Room } from './Models/room';
// import { User } from './Models/user';

// dotenv.config();

// // TODO: refactor this
// const app = express();
// app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: true }))


// const corsOptions = {
//     origin: 'http://localhost:3000', // Replace with your frontend URL
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
// };


// app.use(cors());

// const users: User[] = [];
// const rooms: Record<string, Room> = {};
// const messages: Record<string, { user: User; message: string }[]> = {};

// // Secret key for signing JWTs (stored in .env)
// const secret = process.env.JWT_SECRET || 'no-salt';
// let userIdCount = 0;

// const addUserToRoom = (user: User, roomId: string): Room => {
//     if (!rooms[roomId]) {
//         rooms[roomId] = { id: roomId, roomName: generateRandomRoomName(), users: [] };
//     }
//     rooms[roomId].users.push(user);
//     return rooms[roomId];
// };

// // API endpoint to generate JWT based on username
// app.post('/api/auth/login', (req: Request, res: Response) => {
//     const { username, paramRoomId } = req.body;
//     console.log('Received paramRoomId:', req.body);

//     if (!username) {
//         return res.status(400).json({ message: 'Username is required' });
//     }
//     const user: User = { id: userIdCount++, userName: username }

//     const roomId = paramRoomId ?? generateRoomId();
//     users.push(roomId);

//     const room = addUserToRoom(user, roomId);

//     // JWT payload with username and session info
//     const payload = { user, sessionId: Date.now() };
//     console.log(payload);

//     // Generate JWT with 1-hour expiration
//     const token = jwt.sign(payload, secret, { expiresIn: '1h' });

//     return res.json({ token, room: "" });
// });



// // Start server on port 3000
// const server = app.listen(8080, () => {
//     console.log('Server is running on port 8080');
// });

// const io = require('socket.io')(server);

// // // JWT verification middleware for Socket.io
// io.use((socket: Socket, next: (err?: Error) => void) => {
//     const token = socket.handshake.query.token as string;

//     if (!token) {
//         return next(new Error('Authentication error'));
//     }

//     jwt.verify(token, secret, (err, decoded) => {
//         if (err || !decoded) {
//             return next(new Error('Authentication error'));
//         }
//         // Check if decoded is of type JwtPayload and has a user property
//         if (typeof decoded !== 'string' && 'user' in decoded) {
//             socket.data.user = (decoded as JwtPayload & { user: any }).user;
//         } else {
//             return next(new Error('Invalid token payload'));
//         }

//         next();
//     });
// });

// // // Real-time chat logic
// io.on('connection', (client: Socket) => {
//     const { user } = client.data;
//     const roomId = client.handshake.query.roomId as string;

//     console.log(roomId);
//     const room = addUserToRoom(user, roomId);
//     console.log(`User connected: ${user.userName} to room ${roomId}`);

//     client.join(roomId);

//     // Send existing messages to the new user
//     client.emit('chat-history', messages[roomId]);

//     client.on('chat-message', (messageData) => {
//         const { message, roomId } = messageData;
//         console.log(`Message from ${user?.userName} in room ${rooms[roomId].roomName}: ${roomId}`);
//         if (!messages[roomId]) {
//             messages[roomId] = [];
//         }
//         messages[roomId].push({ user: user, message });
//         io.to(roomId).emit('chat-message', { user: user, message });
//     });

//     client.on('disconnect', () => {
//         console.log(`User disconnected: ${user.userName} from room ${roomId}`);
//     });
// });

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
