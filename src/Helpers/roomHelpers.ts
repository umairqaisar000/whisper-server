import { Room } from "../Models/room";
import { User, UserData } from "../Models/user";

const crypto = require('crypto');

export const generateRandomRoomName = () => {
    const adjectives = ['Cool', 'Amazing', 'Fast', 'Smart', 'Clever'];
    const nouns = ['Fox', 'Tiger', 'Eagle', 'Shark', 'Panda'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}`;
};

export const generateRoomId = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // Generates 6 alphanumeric characters
}

export const addUserToRoom = (user: User, roomId: string): Room => {
    if (!UserData.rooms[roomId]) {
        UserData.rooms[roomId] = { id: roomId, roomName: generateRandomRoomName(), users: [] };
    }
    UserData.rooms[roomId].users.push(user);
    return UserData.rooms[roomId];
};