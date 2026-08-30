const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary using provided credentials
// In production, these should ideally be set in the Vercel Environment Variables dashboard
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "axo4chgd",
  api_key: process.env.CLOUDINARY_API_KEY || "236778854532891",
  api_secret: process.env.CLOUDINARY_API_SECRET || "eCGxuADzeQpWRXurs2RDtJfWJ30"
});

const CloudinaryService = {
  /**
   * Uploads an audio buffer directly to Cloudinary via a stream.
   * This prevents us from having to save the file to a local disk,
   * which makes it 100% Vercel Serverless compatible!
   * 
   * @param {Buffer} fileBuffer - The audio file buffer in memory
   * @returns {Promise<string>} - The secure, public Cloudinary URL
   */
  uploadAudioStream(fileBuffer) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video", // Cloudinary categorizes audio under 'video'
          folder: "block-train-audio",
          format: "mp3"
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return reject(error);
          }
          resolve(result.secure_url);
        }
      );

      // Convert the buffer to a readable stream and pipe it to Cloudinary
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }
};

module.exports = CloudinaryService;
