"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import s from "@/app/styles/dashboard.module.css";
import VoicePanel from "@/app/components/VoicePanel";
import { supabaseBrowser } from "@/app/lib/supabaseClient";

type UserMeta = {
  username?: string;
  avatar_url?: string;
  [k: string]: any;
};

type RecentSummary = {
  id: string;
  title: string;
  description: string;
  time: string; // human readable, e.g., "10 minutes ago"
};
export default function Dashboard() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  // auth/session
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>("");
  const [meta, setMeta] = useState<UserMeta>({});

  // ui state
  const [listening, setListening] = useState(false);
  const [micSessions, setMicSessions] = useState(0);
  const toggleListening = async () => {
    const newListeningState = !listening;
    setListening(newListeningState);
    
    // increment mic sessions when opening the panel
    if (newListeningState) {
      const newCount = micSessions + 1;
      setMicSessions(newCount);
      // persist to Supabase user metadata
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.updateUser({
          data: { ...session.user.user_metadata, mic_sessions: newCount },
        });
      }
    }
  };
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // minimal stats state
  const [stats, setStats] = useState({ totalWords: 0, totalSummaries: 0 });
  const [carouselIndex, setCarouselIndex] = useState(0);
  const SLIDES = [
    { title: "Transkrip Cepat", text: "Konversi ucapan menjadi teks secara otomatis.", img: "" },
    { title: "Ringkasan Pintar", text: "Ringkasan singkat dari hasil transkrip.", img: "" },
    { title: "Simpan & Kelola", text: "Akses riwayat rekaman dan ringkasan Anda kapan saja.", img: "" },
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session) {
        router.replace("/login");
        return;
      }
      setEmail(session.user.email || "");
      const userMeta = (session.user.user_metadata as UserMeta) || {};
      setMeta(userMeta);
      // Load mic sessions from user metadata
      setMicSessions(userMeta.mic_sessions || 0);

      // fetch user histories to compute simple stats
      try {
        const { data: histories } = await supabase
          .from("histories")
          .select("original_text, summary_result")
          .eq("user_id", session.user.id);

        if (histories && Array.isArray(histories)) {
          let totalWords = 0;
          let totalSummaries = 0;
          histories.forEach((h: any) => {
            if (h.original_text) totalWords += String(h.original_text).split(/\s+/).filter(Boolean).length;
            if (h.summary_result) totalSummaries += 1;
          });
          setStats({ totalWords, totalSummaries });
        }
      } catch (e) {
        // ignore; keep zeros
        console.warn("Could not fetch histories for stats", e);
      }

      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (!sess) router.replace("/login");
    });

    // (no-op) removed legacy recentSummaries localStorage handling

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileDropdown) {
        const target = event.target as Element;
        if (!target.closest(`.${s.avatar}`)) {
          setShowProfileDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const closeProfileDropdown = () => {
    setShowProfileDropdown(false);
  };

  const username = meta.username || "Faisal";
  const avatar   = meta.avatar_url || "https://i.pravatar.cc/64?img=12";
  const role     = meta.summary_mode === "dokter_hewan" ? "Veterinarian" : meta.summary_mode === "patologi" ? "Pathologist" : "User";

  if (loading) {
    return (
      <div className={s.app}>
        <main className={s.content}>
          <div className={s.card}>Memuat dashboard…</div>
        </main>
      </div>
    );
  }

  return (
    <div className={s.app}>
      {/* SIDEBAR */}
      <aside className={s.sidebar} id="sidebar">
        {/* ... (isi sidebar Anda tetap sama, tidak perlu diubah) ... */}
        <div className={s.sbInner}>
          <div className={s.brand}>
            <Image
              src="/logo_neurabot.jpg" alt="Logo Neurabot" width={40} height={40} className={s.brandImg}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const next = target.nextElementSibling as HTMLElement | null;
                if (next) next.style.display = "grid";
              }}
            />
            <div className={s.brandLogo} style={{ display: "none" }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#07131f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.5 6H8.5L12 2Z"></path><path d="M12 22l-3.5-6h7L12 22Z"></path><path d="M2 12l6-3.5v7L2 12Z"></path><path d="M22 12l-6 3.5v-7L22 12Z"></path></svg>
            </div>
            <div className={s.brandName}>Neurabot</div>
          </div>
          <nav className={s.nav} aria-label="Sidebar">
            <a className={`${s.navItem} ${s.active}`} href="/dashboard"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9,22 9,12 15,12 15,22"></polyline></svg><span>Dashboard</span></a>
            <a className={s.navItem} href="/history"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg><span>History</span></a>
            <a className={s.navItem} href="/settings"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg><span>Settings</span></a>
          </nav>
          <div className={s.sbFooter}>
            <div style={{ opacity: 0.6 }}>© 2025 Neurabot</div>
          </div>
        </div>
      </aside>

      {/* TOPBAR */}
      <header className={s.topbar}>
        {/* ... (isi topbar Anda tetap sama, tidak perlu diubah) ... */}
        <div className={s.tbWrap}>
          <div className={s.leftGroup}>
            <div className={s.search} role="search">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
              <input type="search" placeholder="Search something..." />
            </div>
          </div>
          <div className={s.rightGroup}>
            <button className={s.listenBtn} aria-pressed={listening} onClick={toggleListening}>
              <span className={s.dot} aria-hidden />
              <span className={s.btnLabel}>{listening ? "Close Panel" : "Start Listening"}</span>
            </button>
            <div className={s.avatar} onClick={toggleProfileDropdown}>
              <div className={s.avatarInitial}>{username.charAt(0).toUpperCase()}</div>
              <div className={s.meta}>
                <div className={s.name}>{username}</div>
                <div className={s.role}></div>
              </div>
              {showProfileDropdown && (
                <div className={s.profileDropdown}>
                  <button className={s.dropdownItem} onClick={() => { setShowProfileModal(true); setShowProfileDropdown(false); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Profile</button>
                  <button className={s.dropdownItem} onClick={onLogout}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16,17 21,12 16,7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className={s.content}>
        {/* Tampilan Dashboard Utama */}
        <div className={s.dashboardContainer} style={{ display: listening ? 'none' : 'block' }}>
          {/* ... (seluruh isi dashboard Anda yang sebelumnya ada di dalam {!listening ? (...)}) ... */}
          {/* Simple Stats */}
          <div className={s.topCards}>
            <div className={s.statsCard}>
              <div className={s.cardIcon}>🎤</div>
              <div className={s.cardContent}>
                <h3>Mic Sessions</h3>
                <div className={s.cardValue}>{micSessions}</div>
                <div className={s.cardSubtext}>Jumlah kali panel mikrofon dibuka</div>
              </div>
            </div>
            <div className={s.statsCard}>
              <div className={s.cardIcon}>📝</div>
              <div className={s.cardContent}>
                <h3>Words Transcribed</h3>
                <div className={s.cardValue}>{stats.totalWords.toLocaleString()}</div>
                <div className={s.cardSubtext}>Total kata dari semua transkrip</div>
              </div>
            </div>
            <div className={s.statsCard}>
              <div className={s.cardIcon}>✨</div>
              <div className={s.cardContent}>
                <h3>Summaries Created</h3>
                <div className={s.cardValue}>{stats.totalSummaries}</div>
                <div className={s.cardSubtext}>Jumlah ringkasan yang tersimpan</div>
              </div>
            </div>
          </div>

          {/* Carousel / Promo Slides */}
          <div className={s.carouselSection}>
            <h2>Kenali Aplikasi</h2>
            <div className={s.carousel}>
              <button className={s.carouselBtn} onClick={() => setCarouselIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)} aria-label="Prev">◀</button>
              <div className={s.carouselTrack}>
                {SLIDES.map((slide, idx) => (
                  <div key={idx} className={`${s.carouselSlide} ${idx === carouselIndex ? s.active : ''}`}>
                    <div className={s.slideImage}><div className={s.slideIcon}>{idx === 0 ? '🎙️' : idx === 1 ? '🧾' : '📂'}</div></div>
                    <div className={s.slideBody}>
                      <h3>{slide.title}</h3>
                      <p>{slide.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className={s.carouselBtn} onClick={() => setCarouselIndex((i) => (i + 1) % SLIDES.length)} aria-label="Next">▶</button>
            </div>
            <div className={s.carouselIndicators}>
              {SLIDES.map((_, idx) => (
                <button key={idx} className={`${s.indicator} ${idx === carouselIndex ? s.active : ''}`} onClick={() => setCarouselIndex(idx)} aria-label={`Slide ${idx+1}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Tampilan Voice Panel */}
        <div className={s.voiceWrap} style={{ display: listening ? 'block' : 'none' }}>
          <div className={s.voiceFrame}>
            <VoicePanel />
          </div>
        </div>
        {/* Profile Modal */}
        {showProfileModal && (
          <div className={s.modalBackdrop} onClick={() => setShowProfileModal(false)}>
            <div className={s.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={s.modalHeader}>
                <h2>Profile</h2>
                <button className={s.modalClose} onClick={() => setShowProfileModal(false)}>✕</button>
              </div>
              <div className={s.modalBody}>
                <div className={s.profileSection}>
                  <div className={s.profileInitial}>{username.charAt(0).toUpperCase()}</div>
                  <div className={s.profileInfo}>
                    <div className={s.profileItem}>
                      <label>Nama</label>
                      <p>{username}</p>
                    </div>
                    <div className={s.profileItem}>
                      <label>Email</label>
                      <p>{email}</p>
                    </div>
                    <div className={s.profileItem}>
                      <label>Role</label>
                      <p>{role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}      </main>
    </div>
  );
}