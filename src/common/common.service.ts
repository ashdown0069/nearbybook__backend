import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AppService } from 'src/app.service';

@Injectable()
export class CommonService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly httpService: HttpService) {}
  async sendMessageToDiscord(
    title: string,
    description: string,
    type: 'Error' | 'Feedback' | 'Alert',
    feedbackEmail?: string,
  ) {
    feedbackEmail = feedbackEmail ?? '없음'; // feedbackEmail이 undefined 또는 null이면 'test'를 할당
    const colorMap = {
      Error: 16711680,
      Feedback: 255,
      Alert: 16776960,
    };
    const discordWebHookURL = process.env.DISCORD_WEBHOOK_URL;
    try {
      await this.httpService.axiosRef.post(
        discordWebHookURL,
        {
          embeds: [
            {
              title: type + ': ' + title,
              description: description,
              color: colorMap[type],
              timestamp: new Date().toISOString(),
              footer: {
                text: 'Email: ' + feedbackEmail,
              },
            },
          ],
        },
        {
          baseURL: '',
        },
      );
    } catch (error) {
      this.logger.error('sendMessageToDiscord service error', error);
      return false;
    }

    return true;
  }
}
