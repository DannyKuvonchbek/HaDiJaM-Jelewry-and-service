import type { IncomingMessage } from 'http';
import { Injectable } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import { allowedOrigins } from '../auth/sessions/auth-security';
import { AuthService } from '../auth/auth.service';

 type Session = { memberId: string; token: string };

@Injectable()
@WebSocketGateway({ path: '/notifications', transport: ['websocket'], secure: false })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private sessions = new WeakMap<WebSocket, Session>();
  constructor(private readonly auth: AuthService) {}
  handleConnection(client: WebSocket, request: IncomingMessage) {
    if (!allowedOrigins().includes(String(request?.headers?.origin))) client.close();
  }
  handleDisconnect(client: WebSocket) { this.sessions.delete(client); }

  @SubscribeMessage('auth')
  async authenticate(@ConnectedSocket() client: WebSocket, @MessageBody() body: any) {
    try {
      const member = await this.auth.getAuthenticatedMember(String(body?.token ?? ''));
      this.sessions.set(client, { memberId: String(member._id), token: String(body.token) });
      this.send(client, 'auth:success', { memberId: String(member._id) });
    } catch {
      this.send(client, 'auth:error', { message: 'Please sign in again to receive notifications.' });
      client.close();
    }
  }

  async emitMember(memberId: string, notification: any) {
    await this.emitMatching(notification, async (session) => session.memberId === memberId);
  }
  async emitEveryone(notification: any) {
    await this.emitMatching(notification, async () => true);
  }
  private async emitMatching(notification: any, matches: (session: Session) => Promise<boolean>) {
    if (!this.server) return;
    const packet = { event: 'notification:new', data: notification?.toObject ? notification.toObject() : notification };
    for (const socket of this.server.clients) {
      const client = socket as WebSocket;
      const session = this.sessions.get(client);
      if (client.readyState !== WebSocket.OPEN || !session || !(await matches(session))) continue;
      try {
        const member = await this.auth.getAuthenticatedMember(session.token);
        if (String(member._id) !== session.memberId) throw new Error('Session changed');
        client.send(JSON.stringify(packet));
      } catch {
        client.close();
      }
    }
  }
  private send(client: WebSocket, event: string, data: any) {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ event, data }));
  }
}
