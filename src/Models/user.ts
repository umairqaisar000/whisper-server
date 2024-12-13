import { Room } from "./room";

export interface User {
    id: number;
    userName: string;
}

export class UserData {
    static users: User[] = [];
    static rooms: Record<string, Room> = {};
    static messages: Record<string, { user: User; message: string }[]> = {};
    static userIdCount = 0;
}