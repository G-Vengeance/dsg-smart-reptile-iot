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

  // Load from localStorage on mount
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

  // Save to localStorage when comments change
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
      className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-6 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] w-full flex flex-col gap-5 mt-6 select-none"
    >
      {/* Title */}
      <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
        <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-blue-500/5 border border-emerald-500/35 relative overflow-hidden group shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
          <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0" />
        </div>
        <div className="text-left">
          <span className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
            CATATAN HARIAN & DISKUSI
          </span>
          <h3 className="text-base font-extrabold text-white tracking-tight font-sans uppercase mt-0.5">
            Komentar & Pengamatan Ular
          </h3>
          <p className="text-[11px] text-slate-400 font-mono tracking-wide mt-0.5 leading-relaxed">
            Tulis catatan kondisi harian atau aktivitas Midas secara manual di bawah ini
          </p>
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleAddComment} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Nama Pengamat (contoh: Keeper Midas)"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 focus:shadow-[0_0_10px_rgba(16,185,129,0.1)] font-sans"
            />
          </div>
        </div>

        <div className="relative">
          <textarea
            placeholder="Tulis pengamatan baru tentang ular atau kandang..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={2}
            className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 focus:shadow-[0_0_10px_rgba(16,185,129,0.1)] resize-none font-sans"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-500/20 text-emerald-300 hover:text-white transition-all duration-200 cursor-pointer flex items-center gap-2 font-mono text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-98"
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
              className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-white/5 bg-slate-900/30 hover:border-white/10 transition-colors"
            >
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sans font-bold text-xs text-slate-200 truncate">{comment.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-600" />
                    {comment.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed break-words whitespace-pre-wrap select-text">
                  {comment.text}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteComment(comment.id)}
                className="p-1.5 rounded-lg border border-transparent hover:border-red-500/20 hover:bg-red-950/20 text-slate-500 hover:text-red-400 transition-all cursor-pointer shrink-0"
                title="Hapus Catatan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center text-slate-500 py-6 font-sans text-xs italic">
            Belum ada catatan pengamatan. Silakan tambah catatan di atas.
          </div>
        )}
      </div>
    </div>
  );
}
