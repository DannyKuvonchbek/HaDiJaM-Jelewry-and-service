import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class AtelierHoursScheduler implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private readonly logger = new Logger(AtelierHoursScheduler.name);
  constructor(private readonly notifications: NotificationsService, private readonly gateway: NotificationsGateway) {}
  onModuleInit() {
    void this.publishIfDue();
    this.timer = setInterval(() => void this.publishIfDue(), 30_000);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  private async publishIfDue() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    const weekday = get('weekday');
    if (!['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday)) return;
    const minute = `${get('hour')}:${get('minute')}`;
    const date = `${get('year')}-${get('month')}-${get('day')}`;
    const message = minute === '07:55'
      ? ['Ateliers open in five minutes', 'Our ateliers open at 8:00 AM KST. We look forward to assisting you.']
      : minute === '19:55'
        ? ['Ateliers close in five minutes', 'Our ateliers close at 8:00 PM KST. Please complete any ongoing requests before closing.']
        : null;
    if (!message) return;
    try {
      const notice = await this.notifications.createGlobal(`${date}:${minute}`, message[0], message[1]);
      if (notice) await this.gateway.emitEveryone(notice);
    } catch {
      this.logger.error('Could not publish atelier hours announcement.');
    }
  }
}
