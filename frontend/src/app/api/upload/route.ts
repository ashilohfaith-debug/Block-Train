import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary using provided credentials
// In production, these should be set in Vercel Environment Variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "axo4chgd",
  api_key: process.env.CLOUDINARY_API_KEY || "236778854532891",
  api_secret: process.env.CLOUDINARY_API_SECRET || "eCGxuADzeQpWRXurs2RDtJfWJ30"
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file uploaded" }, { status: 400 });
    }

    // Convert the Web File object to a Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload directly from memory buffer to Cloudinary
    const cloudinaryUrl = await new Promise<string>((resolve, reject) => {
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
          if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error("Unknown Cloudinary error"));
          }
        }
      );

      // Convert the buffer to a readable stream and pipe it to Cloudinary
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    // Return the permanent public Cloudinary URL to the frontend
    return NextResponse.json({ success: true, audioUrl: cloudinaryUrl });

  } catch (err) {
    console.error("Audio Upload API Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
