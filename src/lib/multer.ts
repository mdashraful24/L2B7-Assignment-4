import httpStatus from 'http-status';
import multer from 'multer';
import { SelfError } from '../utils/errorResponse';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        cb(new SelfError('Only image files are allowed', httpStatus.BAD_REQUEST));
        return;
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});
