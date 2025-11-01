// src/components/SearchBar.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Mic, Loader2 } from 'lucide-react';

type SpeechReco =
  | (Window & typeof globalThis & {
      webkitSpeechRecognition?: any;
      SpeechRecognition?: any;
    })
  | undefined;

interface SearchBarProps {
  /** Seed the input when mounting (e.g., from URL or last query) */
  initialQuery?: string;

  /**
   * Debounced search callback (fires ~300ms after user stops typing).
   * Use this to call api.listProducts({ search: q }).
   */
  onSearch?: (q: string) => void;

  /**
   * Submit callback (fires on Enter or clicking the left search button).
   * Also useful to force a search immediately.
   */
  onSubmit?: (q: string) => void;

  /** Optional placeholder override */
  placeholder?: string;

  /** External loading state to show spinner in the bar */
  isSearching?: boolean;
}

export function SearchBar({
  initialQuery = '',
  onSearch,
  onSubmit,
  placeholder = 'Search for milk, rice, vegetables...',
  isSearching = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [listening, setListening] = useState(false);

  // ---- Debounce ----
  const debounceMs = 300;
  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (onSearch) onSearch(debouncedQuery.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // ---- Submit handler ----
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (onSubmit) onSubmit(q);
    // Also trigger onSearch immediately (nice UX)
    if (onSearch) onSearch(q);
  };

  // ---- Voice search (Web Speech API) ----
  const recogRef = useRef<any>(null);
  const hasSpeech = useMemo(() => {
    const w = (window as SpeechReco) || undefined;
    return !!(w && (w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const toggleMic = () => {
    if (!hasSpeech) return; // no-op if not supported

    if (listening) {
      try {
        recogRef.current?.stop?.();
      } catch {}
      setListening(false);
      return;
    }

    const w = window as any;
    const Recog = w.SpeechRecognition || w.webkitSpeechRecognition;
    const recog = new Recog();
    recog.lang = 'en-IN';
    recog.interimResults = true;
    recog.continuous = false;

    recog.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscript += res[0].transcript;
        }
      }
      if (finalTranscript) {
        const next = `${query ? query + ' ' : ''}${finalTranscript}`.trim();
        setQuery(next);
      }
    };

    recog.onerror = () => {
      setListening(false);
    };
    recog.onend = () => {
      setListening(false);
      // fire immediate search after voice input stops
      handleSubmit();
    };

    try {
      recogRef.current = recog;
      recog.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="bg-white rounded-full shadow-md flex items-center px-3 py-2 gap-2">
        <button
          type="submit"
          aria-label="Search"
          className="p-2 hover:bg-purple-50 rounded-full transition-colors"
        >
          <Search className="w-5 h-5 text-gray-500" />
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 outline-none text-gray-700 placeholder:text-gray-400 bg-transparent py-1"
          autoComplete="off"
        />

        {isSearching ? (
          <span className="p-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#3D3B6B]" />
          </span>
        ) : (
          <button
            type="button"
            onClick={toggleMic}
            disabled={!hasSpeech}
            className={`p-2 rounded-full transition-colors ${
              hasSpeech
                ? listening
                  ? 'bg-[#3D3B6B]/10'
                  : 'hover:bg-purple-50'
                : 'opacity-50 cursor-not-allowed'
            }`}
            aria-pressed={listening}
            aria-label="Voice search"
            title={hasSpeech ? 'Voice search' : 'Voice search not supported in this browser'}
          >
            <Mic
              className={`w-5 h-5 ${
                listening ? 'text-[#3D3B6B]' : 'text-[#3D3B6B]'
              }`}
            />
          </button>
        )}
      </div>

      {/* Optional quick filters row (example stub, easy to expand later) */}
      {/* <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
        {['Milk', 'Rice', 'Vegetables', 'Bread', 'Yogurt'].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              setQuery(chip);
              // fire immediately on chip click
              if (onSearch) onSearch(chip);
              if (onSubmit) onSubmit(chip);
            }}
            className="px-3 py-1.5 rounded-full bg-white border-2 border-[#3D3B6B] text-[#3D3B6B] text-sm whitespace-nowrap hover:bg-purple-50 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div> */}
    </form>
  );
}

/** Small debounce hook (no external deps) */
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
