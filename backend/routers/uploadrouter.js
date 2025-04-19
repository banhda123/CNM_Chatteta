// routes/uploadRoute.js
import express from 'express';
import fs from 'fs';
import { upload } from '../multer/upload.js';
import { uploadToCloudinary } from '../config/Cloudinary.js';

const router = express.Router();

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const filePath = req.file.path;

        // Upload lên Cloudinary
        const result = await uploadToCloudinary(filePath, 'my_app_images');

        // Xóa file tạm
        fs.unlinkSync(filePath);

        res.json({
            message: 'Upload thành công',
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
