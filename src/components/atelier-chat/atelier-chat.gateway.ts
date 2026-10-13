import { allowedOrigins } from '../auth/sessions/auth-security';
import type { IncomingMessage } from 'http';
import { Injectable } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import { AuthService } from '../auth/auth.service';
import { AtelierChatService } from './atelier-chat.service';

type SocketSession = { member: any; atelier: string; customerId: string; owner: any; token: string };

@Injectable()
@WebSocketGateway({ path: '/atelier-chat', transport: ['websocket'], secure: false })
export class AtelierChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server!: Server;
	private sessions = new WeakMap<WebSocket, SocketSession>();
	constructor(private readonly auth: AuthService, private readonly chat: AtelierChatService) {}
	handleConnection(client: WebSocket, request: IncomingMessage) {
    if (!allowedOrigins().includes(String(request?.headers?.origin))) client.close();
  }
	handleDisconnect(client: WebSocket) { this.sessions.delete(client); }

	@SubscribeMessage('auth')
	async authenticate(@ConnectedSocket() client: WebSocket, @MessageBody() body: any) {
		try {
			const member = await this.auth.getAuthenticatedMember(body?.token);
			const atelier = String(body?.atelier ?? '');
			const owner = await this.chat.owner();
			if (this.chat.isOwner(member)) {
				const customerId = String(body?.customerId ?? '');
				if (!customerId || !(await this.chat.canSellerOpenCustomer(customerId))) throw new Error('Choose a valid client conversation.');
				this.sessions.set(client, { member, atelier, customerId, owner, token: body.token });
			} else {
				this.sessions.set(client, { member, atelier, customerId: String(member._id), owner, token: body.token });
			}
			this.send(client, 'auth:success', { customerId: this.sessions.get(client)?.customerId });
		} catch (error) { this.send(client, 'auth:error', { message: error instanceof Error ? error.message : 'Authentication failed.' }); client.close(); }
	}

	@SubscribeMessage('message:send')
	async sendMessage(@ConnectedSocket() client: WebSocket, @MessageBody() body: any) {
		const session = this.sessions.get(client);
		if (!session) { this.send(client, 'auth:error', { message: 'Sign in to use this private conversation.' }); return; }
		try { session.member = await this.auth.getAuthenticatedMember(session.token); }
    catch { this.send(client, "auth:error", { message: "Please reconnect your session." }); client.close(); return; }

		try {
			const saved = await this.chat.saveMessage({ atelier: session.atelier, customerId: session.customerId, sender: session.member, owner: session.owner, messageContent: String(body?.messageContent ?? ''), attachments: Array.isArray(body?.attachments) ? body.attachments : [] });
			const packet = { ...saved.toObject(), _id: String(saved._id), senderId: String(saved.senderId), recipientId: String(saved.recipientId), customerId: session.customerId };
			for (const socket of this.server.clients) {
				const other = this.sessions.get(socket as WebSocket);
				if (socket.readyState === WebSocket.OPEN && other?.atelier === session.atelier && other.customerId === session.customerId) {
          try { await this.auth.getAuthenticatedMember(other.token); this.send(socket as WebSocket, 'message:new', packet); }
          catch { this.send(socket as WebSocket, 'auth:error', { message: 'Please reconnect your session.' }); socket.close(); }
        }
			}
		} catch (error) { this.send(client, 'atelier:error', { message: error instanceof Error ? error.message : 'Your message could not be sent.' }); }
	}

	private send(client: WebSocket, event: string, data: any) { if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ event, data })); }
}
