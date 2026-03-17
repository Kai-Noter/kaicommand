import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No audio file received." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create a unique filename. Voice recordings from MediaRecorder are typically webm or mp4 
    const extension = file.type.includes('mp4') ? 'mp4' : 'webm';
    const filename = `voice_${uuidv4()}.${extension}`;
    
    // Save to public/uploads/audio
    const uploadDir = path.join(process.cwd(), "public", "uploads", "audio");
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);
    
    let transcript = "";
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      const bFormData = new FormData();
      bFormData.append("file", file, filename);
      bFormData.append("model", "whisper-1");
      
      try {
        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`
          },
          body: bFormData
        });
        const whisperData = await whisperRes.json();
        if (whisperData.text) {
          transcript = whisperData.text;
        }
      } catch (err) {
        console.error("Whisper transcription failed", err);
      }
    }
    
    // Return the public URL
    const audioUrl = `/uploads/audio/${filename}`;
    return NextResponse.json({ audioUrl, transcript, success: true });

  } catch (error: any) {
    console.error("Audio Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload audio." }, { status: 500 });
  }
}
