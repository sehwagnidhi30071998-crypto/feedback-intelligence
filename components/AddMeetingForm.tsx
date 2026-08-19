"use client";

import { useActionState, useState } from "react";
import { submitMeeting } from "@/lib/actions";
import FormButtons from "@/components/FormButtons";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function parseTranscriptFile(name: string, content: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "vtt" || ext === "srt") {
    return content
      .split(/\r?\n/)
      .map((line) => line.replace(/<[^>]+>/g, "").trim())
      .filter((line) => {
        if (!line) return false;
        if (line === "WEBVTT") return false;
        if (/^\d{1,2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*/.test(line)) return false;
        if (/^\d{1,2}:\d{2}\s*-->\s*/.test(line)) return false;
        if (/^\d+$/.test(line)) return false;
        return true;
      })
      .join("\n");
  }
  return content;
}

export default function AddMeetingForm() {
  const [state, formAction] = useActionState(submitMeeting, {});
  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const onTranscriptFile = async (file: File | undefined) => {
    setImportError(null);
    if (!file) return;
    try {
      const content = await file.text();
      const parsed = parseTranscriptFile(file.name, content);
      if (!parsed.trim()) {
        setImportError("That file did not contain any transcript text.");
        return;
      }
      setTranscript(parsed.trim());
    } catch {
      setImportError("Could not read that file. Please try another one.");
    }
  };

  const onAudioFile = async (file: File | undefined) => {
    setTranscribeError(null);
    if (!file) return;
    if (file.size > MAX_AUDIO_BYTES) {
      setTranscribeError(
        "That recording is larger than 25 MB. Try a shorter clip or a lower-quality export."
      );
      return;
    }
    setTranscribing(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/transcribe", { method: "POST", body });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        setTranscribeError(
          data.error ?? "Transcription failed. Please try again."
        );
      } else {
        setTranscript(data.text);
      }
    } catch {
      setTranscribeError("Transcription failed. Please try again.");
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div className="fi-notice border-danger-soft bg-danger-soft text-danger">
          {state.error}
        </div>
      ) : null}

      <div>
        <label className="fi-label" htmlFor="title">
          Meeting title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Customer call — Acme Corp"
          className="fi-input"
        />
      </div>

      <div>
        <label className="fi-label" htmlFor="date">
          Meeting date
        </label>
        <input id="date" name="date" type="date" className="fi-input" />
      </div>

      <div>
        <label className="fi-label" htmlFor="participants">
          Participants
        </label>
        <input
          id="participants"
          name="participants"
          type="text"
          placeholder="e.g. Sarah, Mike, David"
          className="fi-input"
        />
        <p className="mt-1 text-xs text-faint">Separate names with commas.</p>
      </div>

      <div>
        <label className="fi-label" htmlFor="context">
          Additional context
        </label>
        <textarea
          id="context"
          name="context"
          rows={3}
          placeholder="Anything helpful for understanding the meeting, such as the product area discussed..."
          className="fi-input"
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="fi-label" htmlFor="transcript">
            Transcript
          </label>
          <textarea
            id="transcript"
            name="transcript"
            rows={10}
            required
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the meeting transcript here, or import it from a file / recording below..."
            className="fi-input font-mono text-xs leading-relaxed"
          />
          {transcript ? (
            <button
              type="button"
              onClick={() => setTranscript("")}
              className="fi-btn-ghost mt-1 text-xs"
            >
              Clear transcript
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-paper/40 p-3">
            <label className="fi-label" htmlFor="transcript_file">
              Import transcript file
            </label>
            <input
              id="transcript_file"
              type="file"
              accept=".txt,.md,.vtt,.srt,text/plain"
              disabled={transcribing}
              onChange={(e) => {
                onTranscriptFile(e.target.files?.[0]);
                e.target.value = "";
              }}
              className="mt-1 block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-line-strong/30"
            />
            <p className="mt-1 text-xs text-faint">
              .txt, .md, .vtt or .srt — timestamps are removed automatically.
            </p>
            {importError ? (
              <p className="mt-1 text-xs text-danger">{importError}</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-line bg-paper/40 p-3">
            <label className="fi-label" htmlFor="audio_file">
              Transcribe a recording
            </label>
            <input
              id="audio_file"
              type="file"
              accept="audio/*,.mp4,.webm,.m4a,.mp3,.wav,.ogg,.flac,.aac"
              disabled={transcribing}
              onChange={(e) => {
                onAudioFile(e.target.files?.[0]);
                e.target.value = "";
              }}
              className="mt-1 block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-line-strong/30"
            />
            <p className="mt-1 text-xs text-faint">
              mp3, m4a, wav, ogg, webm, mp4, flac… up to 25 MB. Uses Whisper via
              Groq.
            </p>
            {transcribing ? (
              <p className="mt-1 flex items-center gap-2 text-xs text-signal-strong">
                <span className="fi-pulse inline-block h-2 w-2 rounded-full bg-signal" />
                Transcribing… this can take a minute.
              </p>
            ) : null}
            {transcribeError ? (
              <p className="mt-1 text-xs text-danger">{transcribeError}</p>
            ) : null}
          </div>
        </div>
      </div>

      <FormButtons />

      <p className="text-xs text-faint">
        Save Meeting stores the meeting without analyzing it. Analyze Transcript
        saves it and extracts feedback items using AI.
      </p>
    </form>
  );
}