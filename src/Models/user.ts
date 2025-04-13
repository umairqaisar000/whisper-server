import { Room } from "./room";

export interface User {
    id: number;
    userName: string;
}

export interface ChatMessage {
    user: User;
    message: string;
    timestamp?: Date;
}

export class UserData {
    static users: User[] = [];
    static rooms: Record<string, Room> = {};
    static messages: Record<string, ChatMessage[]> = {};
    static userIdCount = 0;
}