import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly FOLDER = 'MCSA-Student-Awards-Testing2';

  async uploadImage(image: string) {
    try {
      const result = await cloudinary.uploader.upload(image, {
        folder: this.FOLDER,
        resource_type: 'image',
        unique_filename: true,
      });
      return result.secure_url;
    } catch (error) {
      let message: string;
      if (error.http_code === 400) {
        message = 'Invalid image file, unable to upload';
      } else if (error.error?.code === 'ENOENT') {
        message = 'No such file or directory';
      } else if (error.http_code === 404) {
        message = 'Resource not found, unable to upload image';
      } else if (error.http_code === 401) {
        message = 'Unauthorized action, unable to upload image';
      }
      throw new BadRequestException(
        message ||
          error.message ||
          'Unknown error while uploading image, please try again.',
      );
    }
  }

  async deleteImage(imageUrl: string) {
    try {
      const publicId =
        `${this.FOLDER}` + imageUrl.split(this.FOLDER)[1].split('.')[0];
      const response = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });
      if (response.result === 'ok') {
        // console.log('Image deleted on cloudinary');
        return true;
      } else if (response.result === 'not found') {
        console.log('CLOUDINARY: Image not found');
      }
      return false;
    } catch (error) {
      console.log('CLOUDINARY: Uncaught error happened while deleting image');
      return false;
    }
  }
}
