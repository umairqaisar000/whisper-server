// IUserStore.ts

import { Socket } from "socket.io"
import { User } from "../../Models/user"

interface IUserStore {
    setUser(socketId: string, user: User): Promise<void>
    removeUser(socketId: string): Promise<void>
    getUser(socketId: string): Promise<User | undefined>
}

export interface IUserSocketStore {
    setSocket(userId: string, socket: Socket): Promise<void>
    removeSocket(userId: string): Promise<void>
    getSocket(userId: string): Promise<Socket | undefined>
}

export default IUserStore
