import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { AiQuotaError, transcribeAudio } from "@/lib/ai";
import { getUserAiKey } from "@/lib/ai-quota";

const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/mpga",
  "audio/wav",
  "audio/x-wav",
  "audio/x-pn-wav",
  "audio/ogg",
  "audio/oga",
  "audio/webm",
  "audio/flac",
  "audio/aac",
  "audio/x-aac",
  "audio/x-mpeg",
  "video/mp4",
  "video/webm",
  "video/ogg",
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "You need to be signed in." },
      { status: 401 }
    );
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("file");
    file = value instanceof File ? value : null;
  } catch {
    return NextResponse.json(
      { error: "Could not read the uploaded file." },
      { status: 400 }
    );
  }

  if (!file) {
    return NextResponse.json(
      { error: "No audio file was provided." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error:
          "That recording is larger than 25 MB. Try a shorter clip or a lower-quality export.",
      },
      { status: 413 }
    );
  }

  const type = (file.type || "").toLowerCase();
  if (!ALLOWED_TYPES.has(type) && !/^audio\//.test(type)) {
    return NextResponse.json(
      {
        error:
          "That file type is not supported. Upload an audio recording (mp3, m4a, wav, ogg, webm, mp4, flac…).",
      },
      { status: 415 }
    );
  }

  const filename = file.name || "recording";

  try {
    const text = await transcribeAudio(undefined, file, filename);
    return NextResponse.json({ text });
  } catch (err) {
    if (err instanceof AiQuotaError) {
      const own = await getUserAiKey(supabase);
      if (!own) {
        return NextResponse.json(
          {
            error:
              "The app's shared transcription quota is exhausted or rate-limited right now. Add your own Groq or OpenAI API key in Settings to keep transcribing.",
          },
          { status: 429 }
        );
      }
      try {
        const text = await transcribeAudio(own, file, filename);
        return NextResponse.json({ text });
      } catch (err2) {
        if (err2 instanceof AiQuotaError) {
          return NextResponse.json(
            {
              error:
                "Your own API key is also out of quota or rate-limited right now. Check it in Settings or try again shortly.",
            },
            { status: 429 }
          );
        }
        return NextResponse.json(
          {
            error:
              "Transcription with your own key failed. Make sure it is a Groq or OpenAI key — OpenRouter does not support audio transcription.",
          },
          { status: 502 }
        );
      }
    }
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 502 }
    );
  }
}