"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PlayableTrack = {
  _id: string;
  slug: string;
  title: string;
  avatar: string;
  audio: string | null;
  singer: { _id?: string; fullName: string; slug?: string } | null;
};
type RepeatMode = "off" | "all" | "one";

type PlayerContextValue = {
  track: PlayableTrack | null;
  queue: PlayableTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  recommendationsLoading: boolean;
  playSong: (song: PlayableTrack) => void;
  playAt: (index: number) => void;
  togglePlay: () => void;
  nextSong: () => void;
  previousSong: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  seekTo: (seconds: number) => void;
  changeVolume: (value: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

type ListenSample = {
  version: number;
  slug: string;
  seconds: number;
  playId: string | null;
  started: boolean;
  counted: boolean;
  sending: boolean;
  previousMedia: number | null;
  previousWall: number | null;
  nextAttemptAt: number;
};
let sampleSeq = 0;
function freshSample(slug: string): ListenSample {
  return {
    version: ++sampleSeq, slug, seconds: 0, playId: null,
    started: false, counted: false, sending: false,
    previousMedia: null, previousWall: null, nextAttemptAt: 0,
  };
}

function shuffleTail(tracks: PlayableTrack[], from: number): PlayableTrack[] {
  const head = tracks.slice(0, from);
  const tail = tracks.slice(from);
  for (let i = tail.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tail[i], tail[j]] = [tail[j], tail[i]];
  }
  return [...head, ...tail];
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentRef = useRef<PlayableTrack | null>(null);
  const queueRef = useRef<PlayableTrack[]>([]);
  const indexRef = useRef(-1);
  const shuffleRef = useRef(false);
  const repeatRef = useRef<RepeatMode>("off");
  const loadSeqRef = useRef(0);
  const listenRef = useRef<ListenSample>(freshSample(""));

  const [track, setTrack] = useState<PlayableTrack | null>(null);
  const [queue, setQueue] = useState<PlayableTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const resetDelta = useCallback(() => {
    listenRef.current.previousMedia = null;
    listenRef.current.previousWall = null;
  }, []);

  const setQueueValue = useCallback((list: PlayableTrack[]) => {
    queueRef.current = list;
    setQueue(list);
  }, []);

  const startTrack = useCallback((song: PlayableTrack) => {
    const audio = audioRef.current;
    if (!audio || !song.audio) return;
    currentRef.current = song;
    listenRef.current = freshSample(song.slug);
    setTrack(song);
    setCurrentTime(0);
    setDuration(0);
    audio.pause();
    audio.src = song.audio;
    audio.load();
    audio.volume = volume;
    void audio.play().catch((err) => console.warn("[player] play blocked", err));
  }, [volume]);

  const loadRecommendations = useCallback(async (song: PlayableTrack, seq: number) => {
    setRecommendationsLoading(true);
    try {
      const response = await fetch(
        `/api/listening/next?currentSongId=${encodeURIComponent(song._id)}&limit=15`,
        { credentials: "same-origin", cache: "no-store" }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json() as { data?: PlayableTrack[] };
      if (loadSeqRef.current !== seq) return;
      const known = new Set([song._id]);
      const suggested = (result.data || []).filter(s => {
        if (!s?._id || !s.audio || known.has(s._id)) return false;
        known.add(s._id);
        return true;
      });
      const list = [song, ...suggested];
      setQueueValue(shuffleRef.current ? shuffleTail(list, 1) : list);
      indexRef.current = 0;
    } catch (error) {
      console.error("[player/recommendations]", error);
    } finally {
      if (loadSeqRef.current === seq) setRecommendationsLoading(false);
    }
  }, [setQueueValue]);

  const playSong = useCallback((song: PlayableTrack) => {
    if (!song.audio) return;
    if (currentRef.current?._id === song._id && currentRef.current.audio === song.audio) {
      const a = audioRef.current;
      if (a?.paused) {
        if (a.ended) listenRef.current = freshSample(song.slug);
        void a.play().catch(console.error);
      }
      return;
    }
    const seq = ++loadSeqRef.current;
    setQueueValue([song]);
    indexRef.current = 0;
    startTrack(song);
    void loadRecommendations(song, seq);
  }, [loadRecommendations, setQueueValue, startTrack]);

  const playAt = useCallback((index: number) => {
    const selected = queueRef.current[index];
    if (!selected?.audio) return;
    indexRef.current = index;
    startTrack(selected);
  }, [startTrack]);

  const nextSong = useCallback(() => {
    const songs = queueRef.current;
    if (!songs.length) return;
    const next = indexRef.current + 1;
    if (next < songs.length) playAt(next);
    else if (repeatRef.current === "all") playAt(0);
  }, [playAt]);

  const previousSong = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      if (listenRef.current.counted && currentRef.current) listenRef.current = freshSample(currentRef.current.slug);
      a.currentTime = 0;
      resetDelta();
      return;
    }
    if (indexRef.current > 0) playAt(indexRef.current - 1);
    else if (a) { a.currentTime = 0; resetDelta(); }
  }, [playAt, resetDelta]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !currentRef.current) return;
    if (a.paused) {
      if (a.ended && currentRef.current) listenRef.current = freshSample(currentRef.current.slug);
      void a.play().catch(console.error);
    } else a.pause();
  }, []);

  const toggleShuffle = useCallback(() => {
    const next = !shuffleRef.current;
    shuffleRef.current = next;
    setShuffle(next);
    if (next && queueRef.current.length > indexRef.current + 2) {
      setQueueValue(shuffleTail(queueRef.current, indexRef.current + 1));
    }
  }, [setQueueValue]);

  const cycleRepeat = useCallback(() => {
    const next: RepeatMode = repeatRef.current === "off" ? "all" : repeatRef.current === "all" ? "one" : "off";
    repeatRef.current = next;
    setRepeat(next);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(seconds) || !Number.isFinite(a.duration)) return;
    resetDelta(); // Tua không được tính thành thời gian nghe.
    a.currentTime = Math.max(0, Math.min(seconds, a.duration));
    setCurrentTime(a.currentTime);
  }, [resetDelta]);

  const changeVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value));
    setVolume(next);
    if (audioRef.current) audioRef.current.volume = next;
  }, []);

  const finishListenSession = useCallback(() => {
    const sample = listenRef.current;
    if (sample.counted || sample.sending || sample.seconds < 30 || !sample.playId || performance.now() < sample.nextAttemptAt) return;
    sample.sending = true;
    const version = sample.version;
    void fetch("/api/listening/complete", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playId: sample.playId }),
    }).then(async response => {
      if (response.status === 425) {
        const json = await response.json() as { retryAfterMs?: number };
        const retryMs = Math.max(1000, json.retryAfterMs || 1500);
        sample.nextAttemptAt = performance.now() + retryMs;
        window.setTimeout(() => {
          if (listenRef.current.version === version) finishListenSession();
        }, retryMs + 50);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (listenRef.current.version === version) sample.counted = true;
    }).catch(error => {
      console.error("[listen/complete]", error);
      sample.nextAttemptAt = performance.now() + 5000;
    }).finally(() => { sample.sending = false; });
  }, []);

  const startListenSession = useCallback(() => {
    const song = currentRef.current;
    const sample = listenRef.current;
    if (!song || sample.started || !song.audio) return;
    sample.started = true;
    const version = sample.version;
    void fetch("/api/listening/start", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId: song._id }),
    }).then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json() as { playId: string };
      if (listenRef.current.version === version) {
        listenRef.current.playId = result.playId;
        // Trường hợp request khởi tạo đến muộn hoặc bài vừa kết thúc.
        window.setTimeout(() => finishListenSession(), 0);
      }
    }).catch(error => console.error("[listen/start]", error));
  }, [finishListenSession]);

  const onTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    const song = currentRef.current;
    if (!a || !song) return;
    setCurrentTime(a.currentTime);
    const sample = listenRef.current;
    if (sample.slug !== song.slug || sample.counted) return;
    if (a.paused || a.seeking || a.ended || a.readyState < 2) { resetDelta(); return; }
    const wall = performance.now();
    const media = a.currentTime;
    if (sample.previousMedia !== null && sample.previousWall !== null) {
      const mediaDelta = media - sample.previousMedia;
      const wallDelta = (wall - sample.previousWall) / 1000;
      const rate = a.playbackRate > 0 ? a.playbackRate : 1;
      if (mediaDelta > 0 && wallDelta > 0 && mediaDelta <= wallDelta * rate + 0.5) {
        sample.seconds += Math.min(wallDelta, mediaDelta / rate);
      }
    }
    sample.previousMedia = media;
    sample.previousWall = wall;
    if (sample.seconds >= 30) finishListenSession();
  }, [finishListenSession, resetDelta]);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    resetDelta();
    if (repeatRef.current === "one" && currentRef.current) {
      const a = audioRef.current;
      if (!a) return;
      listenRef.current = freshSample(currentRef.current.slug);
      a.currentTime = 0;
      void a.play().catch(console.error);
    } else {
      nextSong();
    }
  }, [nextSong, resetDelta]);

  return (
    <PlayerContext.Provider value={{
      track, queue, isPlaying, currentTime, duration, volume, shuffle, repeat, recommendationsLoading,
      playSong, playAt, togglePlay, nextSong, previousSong, toggleShuffle, cycleRepeat, seekTo, changeVolume,
    }}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onDurationChange={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onPlay={() => { setIsPlaying(true); resetDelta(); startListenSession(); }}
        onPause={() => { setIsPlaying(false); resetDelta(); }}
        onWaiting={resetDelta}
        onSeeking={resetDelta}
        onSeeked={resetDelta}
        onRateChange={resetDelta}
        onEnded={onEnded}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("usePlayer phải được gọi trong PlayerProvider");
  return value;
}
