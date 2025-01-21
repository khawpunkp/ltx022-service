import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModel } from './app.model';
import { createClient } from '@supabase/supabase-js';
import { Prisma } from '@prisma/client';

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

  async uploadCardsByRarity(code: string, files: Array<Express.Multer.File>) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      // Step 1: Validate Rarity
      const rarity = await this.appModel.findRarityByCode(code);
      if (!rarity) throw new Error('Rarity not found!');
      if (files.length === 0) throw new Error('No files provided!');

      // Step 2: Transform Multer Files to Browser-compatible Files
      const transformFiles: File[] = files.map((file) => {
        return new File([file.buffer], file.originalname, {
          type: file.mimetype,
        });
      });

      // Step 3: Upload Files Concurrently
      const uploadPromises = transformFiles.map(async (file) => {
        const filePath = `${code}/${Date.now()}-${file.name}`;
        const runningNumber = parseInt(file.name.split('.')[0]);

        // Upload the file to Supabase Storage
        const { data: uploadedData, error: uploadedError } =
          await supabase.storage.from('ltx022-card').upload(filePath, file, {
            cacheControl: '3600',
            upsert: false, // Avoid overwriting existing files
          });

        if (uploadedError) {
          console.error(
            `Failed to upload ${file.name}: ${uploadedError.message}`,
          );
          throw new Error(
            `Failed to upload ${file.name}: ${uploadedError.message}`,
          );
        }

        // Generate Public URL
        const { data: publicUrl } = supabase.storage
          .from('ltx022-card')
          .getPublicUrl(filePath);

        // Prepare card data for insertion into the database
        const cardData: Prisma.CardUncheckedCreateInput = {
          runningNumber,
          imgSrc: publicUrl.publicUrl,
          rarityId: rarity.id,
        };

        try {
          // Insert card data into the database
          await this.appModel.createCard(cardData);
        } catch (error) {
          throw new Error(
            `Database error while saving card data for ${file.name}: ${error.message}`,
          );
        }

        return { runningNumber };
      });

      // Wait for all uploads to complete
      const results = await Promise.allSettled(uploadPromises);

      // Separate successful and failed uploads
      const successfulUploads = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => (result as PromiseFulfilledResult<any>).value);

      const failedUploads = results
        .filter((result) => result.status === 'rejected')
        .map((result) => {
          const errorReason = (result as PromiseRejectedResult).reason;
          const runningNumber =
            errorReason?.message?.match(/\d+/)?.[0] || 'N/A';
          return { error: errorReason.message, runningNumber }; // Include runningNumber in the failure report
        });

      return {
        success: failedUploads.length === 0,
        message: `${successfulUploads.length} files uploaded successfully, ${failedUploads.length} failed.`,
        successfulUploads,
        failedUploads,
      };
    } catch (error) {
      console.error('Error uploading files:', error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
