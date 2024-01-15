import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
    socket: Socket;
    name: string;
    interests: string[];
}

export class UserManager {
    private users: User[];
    private queue: string[];
    private roomManager: RoomManager;

    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(name: string, interests: string[], socket: Socket) {
        this.users.push({
            name, socket, interests
        })
        this.queue.push(socket.id);
        socket.emit("lobby");
        this.clearQueue();
        this.initHandlers(socket);
    }

    removeUser(socketId: string) {
        this.users = this.users.filter(user => user.socket.id !== socketId)
        this.queue = this.queue.filter(x => x !== socketId);
    }

    clearQueue() {
        if (this.queue.length < 2) {
            return;
        }

        const id1 = this.queue.shift();
        if (!id1) return;
        const user1 = this.users.find(user => user.socket.id === id1);
        if (!user1) return;

        let bestMatchIndex = -1;
        let commonInterestsCount = -1;

        for (let i = 0; i < this.queue.length; i++) {
            const id2 = this.queue[i];
            const user2 = this.users.find(user => user.socket.id === id2);
            if (!user2) continue;

            const common = user1.interests.filter(interest => user2.interests.includes(interest)).length;
            if (common > commonInterestsCount) {
                commonInterestsCount = common;
                bestMatchIndex = i;
            }
        }

        if (bestMatchIndex !== -1) {
            const id2 = this.queue.splice(bestMatchIndex, 1)[0];
            const user2 = this.users.find(user => user.socket.id === id2);
            if (user2) {
                this.roomManager.createRoom(user1, user2);
            }
        } else {
            this.queue.unshift(id1);
        }

        if (this.queue.length >= 2) {
            this.clearQueue();
        }
    }

    initHandlers(socket: Socket) {
        socket.on("offer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        })
        socket.on("answer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });
        socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });
        socket.on("message", ({ message, roomId }: { message: string, roomId: string }) => {
            this.roomManager.onMessage(roomId, message, socket.id);
        });
        socket.on("skip", ({ roomId }: { roomId: string }) => {
            this.roomManager.onSkip(roomId, socket.id);
            // After skip, re-add to queue
            this.queue.push(socket.id);
            this.clearQueue();
        });
    }
}