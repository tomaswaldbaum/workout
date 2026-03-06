import { useState } from 'react';
import { Play, ChevronUp } from 'lucide-react';

/**
 * Extracts a YouTube video ID from various URL formats.
 */
function extractVideoId(url: string): string {
  if (!url) return '';
  const shortsMatch = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) return shortsMatch[1];
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return '';
}

/**
 * Inline collapsible video embed for exercises.
 * Collapsed by default; expands to show the YouTube player inline.
 */
export default function InlineVideo({ videoUrl }: { videoUrl?: string }) {
  const [open, setOpen] = useState(false);

  if (!videoUrl) return null;
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return null;

  return (
    <div className="mt-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${
          open
            ? 'bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/30'
            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-pink-300 ring-1 ring-white/10'
        }`}
        title={open ? 'Ocultar video' : 'Ver video de referencia'}
      >
        {open ? (
          <>
            <ChevronUp size={10} />
            Ocultar video
          </>
        ) : (
          <>
            <Play size={9} fill="currentColor" />
            Video
          </>
        )}
      </button>

      {open && (
        <div className="mt-1.5 rounded-lg overflow-hidden bg-black ring-1 ring-white/10 animate-expand">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="Video de referencia"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
