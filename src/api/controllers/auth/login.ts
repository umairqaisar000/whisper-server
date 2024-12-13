import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { addUserToRoom, generateRoomId } from '../../../Helpers/roomHelpers';
import { User, UserData } from '../../../Models/user';

const secret = process.env.JWT_SECRET || 'no-salt';

const loginUser = async (req: any, res: Response): Promise<Response> => {
    try {
        const { username, paramRoomId } = req.body;

        console.log('Received paramRoomId:', req.body);

        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }
        const user: User = { id: UserData.userIdCount++, userName: username }

        const roomId = paramRoomId ?? generateRoomId();
        UserData.users.push(user);

        const room = addUserToRoom(user, roomId);
        console.log(room);
        // JWT payload with username and session info
        const payload = { user, sessionId: Date.now() };
        console.log(payload);

        // Generate JWT with 1-hour expiration
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        return res.json({ token, room: room });
    } catch (error: any) {
        console.log(error)
        return res.status(401).json({
            success: false,
            message: error.message,
            data: {},
        })
    }
}

export default loginUser