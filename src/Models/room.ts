import { User } from "./user";

export interface Room {
    id: string;
    roomName: string;
    users: User[];
}
