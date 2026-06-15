import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Trash2, Calendar, User } from 'lucide-react';

interface Comment {
  id: string;
  name: string;
  text: string;
  timestamp: string;
}

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'c-default-1',
    name: 'Keeper DSG',
    text: 'Midas terlihat tenang menggelung di dahan kayu dekat pemanas sejak pagi ini.',
    timestamp: '05/06/2026, 09:30:15',
  },
  {
    id: 'c-default-2',
    name: 'Riset DSG',
    text: 'Selesai memberi makan mencit berukuran sedang. Proses pencernaan berjalan normal.',
    timestamp: '04/06/2026, 18:45:22',
  },
  {
    id: 'c-default-3',
    name: 'Teknisi Kandang',
    text: 'Kelembapan sempat turun ke 60% siang hari, namun semprotan otomatis langsung menstabilkannya kembali.',
    timestamp: '04/06/2026, 14:12:08',
  },
];

export default function CommentSection() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputName, setInputName] = useState('');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dsg_terrarium_comments');
    if (saved) {
      try {
        setComments(JSON.parse(saved));
      } catch (e) {
        setComments(DEFAULT_COMMENTS);
      }
    } else {
      setComments(DEFAULT_COMMENTS);
      localStorage.setItem('dsg_terrarium_comments', JSON.stringify(DEFAULT_COMMENTS));
    }
  }, []);

  // Save to localStorage
  const saveComments = (newComments: Comment[]) => {
    setComments(newComments);
    localStorage.setItem('dsg_terrarium_comments', JSON.stringify(newComments));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      name: inputName.trim() || 'Pengamat Umum',
      text: inputText.trim(),
      timestamp: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };

    const updated = [newComment, ...comments];
    saveComments(updated);
    setInputText('');
  };

  const handleDeleteComment = (id: string) => {
    const updated = comments.filter((c) => c.id !== id);
    saveComments(updated);
  };

  return (
    <div
      id="observational-comments-section"
      className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] backdrop-blur-md p-4 sm:p-6 shadow-[var(--shadow-card)] transition-all duration-300 w-full flex flex-col gap-5 mt-6 text-[var(--text-primary)] select-none"
    >
      {/* Title */}
      <div className="flex items-center gap-3.5 border-b border-[var(--border-card)] pb-4">
        <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm shrink-0">
          <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        </div>
        <div className="text-left">
          <span className="text-[9px] tracking-widest text-emerald-700 dark:text-emerald-400 font-bold uppercase font-mono bg-emerald-500/5 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
            CATATAN HARIAN & DISKUSI
          </span>
          <h3 className="text-base font-extrabold tracking-tight font-sans uppercase mt-0.5">
            Komentar & Pengamatan Ular
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-0.5 leading-relaxed font-medium">
            Tulis catatan kondisi harian atau aktivitas Midas secara manual di bawah ini
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleAddComment} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Nama Pengamat (contoh: Keeper Midas)"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-emerald-500/40 focus:shadow-sm font-sans transition-all duration-300"
            />
          </div>
        </div>

        <div className="relative">
          <textarea
            placeholder="Tulis pengamatan baru tentang ular atau kandang..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={2}
            className="w-full bg-[var(--bg-app)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-emerald-500/40 focus:shadow-sm resize-none font-sans transition-all duration-300"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-all duration-250 cursor-pointer flex items-center gap-2 font-sans text-xs font-bold shadow-sm active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            Tambah Catatan
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-1 text-left">
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-start justify-between gap-4 p-3.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-app)] hover:border-emerald-500/10 transition-all duration-300"
            >
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sans font-bold text-xs text-[var(--text-primary)] truncate">{comment.name}</span>
                  <span className="text-[9px] text-[var(--text-secondary)] font-mono flex items-center gap-1 font-bold">
                    <Calendar className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                    {comment.timestamp}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed break-words whitespace-pre-wrap select-text font-medium">
                  {comment.text}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteComment(comment.id)}
                className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 text-zinc-400 dark:text-zinc-500 hover:text-rose-700 dark:hover:text-rose-400 transition-all cursor-pointer shrink-0"
                title="Hapus Catatan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center text-[var(--text-secondary)] py-6 font-sans text-xs italic font-medium">
            Belum ada catatan pengamatan. Silakan tambah catatan di atas.
          </div>
        )}
      </div>
    </div>
  );
}
