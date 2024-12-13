import { Server as HttpServer } from "http";
import jwt, { JwtPayload } from "jsonwebtoken"; // Ensure JWT is imported
import { Server as IOServer, Socket } from "socket.io";
import { UserData } from "../Models/user";
import { IUserSocketStore } from "./userStores";
import InMemoryUserStore from "./userStores/inMemoryStore";

const secret = "no-salt"; // Secret key for JWT

export default class SocketServer {

    static instance: SocketServer;

    static io: IOServer;

    static socketStore: IUserSocketStore;


    static socketEvents = {
        DELETE_MESSAGE: "deleteMessage",
        DISCONNECT: "disconnect",
        PING_SOCKET: "pingSocket",
        CHAT_MESSAGE: "chat-message",
        CHAT_HISTORY: "chat-history",
    };

    constructor(httpServer: HttpServer, socketStore: IUserSocketStore) {
        const ioOptions = {
            cors: {
                origin: "http://localhost:3000", // Allow only localhost:3000 to connect
                methods: ["GET", "POST"], // Allow GET and POST methods
                allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
                transports: ["websocket", "polling"],
            }
        };

        SocketServer.io = new IOServer(httpServer, ioOptions);
        SocketServer.socketStore = socketStore;
        this.listen();
    }

    private listen(): void {
        // Middleware for authentication
        SocketServer.io.use((socket: Socket, next: (err?: Error) => void) => {
            const token = socket.handshake.query.token as string;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            jwt.verify(token, secret, (err, decoded) => {
                if (err || !decoded) {
                    return next(new Error('Authentication error'));
                }

                // Check if decoded is of type JwtPayload and has a user property
                if (typeof decoded !== 'string' && 'user' in decoded) {
                    socket.data.user = (decoded as JwtPayload & { user: any }).user;
                } else {
                    return next(new Error('Invalid token payload'));
                }

                next();
            });
        });

        // Handle new connection
        SocketServer.io.on("connection", (socket: Socket) => {
            const { user } = socket.data; // Get user from socket data after authentication
            const roomId = socket.handshake.query.roomId as string;

            console.log(`Client connected: ${socket.id}`);
            socket.emit("connected");

            if (!user) {
                console.log("Authentication failed. User not found.");
                return socket.disconnect();
            }

            console.log(`User ${user.userName} connected to room ${roomId}`);
            socket.join(roomId);

            // Send chat history to the user
            socket.emit(SocketServer.socketEvents.CHAT_HISTORY, UserData.messages[roomId] || []);

            // Handle incoming chat messages
            socket.on(SocketServer.socketEvents.CHAT_MESSAGE, (messageData) => {
                const { message, roomId } = messageData;
                console.log(`Message from ${user.userName} in room ${roomId}: ${message}`);

                if (!UserData.messages[roomId]) {
                    UserData.messages[roomId] = [];
                }

                UserData.messages[roomId].push({ user, message });
                SocketServer.io.to(roomId).emit(SocketServer.socketEvents.CHAT_MESSAGE, { user, message });
            });

            // Handle message deletion
            socket.on(SocketServer.socketEvents.DELETE_MESSAGE, (messageId) => {
                // Implement message deletion logic here if required
                console.log(`Message deleted: ${messageId}`);
                // Example: Remove from messages[roomId]
                // Emit message deletion to other users in the room
                SocketServer.io.to(roomId).emit(SocketServer.socketEvents.DELETE_MESSAGE, messageId);
            });

            // Handle disconnection
            socket.on(SocketServer.socketEvents.DISCONNECT, () => {
                console.log(`User disconnected: ${user.userName} from room ${roomId}`);
            });
        });
    }

    public static initialize(httpServer: HttpServer): SocketServer {
        if (!this.instance) {
            this.instance = new SocketServer(httpServer, new InMemoryUserStore());
        }
        return this.instance;
    }
}
