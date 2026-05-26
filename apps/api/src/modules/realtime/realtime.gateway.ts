import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect,
  ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
@Injectable()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, AuthenticatedSocket>();

  handleConnection(client: AuthenticatedSocket) {
    const userId = client.handshake.query.userId as string;
    const userRole = client.handshake.query.role as string;

    if (userId) {
      client.userId = userId;
      client.userRole = userRole;
      this.connectedClients.set(userId, client);

      if (userRole === 'admin') {
        client.join('admin-room');
      }

      client.join(`user-${userId}`);
      this.logger.log(`Client connected: ${userId}`);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedClients.delete(client.userId);
      this.logger.log(`Client disconnected: ${client.userId}`);
    }
  }

  @SubscribeMessage('join-assignment')
  handleJoinAssignment(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { assignmentId: string },
  ) {
    client.join(`assignment-${data.assignmentId}`);
    return { event: 'joined', data: { assignmentId: data.assignmentId } };
  }

  @SubscribeMessage('leave-assignment')
  handleLeaveAssignment(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { assignmentId: string },
  ) {
    client.leave(`assignment-${data.assignmentId}`);
    return { event: 'left', data: { assignmentId: data.assignmentId } };
  }

  @SubscribeMessage('location-update')
  handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      assignmentId: string;
      latitude: number;
      longitude: number;
      timestamp: string;
    },
  ) {
    this.server.to('admin-room').emit('cleaner-location', {
      userId: client.userId,
      ...data,
    });
    return { event: 'location-received' };
  }

  @SubscribeMessage('request-dashboard')
  handleRequestDashboard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { section: string },
  ) {
    this.server.to('admin-room').emit('dashboard-request', data);
    return { event: 'dashboard-requested', data };
  }

  @SubscribeMessage('assignment-status')
  handleAssignmentStatus(
    @MessageBody() data: {
      assignmentId: string;
      status: string;
    },
  ) {
    this.server.to(`assignment-${data.assignmentId}`).emit('status-update', data);
    this.server.to('admin-room').emit('assignment-update', data);
    return { event: 'status-updated' };
  }

  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user-${userId}`).emit(event, data);
  }

  sendToAdmin(event: string, data: unknown) {
    this.server.to('admin-room').emit(event, data);
  }

  sendToAssignment(assignmentId: string, event: string, data: unknown) {
    this.server.to(`assignment-${assignmentId}`).emit(event, data);
  }

  getConnectedClients(): number {
    return this.connectedClients.size;
  }
}
