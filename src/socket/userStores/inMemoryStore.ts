import { Socket } from "socket.io"
import { IUserSocketStore } from "."

class InMemoryUserStore implements IUserSocketStore {
    private sockets: Map<string, Socket> = new Map()

    async setSocket(socketId: string, socket: Socket): Promise<void> {
        this.sockets.set(socketId, socket)
    }

    async removeSocket(socketId: string): Promise<void> {
        this.sockets.delete(socketId)
    }

    async getSocket(socketId: string): Promise<Socket | undefined> {
        return this.sockets.get(socketId)
    }

    // async setUser(socketId: string, user: Socket): Promise<void> {
    //     this.users.set(socketId, user)
    // }

    // async removeUser(socketId: string): Promise<void> {
    //     this.users.delete(socketId)
    // }

    // async getUser(socketId: string): Promise<Socket | undefined> {
    //     return this.users.get(socketId)
    // }
}

export default InMemoryUserStore
