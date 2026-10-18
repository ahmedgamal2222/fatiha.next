"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useI18n } from "@/context/I18nContext";

interface AudioPlayerProps {
  src: string;
  title?: string | null;
  subtitle?: string | null;
  /** نسخة مصغّرة (بلا موجة كبيرة). */
  compact?: boolean;
}

const RATES = [0.75, 1, 1.25, 1.5, 2];

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * مشغّل صوت احترافي للتلاوات — بلا أي مكتبة خارجية.
 * يشمل: تشغيل/إيقاف، شريط تقدّم قابل للسحب، مدة، مستوى صوت، سرعة تشغيل، تكرار،
 * ومؤشر حركة (Equalizer) يتحرك أثناء التشغيل. يعمل في RTL و LTR.
 */
export function AudioPlayer({ src, title, subtitle, compact }: AudioPlayerProps) {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // إعادة الضبط عند تغيير المصدر
  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setFailed(false);
  }, [src]);

  const toggle = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (el.paused) {
        setLoading(true);
        await el.play();
      } else {
        el.pause();
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const seek = (value: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = value;
    setCurrent(value);
  };

  const changeVolume = (value: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = value;
    el.muted = value === 0;
    setVolume(value);
    setMuted(value === 0);
  };

  const toggleMute = () => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  const changeRate = (value: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = value;
    setRate(value);
  };

  const toggleLoop = () => {
    const el = audioRef.current;
    if (!el) return;
    el.loop = !el.loop;
    setLoop(el.loop);
  };

  const progress = duration ? (current / duration) * 100 : 0;
  const rangeStyle = { "--p": `${progress}%` } as CSSProperties;

  return (
    <div className={`fh-audio${compact ? " fh-audio--compact" : ""}${playing ? " is-playing" : ""}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />

      <button
        type="button"
        className="fh-audio__play"
        onClick={() => void toggle()}
        aria-label={playing ? t("Pause") : t("Play")}
        title={playing ? t("Pause") : t("Play")}
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        ) : (
          <i className={`fas ${playing ? "fa-pause" : "fa-play"}`} aria-hidden="true" />
        )}
      </button>

      <div className="fh-audio__body">
        <div className="fh-audio__top">
          <div className="fh-audio__meta">
            <span className="fh-audio__title" title={title || undefined}>
              {title || t("Now playing")}
            </span>
            {subtitle ? <span className="fh-audio__subtitle">{subtitle}</span> : null}
          </div>

          <div className="fh-audio__eq" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
        </div>

        <div className="fh-audio__timeline">
          <span className="fh-audio__time" dir="ltr">{fmt(current)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(current, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="fh-audio__range"
            style={rangeStyle}
            aria-label={t("Audio player")}
            dir="ltr"
          />
          <span className="fh-audio__time" dir="ltr">{fmt(duration)}</span>
        </div>

        <div className="fh-audio__tools">
          <button
            type="button"
            className="fh-audio__tool"
            onClick={toggleMute}
            aria-label={muted ? t("Unmute") : t("Mute")}
            title={muted ? t("Unmute") : t("Mute")}
          >
            <i className={`fas ${muted || volume === 0 ? "fa-volume-xmark" : "fa-volume-high"}`} aria-hidden="true" />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="fh-audio__volume"
            aria-label={t("Volume")}
            dir="ltr"
          />

          <label className="fh-audio__rate">
            <i className="fas fa-gauge-high" aria-hidden="true" />
            <select
              value={rate}
              onChange={(e) => changeRate(Number(e.target.value))}
              aria-label={t("Playback speed")}
              title={t("Playback speed")}
            >
              {RATES.map((r) => (
                <option key={r} value={r}>{r}x</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={`fh-audio__tool${loop ? " is-active" : ""}`}
            onClick={toggleLoop}
            aria-pressed={loop}
            aria-label={t("Repeat")}
            title={t("Repeat")}
          >
            <i className="fas fa-repeat" aria-hidden="true" />
          </button>
        </div>

        {failed ? (
          <p className="fh-audio__error">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            {t("No audio is available for this recitation.")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
