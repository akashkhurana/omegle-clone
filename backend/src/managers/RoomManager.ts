import { User } from "./UserManager";

let GLOBAL_ROOM_ID = 1;

interface Room {
    user1: User;
    user2: User;
}

export class RoomManager {
    private rooms: Map<string, Room>
    constructor() {
        this.rooms = new Map<string, Room>();
    }

    createRoom(user1: User, user2: User) {
        const roomId = this.generate().toString();
        this.rooms.set(roomId.toString(), {
            user1,
            user2,
        });

        user1.socket.emit("send-offer", {
            roomId
        })
    }

    onOffer(roomId: string, sdp: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1
        receivingingUser?.socket.emit("offer", {
            sdp,
            roomId
        })
    }

    onAnswer(roomId: string, sdp: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1
        receivingingUser?.socket.emit("answer", {
            sdp,
            roomId
        })
    }

    onIceCandidates(roomId: string, senderSocketId: string, candidate: any, type: "sender" | "receiver") {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1
        receivingingUser.socket.emit('add-ice-candidate', ({ candidate }));
    }

    onMessage(roomId: string, message: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        receivingUser.socket.emit("message", { message });
    }

    onSkip(roomId: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        this.rooms.delete(roomId);
        const user1 = room.user1;
        const user2 = room.user2;

        user1.socket.emit("lobby");
        user2.socket.emit("lobby");
        
        // Re-inject into queue via manager - this would require a circular ref or passing manager
        // Simpler: Just emit 'lobby' and let frontend handle re-joining if needed, 
        // but current logic has users stay in 'users' array.
        // Let's assume RoomManager has access to a callback or UserManager is static/singleton.
        // Actually, in this architecture, we should probably just notify the frontend and let it reconnect or handle the state.
    }

    generate() {
        return GLOBAL_ROOM_ID++;
    }
}