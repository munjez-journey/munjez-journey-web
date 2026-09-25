"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";

const SKIP_SECONDS = 15;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    const onError = () => setError(true);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }

  function skip(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), duration || audio.currentTime + seconds);
  }

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(event.target.value);
    audio.currentTime = value;
    setCurrentTime(value);
  }

  if (error) {
    return <p className="audio-player-error">تعذّر تحميل الصوت.</p>;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="audio-player-controls">
        <button type="button" className="audio-player-skip" onClick={() => skip(-SKIP_SECONDS)} aria-label="الرجوع 15 ثانية">
          <RotateCcw size={22} />
        </button>
        <button type="button" className="audio-player-play" onClick={togglePlay} aria-label={isPlaying ? "إيقاف" : "تشغيل"}>
          {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
        </button>
        <button type="button" className="audio-player-skip" onClick={() => skip(SKIP_SECONDS)} aria-label="التقديم 15 ثانية">
          <RotateCw size={22} />
        </button>
      </div>

      <div className="audio-player-progress">
        <span className="audio-player-time" dir="ltr">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="audio-player-range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          style={{ background: `linear-gradient(to left, var(--ink) ${progressPercent}%, var(--line) ${progressPercent}%)` }}
          aria-label="موضع التشغيل"
        />
        <span className="audio-player-time" dir="ltr">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
