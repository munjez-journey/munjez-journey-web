"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";

const REWIND_SECONDS = 15;
const FORWARD_SECONDS = 15;
const SPEEDS = [1, 1.5, 2] as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function AudioPlayer({
  audioUrl,
  imageUrl,
  title,
}: {
  audioUrl: string;
  imageUrl: string | null;
  title: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const isSeekingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      // تجاهل تحديثات currentTime أثناء السحب الفعلي كي لا تتصارع مع
      // موضع المؤشر الذي يحرّكه المستخدم (وإلا يُعاد المؤشر لموضع
      // التشغيل الفعلي في كل مرة يُطلق فيها هذا الحدث أثناء السحب).
      if (!isSeekingRef.current) setCurrentTime(audio.currentTime);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onError = () => setError(true);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    // إن كان عنصر <audio> يحمل بيانات وصفية محمَّلة مسبقاً وقت تركيب
    // المكوّن (مثلاً بعد إعادة تركيب من Fast Refresh أو استعادة من ذاكرة
    // التصفح)، لن يُطلَق حدث loadedmetadata مجدداً، فتبقى حالة duration
    // عالقة عند الصفر. نقرأ الحالة الفعلية مباشرة كإجراء احترازي.
    if (audio.readyState >= 1) {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    }

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch((err: DOMException) => {
        // AbortError يحدث عند مقاطعة play() باستدعاء pause() سريع تال —
        // سلوك طبيعي عند الضغط المتكرر، لا خطأ فعلياً يستحق الإبلاغ عنه.
        if (err.name !== "AbortError") {
          setError(true);
        }
      });
    } else {
      audio.pause();
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

  function handleSeekStart() {
    isSeekingRef.current = true;
  }

  function handleSeekEnd() {
    isSeekingRef.current = false;
  }

  function handleSpeedChange(speed: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    setPlaybackRate(speed);
  }

  if (error) {
    return <p className="audio-player-error">تعذّر تحميل الصوت.</p>;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remaining = Math.max(duration - currentTime, 0);

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {imageUrl && (
        <div className="audio-player-cover">
          <img src={imageUrl} alt={title} />
        </div>
      )}

      <div className="audio-player-controls">
        <button type="button" className="audio-player-skip" onClick={() => skip(-REWIND_SECONDS)} aria-label={`الرجوع ${REWIND_SECONDS} ثانية`}>
          <RotateCcw size={24} />
          <span>-{REWIND_SECONDS}</span>
        </button>
        <button type="button" className="audio-player-play" onClick={togglePlay} aria-label={isPlaying ? "إيقاف" : "تشغيل"}>
          {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
        </button>
        <button type="button" className="audio-player-skip" onClick={() => skip(FORWARD_SECONDS)} aria-label={`التقديم ${FORWARD_SECONDS} ثانية`}>
          <RotateCw size={24} />
          <span>+{FORWARD_SECONDS}</span>
        </button>
      </div>

      <div className="audio-player-progress" dir="ltr">
        <span className="audio-player-time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="audio-player-range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          onMouseUp={handleSeekEnd}
          onTouchEnd={handleSeekEnd}
          style={{ background: `linear-gradient(to right, var(--ink) ${progressPercent}%, var(--line) ${progressPercent}%)` }}
          aria-label="موضع التشغيل"
        />
        <span className="audio-player-time">-{formatTime(remaining)}</span>
      </div>

      <div className="audio-player-speeds">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            className={playbackRate === speed ? "audio-player-speed active" : "audio-player-speed"}
            onClick={() => handleSpeedChange(speed)}
          >
            ×{speed}
          </button>
        ))}
      </div>
    </div>
  );
}
