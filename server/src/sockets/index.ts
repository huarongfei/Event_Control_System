import { Server, Socket } from 'socket.io';
import { AuthRequest } from '../middleware/auth.js';
import { verifyToken } from '../middleware/auth.js';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export class SocketManager {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.initializeMiddleware();
    this.setupEventHandlers();
  }

  private initializeMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const user = await verifyToken(token);
        socket.user = user;
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔌 User ${socket.user?.username} connected (${socket.id})`);

      socket.on('join-match', (matchId: string) => {
        if (!matchId) {
          socket.emit('error', { message: 'Match ID required' });
          return;
        }

        socket.join(`match:${matchId}`);
        console.log(`👥 User ${socket.user?.username} joined match ${matchId}`);
        socket.emit('joined-match', { matchId });
      });

      socket.on('leave-match', (matchId: string) => {
        socket.leave(`match:${matchId}`);
        console.log(`👋 User ${socket.user?.username} left match ${matchId}`);
        socket.emit('left-match', { matchId });
      });

      socket.on('score-update', (data: any) => {
        if (!socket.user) return;
        
        const { matchId } = data;
        socket.to(`match:${matchId}`).emit('score:updated', {
          ...data,
          updatedBy: socket.user.username,
          timestamp: Date.now()
        });
      });

      socket.on('timer-sync', (data: any) => {
        const { matchId } = data;
        socket.to(`match:${matchId}`).emit('timer:sync', {
          ...data,
          timestamp: Date.now()
        });
      });

      socket.on('disconnect', () => {
        console.log(`🔌 User ${socket.user?.username} disconnected (${socket.id})`);
      });
    });
  }

  public broadcastToMatch(matchId: string, event: string, data: any): void {
    this.io.to(`match:${matchId}`).emit(event, {
      ...data,
      timestamp: Date.now()
    });
  }

  public broadcastToRole(role: string, event: string, data: any): void {
    this.io.sockets.sockets.forEach((socket: AuthenticatedSocket) => {
      if (socket.user?.role === role) {
        socket.emit(event, data);
      }
    });
  }

  public getRoomClients(room: string): Promise<string[]> {
    return this.io.in(room).fetchSockets().then(sockets => sockets.map(s => s.id));
  }
}

export default SocketManager;
