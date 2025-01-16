import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModel } from './app.model';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly appModel: AppModel,
  ) {}

  async getLastVideo() {
    const playlistId = this.configService.get('LTX_PLAYLIST_ID');
    const key = this.configService.get('YOUTUBE_API_KEY');
    try {
      const playlistItems = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${key}`,
      );

      if (!playlistItems.ok) {
        throw new Error(`HTTP error! status: ${playlistItems.status}`);
      }

      const playlistItemsJson = await playlistItems.json(); // Parse the JSON data
      const vidIds = playlistItemsJson.items.map(
        (vdo) => vdo?.contentDetails.videoId,
      );
      const vidParams = vidIds.join('&id=');

      const videos = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${vidParams}&key=${key}`,
      );
      if (!videos.ok) {
        throw new Error(`HTTP error! status: ${playlistItems.status}`);
      }
      const videosJson = await videos.json(); // Parse the JSON data
      return videosJson;
    } catch (error) {
      console.error('Error fetching last seen videos:', error.message);
      throw new HttpException(
        'Failed to fetch last seen videos',
        HttpStatus.BAD_REQUEST,
        { cause: error },
      );
    }
  }

  async getCardList() {
    try {
      const list = this.appModel.getCardList();
      return list;
    } catch (error) {
      console.error('Error fetching card list:', error.message);
      throw new HttpException(
        'Failed to fetch card list',
        HttpStatus.BAD_REQUEST,
        { cause: error },
      );
    }
  }
}
