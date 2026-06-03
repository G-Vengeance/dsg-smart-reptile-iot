/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  X,
  Thermometer,
  Maximize2,
  Sparkles,
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Sun
} from 'lucide-react';
import { translations } from '../utils/i18n';

interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrls: string[];
  timestamp: string;
  badge: {
    text: string;
    type: 'success' | 'warn' | 'info' | 'purple';
  };
  tempC: number;
  humidity: number;
  lux: number;
  description: string;
}

interface ObservationGalleryProps {
  tempUnit: 'C' | 'F';
  language?: 'en' | 'id';
}

function ThumbnailSlider({ images, isHovered }: { images: string[]; isHovered: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-all duration-500 ease-out"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      </AnimatePresence>

      {/* Navigation arrows (only visible on hover) */}
      {isHovered && images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 border border-white/10 text-white hover:bg-black/95 hover:scale-105 transition-all z-20 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 border border-white/10 text-white hover:bg-black/95 hover:scale-105 transition-all z-20 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </>
      )}

      {/* Slide indicators / dots */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${currentIndex === idx ? 'bg-cyan-400 w-3' : 'bg-white/45 hover:bg-white/75'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EnlargedSlider({ images, activeIndex, setActiveIndex, isPlaying, setIsPlaying }: {
  images: string[];
  activeIndex: number;
  setActiveIndex: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
}) {
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((activeIndex + 1) % images.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, images, activeIndex, setActiveIndex]);

  const nextSlide = () => {
    setActiveIndex((activeIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setActiveIndex((activeIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl flex items-center justify-center group">

      {/* Decorative scanning/corner frame (cleaner display details) */}
      <div className="absolute inset-4 border border-white/5 rounded-lg pointer-events-none z-10">
        <span className="w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400/60 absolute top-0 left-0" />
        <span className="w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400/60 absolute top-0 right-0" />
        <span className="w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400/60 absolute bottom-0 left-0" />
        <span className="w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400/60 absolute bottom-0 right-0" />
      </div>

      {/* Cross-faded Images */}
      <AnimatePresence mode="wait">
        <motion.img
          key={activeIndex}
          src={images[activeIndex]}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-all"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      </AnimatePresence>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-950/75 border border-white/10 text-white hover:bg-slate-950 hover:scale-105 transition-all z-20 cursor-pointer shadow-lg hover:shadow-cyan-500/10"
          >
            <ChevronLeft className="w-5 h-5 text-cyan-400 shrink-0" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-950/75 border border-white/10 text-white hover:bg-slate-950 hover:scale-105 transition-all z-20 cursor-pointer shadow-lg hover:shadow-cyan-500/10"
          >
            <ChevronRight className="w-5 h-5 text-cyan-400 shrink-0" />
          </button>
        </>
      )}

      {/* Play / Pause Slideshow Control Overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-cyan-300 z-20 flex items-center gap-2.5 select-none shadow-xl">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1.5 text-cyan-300 hover:text-white transition-colors cursor-pointer font-bold uppercase tracking-wider"
        >
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span>{isPlaying ? 'PLAYING AUTOMATIC' : 'SLIDESHOW PAUSED'}</span>
        </button>
        <span className="text-white/10 font-sans">|</span>
        <span className="font-bold tracking-widest text-[#94a3b8]">SLIDE {activeIndex + 1}/{images.length}</span>
      </div>

      {/* Dots navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 z-20 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 shadow-xl">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${activeIndex === idx ? 'bg-cyan-400 w-4' : 'bg-white/40 hover:bg-white/70'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ObservationGallery({ tempUnit, language = 'en' }: ObservationGalleryProps) {
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [modalSlideIndex, setModalSlideIndex] = useState<number>(0);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState<boolean>(true);

  const t = translations[language];

  // Modified photo elements. Each item now represents a category with multiple slides.
  // Gimmicks like 'CCTV / cam' are replaced with a high-fidelity photo gallery of the terrarium & species.
  const galleryItems: GalleryItem[] = [
    {
      id: 'gallery-basking',
      title: language === 'en' ? 'Tropidolaemus wagleri - Adult Female' : 'Tropidolaemus wagleri - Betina Dewasa',
      subtitle: language === 'en' ? 'Relaxing beautifully on branches' : 'Beristirahat santai di dahan tropis',
      imageUrls: [
        '/images/Tropidolaemus_wagleri.jpeg',
        '/images/Tropidolaemus_wagleri2.jpeg'
      ],
      timestamp: language === 'en' ? 'Photoshoot' : 'Photoshoot',
      badge: { text: language === 'en' ? 'Tropidolaemus wagleri' : 'Bandotan candi', type: 'success' },
      tempC: 28.5,
      humidity: 74.0,
      lux: 620,
      description: language === 'en'
        ? 'It has a very distinct triangular head morphology (spear-shaped head) with keeled scales (keeled scales). The color pattern is dominated by a combination of solid black with bright yellow or lime green transverse bands or spots.'
        : 'Memiliki morfologi kepala berbentuk segitiga yang sangat tegas (kepala berbentuk tombak) dengan sisik yang lunas (sisik lunas). Pola warna didominasi oleh kombinasi hitam pekat dengan pita atau bercak transversal berwarna kuning cerah atau hijau limau.',
    },
    {
      id: 'gallery-moisture',
      title: language === 'en' ? 'Tropidolaemus laticinctus' : 'Tropidolaemus laticinctus',
      subtitle: language === 'en' ? 'Broad-banded Temple Pit Viper' : 'Ular Pit Viper Kuil Berpita Lebar',
      imageUrls: [
        '/images/Tropidolaemus_laticinctus.jpeg',
        '/images/Tropidolaemus_laticinctus2.jpeg',
        '/images/Tropidolaemus_laticinctus3.jpeg',
        '/images/Tropidolaemus_laticinctus4.jpeg',
        '/images/Tropidolaemus_laticinctus5.jpeg',
        '/images/Tropidolaemus_laticinctus6.jpeg'
      ],
      timestamp: language === 'en' ? 'Photoshoot' : 'Photoshoot',
      badge: { text: language === 'en' ? 'Viper Candi Berpita Lebar' : 'Viper Candi Berpita Lebar', type: 'info' },
      tempC: 24.0,
      humidity: 92.5,
      lux: 150,
      description: language === 'en'
        ? 'Showing the anterior (front) perspective. The body scale pattern is dominated by a bluish-green (teal/turquoise) color that gradates with light yellow, creating a distinctive row fragment pattern on the dorsolateral region.'
        : 'Menampilkan perspektif anterior (depan). Pola sisik tubuh didominasi oleh warna hijau kebiruan (teal/turquoise) yang bergradasi dengan warna kuning muda, menciptakan pola fragmen baris yang khas pada wilayah dorsolateral.',
    },
    {
      id: 'gallery-feeding',
      title: language === 'en' ? 'Tropidolaemus wagleri - Adult Male' : 'Tropidolaemus wagleri - Jantan Dewasa',
      subtitle: language === 'en' ? 'The exotic temple bandotan snake' : 'Ular bandotan candi yang eksotis',
      imageUrls: [
        '/images/Tropidoleamus_wagleri_jantan.jpeg'
      ],
      timestamp: language === 'en' ? 'Photoshoot' : 'Photoshoot',
      badge: { text: language === 'en' ? 'Tropidolaemus wagleri' : 'Bandotan candi', type: 'warn' },
      tempC: 27.2,
      humidity: 68.0,
      lux: 480,
      description: language === 'en'
        ? 'Dominated by bright green on the dorsal side, complemented by white spots with a reddish/brown stripe pattern along its body, as well as a brick red or brownish post-ocular line (behind the eye).'
        : 'Didominasi oleh warna hijau cerah pada bagian dorsal, dilengkapi dengan bintik-bintik putih berpola garis kemerahan/cokelat di sepanjang tubuhnya, serta garis post-okular (di belakang mata) berwarna merah bata atau kecokelatan.',
    },
    {
      id: 'gallery-details',
      title: language === 'en' ? 'Interior Habitat Details' : 'Keindahan Habitat Tropis',
      subtitle: language === 'en' ? 'Natural woodwork and mossy rest zones' : 'Sudut dahan kayu berlumut alami kandang Midas',
      imageUrls: [
        'https://images.takeshape.io/86ce9525-f5f2-4e97-81ba-54e8ce933da7/dev/b2ac9cc8-f8f9-4255-a5de-c833f1c6ccab/157%20Sulawesi%20montane%20rain%20forests%20-%20Rhett%20Butler.jpg?auto=compress%2Cformat&w=1600',
        'https://images.unsplash.com/photo-1765958798803-64bc56536e54?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80'
      ],
      timestamp: language === 'en' ? 'Bio-design Inspection' : 'Desain Habitat Terintegrasi',
      badge: { text: language === 'en' ? 'Eco system' : 'Ekosistem Alami', type: 'purple' },
      tempC: 25.8,
      humidity: 71.5,
      lux: 320,
      description: language === 'en'
        ? 'Deep interior focus on the terrarium layout, showing the organic composition of branches and custom bioactive subsoil. This layout creates diverse microclimates allowing Midas to thermo-regulate naturally by choosing different zones.'
        : 'Detail sudut terdalam struktur dekorasi kayu dan alas tanah bioaktif tropis di dalam terrarium. Rancangan struktur dahan ini sengaja ditata untuk menciptakan variasi titik suhu (mikroklimat), memudahkan Midas menyelaraskan energi tubuhnya.',
    },
  ];

  const celsiusToUnit = (c: number) => {
    return tempUnit === 'F' ? (c * 1.8) + 32 : c;
  };

  const badgeStyles = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.25)]',
    warn: 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
    info: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.25)]',
    purple: 'bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.25)]',
  };

  return (
    <div id="enclosure-observation-gallery-section" className="col-span-1 w-full flex flex-col gap-5 mt-6">

      {/* Premium Gallery Header - No CCTV/Camera gimmicks anymore */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 to-blue-500/5 border border-cyan-500/35 relative overflow-hidden group shadow-[0_0_15px_rgba(6,182,212,0.15)] select-none shrink-0">
            <Camera className="w-5 h-5 text-cyan-400 relative z-10 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] tracking-widest text-cyan-400 font-bold uppercase font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 select-none">
                {language === 'en' ? 'PHOTO ALBUM ACTIVITY' : 'GALERI ALBUM FOTO'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 select-none" />
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight font-sans uppercase mt-0.5">
              {t.galleryTitle}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono tracking-wide mt-0.5 leading-relaxed">
              {language === 'en'
                ? 'High-fidelity dynamic snapshots capturing beautiful viewpoints of terrarium interior and Midas life'
                : 'Momen visual pilihan resolusi tinggi yang menampilkan sudut estetis terrarium serta keindahan Midas'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse select-none" />
          <span className="text-[10px] font-bold text-emerald-400 tracking-widest font-mono uppercase bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/25 shadow-sm select-none">
            {language === 'en' ? '4 Photo Categories' : '4 Kategori Foto'}
          </span>
        </div>
      </div>

      {/* Gallery Cards Grid - Styled with Framer Motion hover animations and multi-image automated sliding inside cards */}
      <div id="observation-grid-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center justify-center">
        {galleryItems.map((item) => {
          const isHovered = hoveredId === item.id;
          return (
            <motion.div
              key={item.id}
              id={`gallery-card-${item.id}`}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                setActivePhoto(item);
                setModalSlideIndex(0);
                setIsPlayingSlideshow(true);
              }}
              className="group relative w-full max-w-[380px] sm:max-w-none rounded-2xl border border-white/10 bg-slate-900/30 p-3 backdrop-blur-md hover:border-cyan-500/40 hover:bg-slate-900/50 hover:shadow-[0_4px_22px_rgba(6,182,212,0.15)] transition-all duration-300 cursor-pointer shadow-md select-none overflow-hidden flex flex-col justify-between"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                {/* Image Frame containing the customized Thumbnail Slider with smooth transitions */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/60 border border-white/5 shadow-inner">

                  <ThumbnailSlider images={item.imageUrls} isHovered={isHovered} />

                  {/* Clean Non-CCTV Badge Displays */}
                  <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg border text-[9px] font-mono font-bold uppercase transition-all duration-200 z-10 ${badgeStyles[item.badge.type]}`}>
                    {item.badge.text}
                  </div>

                  {/* Hover visual cue panel overlay */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        className="absolute inset-x-0 bottom-0 top-0 bg-slate-950/30 backdrop-blur-[1px] flex items-center justify-center text-white pointer-events-none z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-950/85 border border-cyan-500/35 shadow-[0_8px_24px_rgba(0,0,0,0.65)]">
                          <Maximize2 className="w-4 h-4 text-cyan-400" />
                          <span className="text-[9px] font-mono font-bold text-cyan-300 uppercase tracking-widest leading-none">
                            {t.bukaGambar}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Title and Descriptions */}
                <div className="mt-3.5 px-0.5">
                  <div className="flex items-center justify-between text-xs font-bold font-sans text-slate-200 group-hover:text-cyan-300 transition-colors leading-relaxed">
                    <span className="truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono font-medium leading-normal">
                    <span>{item.subtitle}</span>
                  </div>
                </div>
              </div>

              {/* Micro Environmental statistics bar of that snapshot zone */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-[10px] font-mono text-slate-400 select-none">
                <span className="flex items-center gap-1 text-slate-300 font-medium shrink-0">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-500/80 shrink-0" />
                  {celsiusToUnit(item.tempC).toFixed(1)}°{tempUnit}
                </span>
                <span className="flex items-center gap-1 text-slate-300 font-medium shrink-0">
                  <Droplets className="w-3.5 h-3.5 text-sky-450/85 shrink-0" />
                  {item.humidity}%
                </span>
                <span className="flex items-center gap-1 text-slate-300 font-medium shrink-0">
                  <Sun className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                  {item.lux}lx
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Multi-slide Optical Details Overlay Modal (Clean Minimal Art Gallery style) */}
      <AnimatePresence>
        {activePhoto && (
          <div
            id="gallery-observation-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-slate-950/85 select-none overflow-y-auto"
            onClick={() => setActivePhoto(null)}
          >
            {/* Click-away backdrop */}
            <div className="absolute inset-0" />

            <motion.div
              id="gallery-observation-modal-content"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-slate-950/95 border border-white/10 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col lg:flex-row gap-6 md:gap-8 max-h-[95vh] lg:max-h-[85vh] overflow-y-auto z-10"
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
            >
              {/* Close Button */}
              <button
                id="close-observation-modal"
                onClick={() => setActivePhoto(null)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer z-50 hover:shadow-[0_0_10px_rgba(255,255,255,0.15)]"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>

              {/* Layout Col 1: Large smooth slider */}
              <div className="flex-1 flex flex-col gap-4 min-w-[280px]">
                <EnlargedSlider
                  images={activePhoto.imageUrls}
                  activeIndex={modalSlideIndex}
                  setActiveIndex={setModalSlideIndex}
                  isPlaying={isPlayingSlideshow}
                  setIsPlaying={setIsPlayingSlideshow}
                />

                {/* Thumbnails list inside modal */}
                {activePhoto.imageUrls.length > 1 && (
                  <div className="flex items-center gap-2 bg-slate-900/30 p-2.5 rounded-2xl border border-white/5">
                    {activePhoto.imageUrls.map((thumbUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setModalSlideIndex(idx);
                          setIsPlayingSlideshow(false); // Pause auto slide when clicked manually
                        }}
                        className={`relative aspect-[4/3] w-16 md:w-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${modalSlideIndex === idx
                          ? 'border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.35)] scale-102'
                          : 'border-transparent hover:border-white/20'
                          }`}
                      >
                        <img src={thumbUrl} alt="" className="w-full h-full object-cover object-center" />
                      </button>
                    ))}
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest pl-2">
                      {t.panLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Layout Col 2: Telemetry analysis and detailed moment logs */}
              <div className="flex-1 flex flex-col justify-between min-w-[285px] text-left">
                <div className="flex flex-col gap-4">

                  {/* Category Status & Indicators */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-[9px] border font-bold font-mono rounded-lg uppercase leading-none ${badgeStyles[activePhoto.badge.type]}`}>
                        {activePhoto.badge.text}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        {t.signalSecured}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight mt-2.5 font-sans leading-tight">
                      {activePhoto.title}
                    </h3>
                    <p className="text-[11px] text-slate-450 font-mono mt-1 flex items-center gap-1 mt-1.5 select-text">
                      <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {activePhoto.subtitle}
                    </p>
                  </div>

                  {/* Environmental Snapshot conditions of the specific active zone */}
                  <div className="grid grid-cols-3 gap-3.5 bg-slate-950/60 p-4 rounded-2xl border border-white/5 select-none">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-bold font-mono">{language === 'en' ? 'TEMP' : 'Suhu'}</span>
                      <span className="text-sm font-black text-cyan-300 font-mono mt-1">
                        {celsiusToUnit(activePhoto.tempC).toFixed(1)}°{tempUnit}
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-3.5">
                      <span className="text-[9px] text-slate-500 uppercase font-bold font-mono">{language === 'en' ? 'HUMID' : 'Kelembapan'}</span>
                      <span className="text-sm font-black text-sky-400 font-mono mt-1">
                        {activePhoto.humidity}%
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-3.5">
                      <span className="text-[9px] text-slate-500 uppercase font-bold font-mono">{language === 'en' ? 'LIGHT' : 'Cahaya'}</span>
                      <span className="text-sm font-black text-amber-400 font-mono mt-1">
                        {activePhoto.lux} lx
                      </span>
                    </div>
                  </div>

                  {/* Biological Diagnosis breakdown text block */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-slate-300 font-mono">
                      {language === 'en' ? 'TERRARIUM ECO-BIOLOGY REPORT' : 'Laporan Analisis Ekologi Kandang'}
                    </div>
                    <p className="text-[11.5px] text-slate-350 font-sans leading-relaxed bg-black/45 p-4 rounded-2xl border border-white/5 text-justify select-text select-text focus:outline-none">
                      {activePhoto.description}
                    </p>
                  </div>
                </div>

                {/* Modal actions footer button bar */}
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 select-none">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{activePhoto.timestamp}</span>
                  </div>
                  <button
                    id="btn-confirm-snapshot-ok"
                    onClick={() => setActivePhoto(null)}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/35 hover:border-cyan-500/60 text-cyan-300 hover:text-white rounded-xl text-xs font-mono font-bold tracking-wider cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                  >
                    {t.closeBtn}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
