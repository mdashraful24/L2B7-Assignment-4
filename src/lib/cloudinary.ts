import type { UploadApiResponse } from 'cloudinary';
import { v2 as Cloudinary } from 'cloudinary';
import httpStatus from 'http-status';
import config from '../config';
import { SelfError } from '../utils/errorResponse';

Cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

export const cloudinary = Cloudinary;

export const uploadFileToCloudinary = (buffer: Buffer) =>
    new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ resource_type: 'auto' }, (error, result) => {
                if (error) {
                    return reject(error);
                }

                if (!result) {
                    return reject(new SelfError('No result returned from Cloudinary', httpStatus.BAD_REQUEST));
                }

                resolve(result);
            })
            .end(buffer);
    });

export const deleteFileFromCloudinary = async (publicId?: string | null) => {
    if (!publicId) {
        return;
    }

    await cloudinary.uploader.destroy(publicId);
};
