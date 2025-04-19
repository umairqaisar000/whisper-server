import dotenv from "dotenv";
import { Server as HttpServer } from "http";
import jwt, { JwtPayload } from "jsonwebtoken"; // Ensure JWT is imported
import { Server as IOServer, Socket } from "socket.io";
import { ChatMessage, UserData } from "../Models/user";
import { IUserSocketStore } from "./userStores";
import InMemoryUserStore from "./userStores/inMemoryStore";

const secret = process.env.JWT_SECRET || "no-salt"; // Secret key for JWT
dotenv.config()
interface OnlineUserInfo {
    id: number | string;
    userName: string;
}

export default class SocketServer {

    static instance: SocketServer;

    static io: IOServer;

    static socketStore: IUserSocketStore;

    // Map to track online users per room
    static onlineUsersPerRoom: Record<string, Map<string, Set<string>>> = {};

    // Map to store user info for quick access
    static userInfoMap: Record<string, OnlineUserInfo> = {};

    static socketEvents = {
        DELETE_MESSAGE: "deleteMessage",
        DISCONNECT: "disconnect",
        PING_SOCKET: "pingSocket",
        CHAT_MESSAGE: "chat-message",
        CHAT_HISTORY: "chat-history",
        ONLINE_USERS: "online-users",
        ONLINE_USERS_LIST: "online-users-list",
    };

    constructor(httpServer: HttpServer, socketStore: IUserSocketStore) {
        const origins = ["http://localhost:3000", "http://192.168.100.114:8080", "http://192.168.100.114:3000"];

        // Add CORS_ORIGIN to allowed origins if defined
        if (process.env.CORS_ORIGIN) {
            origins.push(process.env.CORS_ORIGIN);
        }

        const ioOptions = {
            cors: {
                origin: origins, // Use the filtered array of origins
                methods: ["GET", "POST"],
                allowedHeaders: ["Content-Type", "Authorization"],
                transports: ["websocket", "polling"],
                credentials: true
            }
        };

        SocketServer.io = new IOServer(httpServer, ioOptions);
        SocketServer.socketStore = socketStore;
        this.listen();
    }

    // Update online users count and broadcast to all clients in the room
    private static updateOnlineUsers(roomId: string): void {
        if (!this.onlineUsersPerRoom[roomId]) {
            this.onlineUsersPerRoom[roomId] = new Map();
        }

        // Count unique users (not connections)
        const uniqueUsersCount = this.onlineUsersPerRoom[roomId].size;
        console.log(`Room ${roomId} has ${uniqueUsersCount} online users`);

        // Create a list of online users (excluding duplicates)
        const onlineUsersList: OnlineUserInfo[] = [];
        for (const userId of this.onlineUsersPerRoom[roomId].keys()) {
            if (this.userInfoMap[userId]) {
                onlineUsersList.push(this.userInfoMap[userId]);
            }
        }

        // Broadcast the full count to all users in the room (don't filter)
        this.io.to(roomId).emit(this.socketEvents.ONLINE_USERS, uniqueUsersCount);

        // Broadcast the complete list of online users including all users
        this.io.to(roomId).emit(this.socketEvents.ONLINE_USERS_LIST, onlineUsersList);
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

            // Add user to the room
            socket.join(roomId);

            // Track user in the room - support multiple connections per user
            if (!SocketServer.onlineUsersPerRoom[roomId]) {
                SocketServer.onlineUsersPerRoom[roomId] = new Map();
            }

            // Store user info for quick lookup
            const userId = user.id.toString();
            SocketServer.userInfoMap[userId] = {
                id: user.id,
                userName: user.userName
            };

            // Get or create the set of socket IDs for this user
            if (!SocketServer.onlineUsersPerRoom[roomId].has(userId)) {
                SocketServer.onlineUsersPerRoom[roomId].set(userId, new Set());
            }

            // Add this socket ID to the user's connections
            SocketServer.onlineUsersPerRoom[roomId].get(userId)!.add(socket.id);

            // Update and broadcast the online user count
            SocketServer.updateOnlineUsers(roomId);

            // Send chat history to the user
            const history = UserData.messages[roomId] || [];
            // Ensure all messages have a timestamp
            const historyWithTimestamps = history.map((msg: ChatMessage) => ({
                ...msg,
                timestamp: msg.timestamp || new Date()
            }));
            socket.emit(SocketServer.socketEvents.CHAT_HISTORY, historyWithTimestamps);

            // Handle incoming chat messages
            socket.on(SocketServer.socketEvents.CHAT_MESSAGE, (messageData) => {
                const { message, roomId } = messageData;
                console.log(`Message from ${user.userName} in room ${roomId}: ${message}`);

                if (!UserData.messages[roomId]) {
                    UserData.messages[roomId] = [];
                }

                // Create message with timestamp
                const timestamp = new Date();
                const chatMessage: ChatMessage = { user, message, timestamp };

                // Store in history
                UserData.messages[roomId].push(chatMessage);

                // Broadcast to all users in the room including timestamp
                SocketServer.io.to(roomId).emit(SocketServer.socketEvents.CHAT_MESSAGE, chatMessage);
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

                // Remove this socket connection from user's connections
                if (SocketServer.onlineUsersPerRoom[roomId] &&
                    SocketServer.onlineUsersPerRoom[roomId].has(userId)) {

                    const userSockets = SocketServer.onlineUsersPerRoom[roomId].get(userId)!;
                    userSockets.delete(socket.id);

                    // If user has no more connections, remove them from online users
                    if (userSockets.size === 0) {
                        SocketServer.onlineUsersPerRoom[roomId].delete(userId);

                        // If room has no more users, clean up the room
                        if (SocketServer.onlineUsersPerRoom[roomId].size === 0) {
                            delete SocketServer.onlineUsersPerRoom[roomId];
                        } else {
                            // Update and broadcast the new count
                            SocketServer.updateOnlineUsers(roomId);
                        }
                    } else {
                        // User still has other connections, update the count
                        SocketServer.updateOnlineUsers(roomId);
                    }
                }
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
