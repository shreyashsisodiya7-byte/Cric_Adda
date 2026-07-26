import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

// ── Google Fonts ──────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
if (!document.head.querySelector(`link[href="${fontLink.href}"]`))
  document.head.appendChild(fontLink);

// ── Simple scroll-triggered fade-in hook ─────────────────────────────────────
function useFadeIn(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const ROLES = [
  {
    icon: "🏏",
    title: "Cricket Player",
    accent: "#d1fae5",
    accentText: "#065f46",
    accentBorder: "#a7f3d0",
    desc: "Register as a player, build your profile with stats, set your availability & fee, and get discovered by team owners looking to book talent for their events.",
    perks: [
      "Create your cricket profile",
      "Set your own fee & availability",
      "Accept or reject booking requests",
      "Track your match history & stats",
    ],
  },
  {
    icon: "🏟️",
    title: "Team Owner",
    accent: "#dbeafe",
    accentText: "#1e40af",
    accentBorder: "#bfdbfe",
    desc: "Browse and filter players by role, city, and availability. Send booking requests, negotiate, and confirm players for your cricket events — all in one place.",
    perks: [
      "Browse hundreds of players",
      "Filter by role, city & fee",
      "Send booking requests instantly",
      "Manage all bookings in one dashboard",
    ],
  },
];

const HOW_TO_BOOK = [
  { step: "01", icon: "🔍", title: "Find a Player", desc: "Go to Find Players from the navbar. Use filters to narrow by role (Batsman, Bowler, All-Rounder), city, or fee range." },
  { step: "02", icon: "👤", title: "View Their Profile", desc: "Click any player card to see their full profile — stats, availability calendar, fee, and about section." },
  { step: "03", icon: "📅", title: "Pick a Date", desc: "Check the player's availability calendar and select a date that works for your event." },
  { step: "04", icon: "📝", title: "Send a Booking Request", desc: "Fill in your event name, location, type (match/practice/tournament), and a message for the player. Hit Book." },
  { step: "05", icon: "⏳", title: "Wait for Confirmation", desc: "The player gets notified and can accept or reject. You'll see a live status update on your Bookings page." },
  { step: "06", icon: "✅", title: "Booking Confirmed!", desc: "Once accepted, the booking is locked in. You can message the player directly to coordinate further details." },
];

const FEATURES = [
  { icon: "💬", title: "Real-time Messaging", desc: "Chat directly with players or owners after a booking. No need to share personal numbers — everything stays in-app." },
  { icon: "🔔", title: "Live Notifications", desc: "Get notified the moment a booking request arrives, is accepted, or rejected. Never miss an update." },
  { icon: "📊", title: "Player Stats", desc: "Every player profile shows matches played, runs scored, and wickets taken. Make data-driven decisions when picking your squad." },
  { icon: "🗓️", title: "Availability Calendar", desc: "Players mark which dates they're free. Owners can instantly see if a player is available for their event date." },
  { icon: "🏅", title: "Star Ratings", desc: "Players are rated out of 5 stars based on their performance stats — making it easy to spot top talent at a glance." },
  { icon: "🔒", title: "Secure & Private", desc: "JWT-authenticated accounts mean your data and bookings are fully secure. Only you can see your booking history." },
];

const COMING_SOON = [
  { icon: "🏆", title: "Tournament Management", desc: "Create and manage cricket tournaments. Set formats, brackets, and invite teams. Track scores and standings live." },
  { icon: "🎟️", title: "Slot Booking for Tournaments", desc: "Players will be able to register themselves for open tournament slots — no owner needed. Just find a tournament and join." },
  { icon: "💳", title: "In-App Payments", desc: "Pay player fees directly through the app with UPI, cards, or net banking. No more off-platform transfers." },
  { icon: "⭐", title: "Player Reviews", desc: "After events, owners can leave reviews and ratings for players they've booked, building a trust score over time." },
];

const FAQS = [
  { q: "Is CricAdda free to use?", a: "Yes — creating an account and browsing players is completely free. Booking fees are set by the players themselves." },
  { q: "Can I be both a Player and an Owner?", a: "Currently your account type is set during signup. If you want to switch, update your profile type from your Profile page." },
  { q: "What if a player cancels after confirming?", a: "The booking status will update to cancelled and you'll be notified. You can then search and rebook another player." },
  { q: "How do I message a player?", a: "Once a booking request is sent, a conversation thread opens automatically. Go to Messages in the navbar to chat." },
  { q: "How are player fees decided?", a: "Each player sets their own fee on their profile. There's no platform commission right now — what you see is what you pay." },
  { q: "Can I edit my profile after signing up?", a: "Yes — go to your Profile page to update your photo, bio, role, city, fee, availability, and stats anytime." },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function HowItWorks() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const token = localStorage.getItem("token");

  const S = {
    page: {
      minHeight: "100vh", background: "#f4f7fb",
      fontFamily: "'DM Sans', sans-serif", color: "#0a1628",
      overflowX: "hidden", paddingTop: 64,
    },

    // ── Hero ──
    hero: {
      background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 55%,#0f2d1e 100%)",
      padding: "80px 2.5rem 88px", textAlign: "center", position: "relative", overflow: "hidden",
    },
    heroBg1: { position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(circle, rgba(244,185,66,0.08) 0%, transparent 70%)", pointerEvents: "none" },
    heroBg2: { position: "absolute", top: 40, left: 60, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" },
    heroBg3: { position: "absolute", top: 20, right: 60, width: 200, height: 200, borderRadius: "50%", background: "rgba(244,185,66,0.04)", pointerEvents: "none" },
    eyebrow: {
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
      color: "#f4b942", fontSize: 12, fontWeight: 600, letterSpacing: "1.5px",
      padding: "6px 16px", borderRadius: 20, marginBottom: 24, textTransform: "uppercase",
    },
    heroTitle: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: "clamp(48px, 8vw, 80px)",
      color: "#fff", lineHeight: 1, marginBottom: 20, letterSpacing: 2,
    },
    heroSub: {
      fontSize: 18, color: "rgba(255,255,255,0.65)",
      maxWidth: 540, margin: "0 auto 36px", lineHeight: 1.7,
    },
    heroCtas: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" },
    btnGold: {
      background: "#f4b942", color: "#0a1628", border: "none",
      padding: "14px 36px", borderRadius: 10, fontWeight: 700, fontSize: 16,
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.2s",
    },
    btnOutline: {
      background: "transparent", color: "#fff",
      border: "1.5px solid rgba(255,255,255,0.4)",
      padding: "14px 36px", borderRadius: 10, fontWeight: 600, fontSize: 16,
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s",
    },

    // ── Section commons ──
    section: { padding: "80px 2.5rem", maxWidth: 1100, margin: "0 auto" },
    sectionAlt: { background: "#eaf2ff", padding: "80px 2.5rem" },
    sectionAltInner: { maxWidth: 1100, margin: "0 auto" },
    sectionTag: {
      display: "inline-block", background: "#e8f5e9", color: "#1b5e20",
      fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase",
      padding: "5px 14px", borderRadius: 20, marginBottom: 14,
    },
    sectionTitle: {
      fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(32px,4vw,48px)",
      color: "#0a1628", marginBottom: 8,
    },
    sectionSub: { fontSize: 16, color: "#607080", maxWidth: 460, lineHeight: 1.6 },
    centerText: { textAlign: "center" },

    // ── Roles ──
    rolesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 24, marginTop: 48 },
    roleCard: (accent, border) => ({
      background: "#fff", borderRadius: 16,
      border: `1.5px solid ${border}`,
      padding: "28px 28px 32px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    }),
    roleIcon: (bg) => ({
      width: 52, height: 52, borderRadius: 12, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 24, marginBottom: 20,
    }),
    roleTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "#0a1628", marginBottom: 10 },
    roleDesc: { fontSize: 14, color: "#607080", lineHeight: 1.7, marginBottom: 20 },
    rolePerk: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#0a1628", marginBottom: 8 },
    perkDot: { width: 18, height: 18, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#065f46", fontWeight: 700, flexShrink: 0 },

    // ── Steps ──
    stepsOuter: { maxWidth: 760, margin: "48px auto 0", position: "relative" },
    stepLine: {
      position: "absolute", left: 27, top: 0, bottom: 0, width: 2,
      background: "linear-gradient(to bottom, #f4b942, rgba(244,185,66,0.1))",
    },
    stepRow: (i) => ({
      display: "flex", gap: 20, alignItems: "flex-start",
      marginBottom: i < HOW_TO_BOOK.length - 1 ? 28 : 0,
      position: "relative",
    }),
    stepBubble: {
      width: 56, height: 56, borderRadius: 12, flexShrink: 0,
      background: "#0a1628", border: "3px solid #f4b942",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, position: "relative", zIndex: 1,
    },
    stepCard: {
      background: "#fff", border: "1.5px solid #e8edf2", borderRadius: 14,
      padding: "16px 20px", flex: 1,
    },
    stepNum: {
      fontSize: 11, fontWeight: 700, color: "#f4b942",
      letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 5,
      fontFamily: "'DM Sans', sans-serif",
    },
    stepTitle: { fontWeight: 700, fontSize: 15, color: "#0a1628", marginBottom: 5 },
    stepDesc: { fontSize: 13, color: "#607080", lineHeight: 1.6 },

    // ── Features ──
    featuresGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 20, marginTop: 48 },
    featureCard: {
      background: "#fff", border: "1.5px solid #e8edf2", borderRadius: 14,
      padding: "24px 22px", transition: "transform 0.2s, border-color 0.2s",
    },
    featureIcon: { fontSize: 32, marginBottom: 14 },
    featureTitle: { fontWeight: 700, fontSize: 15, color: "#0a1628", marginBottom: 6 },
    featureDesc: { fontSize: 13, color: "#607080", lineHeight: 1.65 },

    // ── Coming soon ──
    comingGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 20, marginTop: 48 },
    comingCard: {
      background: "#fff", border: "1.5px solid #e8edf2", borderRadius: 14,
      padding: "24px 22px", position: "relative", overflow: "hidden",
    },
    comingGlow: {
      position: "absolute", top: -20, right: -20, width: 100, height: 100,
      borderRadius: "50%", background: "rgba(139,92,246,0.07)",
    },
    comingTag: {
      fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20,
      background: "#ede9fe", color: "#6d28d9", display: "inline-block", marginBottom: 14,
    },
    comingIcon: { fontSize: 28, marginBottom: 12 },
    comingTitle: { fontWeight: 700, fontSize: 15, color: "#0a1628", marginBottom: 6 },
    comingDesc: { fontSize: 13, color: "#607080", lineHeight: 1.65 },

    // ── FAQ ──
    faqOuter: { maxWidth: 720, margin: "0 auto" },
    faqItem: (open) => ({
      background: "#fff", border: `1.5px solid ${open ? "#f4b942" : "#e8edf2"}`,
      borderRadius: 12, marginBottom: 10, overflow: "hidden",
      transition: "border-color 0.2s",
    }),
    faqBtn: {
      width: "100%", textAlign: "left", background: "transparent", border: "none",
      padding: "16px 20px", cursor: "pointer", display: "flex",
      justifyContent: "space-between", alignItems: "center", gap: 16,
      fontFamily: "'DM Sans', sans-serif",
    },
    faqQ: { fontWeight: 600, fontSize: 15, color: "#0a1628" },
    faqToggle: (open) => ({
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      background: open ? "#f4b942" : "#f1f5f9",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16, color: open ? "#0a1628" : "#607080",
      transform: open ? "rotate(45deg)" : "none", transition: "all 0.2s",
    }),
    faqA: { padding: "0 20px 16px", fontSize: 14, color: "#607080", lineHeight: 1.7, borderTop: "1.5px solid #f1f5f9", paddingTop: 12, marginTop: 0 },

    // ── CTA ──
    ctaSection: {
      background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 55%,#0f2d1e 100%)",
      padding: "80px 2.5rem", textAlign: "center",
    },
    ctaTitle: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: "clamp(36px,5vw,56px)", color: "#fff",
      marginBottom: 16, letterSpacing: 2,
    },
    ctaSub: { fontSize: 17, color: "rgba(255,255,255,0.65)", maxWidth: 440, margin: "0 auto 36px", lineHeight: 1.7 },
  };

  return (
    <>
      <style>{`
        .feature-card:hover { transform: translateY(-3px); border-color: #f4b942 !important; }
        @media (max-width: 600px) {
          .step-line { display: none; }
        }
      `}</style>

      <div style={S.page}>

        {/* ── HERO ── */}
        <section style={S.hero}>
          <div style={S.heroBg1} /><div style={S.heroBg2} /><div style={S.heroBg3} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ opacity: 0, animation: "fadeUp 0.6s ease 0.1s forwards" }}>
              <span style={S.eyebrow}>🏏 How CricAdda Works</span>
            </div>
            <h1 style={S.heroTitle}>
              CRICKET.<br />
              <span style={{ color: "#f4b942" }}>SIMPLIFIED.</span>
            </h1>
            <p style={S.heroSub}>
              CricAdda connects cricket players with team owners — making it effortless to find talent,
              book players, and organise events across India.
            </p>
            <div style={S.heroCtas}>
              <button style={S.btnGold}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                onClick={() => navigate("/FindPlayers")}>
                🏏 Find Players
              </button>
              {!token && (
                <button style={S.btnOutline}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={() => navigate("/Log_SignUp")}>
                  Create Account →
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── WHO IS IT FOR ── */}
        <div style={S.section}>
          <FadeIn>
            <div style={S.centerText}>
              <span style={S.sectionTag}>For Everyone</span>
              <div style={S.sectionTitle}>Who is CricAdda for?</div>
              <p style={{ ...S.sectionSub, margin: "0 auto" }}>Two types of users. One platform.</p>
            </div>
          </FadeIn>
          <div style={S.rolesGrid}>
            {ROLES.map((role, i) => (
              <FadeIn key={role.title} delay={i * 0.1}>
                <div style={S.roleCard(role.accent, role.accentBorder)}>
                  <div style={S.roleIcon(role.accent)}>{role.icon}</div>
                  <div style={S.roleTitle}>{role.title}</div>
                  <p style={S.roleDesc}>{role.desc}</p>
                  {role.perks.map((perk) => (
                    <div key={perk} style={S.rolePerk}>
                      <div style={S.perkDot}>✓</div>
                      {perk}
                    </div>
                  ))}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* ── HOW TO BOOK ── */}
        <div style={S.sectionAlt}>
          <div style={S.sectionAltInner}>
            <FadeIn>
              <div style={S.centerText}>
                <span style={S.sectionTag}>Step by Step</span>
                <div style={S.sectionTitle}>How to Book a Player</div>
                <p style={{ ...S.sectionSub, margin: "0 auto" }}>6 simple steps to get your team ready</p>
              </div>
            </FadeIn>
            <div style={S.stepsOuter}>
              <div style={S.stepLine} className="step-line" />
              {HOW_TO_BOOK.map((item, i) => (
                <FadeIn key={item.step} delay={i * 0.08}>
                  <div style={S.stepRow(i)}>
                    <div style={S.stepBubble}>{item.icon}</div>
                    <div style={S.stepCard}>
                      <div style={S.stepNum}>Step {item.step}</div>
                      <div style={S.stepTitle}>{item.title}</div>
                      <p style={S.stepDesc}>{item.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div style={S.section}>
          <FadeIn>
            <div style={S.centerText}>
              <span style={S.sectionTag}>Platform Features</span>
              <div style={S.sectionTitle}>Everything You Need</div>
              <p style={{ ...S.sectionSub, margin: "0 auto" }}>Built specifically for the cricket community</p>
            </div>
          </FadeIn>
          <div style={S.featuresGrid}>
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.06}>
                <div style={S.featureCard} className="feature-card">
                  <div style={S.featureIcon}>{f.icon}</div>
                  <div style={S.featureTitle}>{f.title}</div>
                  <p style={S.featureDesc}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* ── COMING SOON ── */}
        <div style={S.sectionAlt}>
          <div style={S.sectionAltInner}>
            <FadeIn>
              <div style={S.centerText}>
                <span style={{ ...S.sectionTag, background: "#ede9fe", color: "#6d28d9" }}>On the Roadmap</span>
                <div style={S.sectionTitle}>What's Coming Next</div>
                <p style={{ ...S.sectionSub, margin: "0 auto" }}>Big features in the works — stay tuned</p>
              </div>
            </FadeIn>
            <div style={S.comingGrid}>
              {COMING_SOON.map((f, i) => (
                <FadeIn key={f.title} delay={i * 0.08}>
                  <div style={S.comingCard}>
                    <div style={S.comingGlow} />
                    <span style={S.comingTag}>Coming Soon</span>
                    <div style={S.comingIcon}>{f.icon}</div>
                    <div style={S.comingTitle}>{f.title}</div>
                    <p style={S.comingDesc}>{f.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={S.section}>
          <FadeIn>
            <div style={S.centerText}>
              <span style={S.sectionTag}>Help</span>
              <div style={S.sectionTitle}>Common Questions</div>
              <p style={{ ...S.sectionSub, margin: "0 auto 48px" }}>Quick answers to things people ask</p>
            </div>
          </FadeIn>
          <div style={S.faqOuter}>
            {FAQS.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div style={S.faqItem(openFaq === i)}>
                  <button style={S.faqBtn} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span style={S.faqQ}>{faq.q}</span>
                    <span style={S.faqToggle(openFaq === i)}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={S.faqA}>{faq.a}</div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <section style={S.ctaSection}>
          <FadeIn>
            <div style={{
              maxWidth: 680, margin: "0 auto",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(244,185,66,0.2)",
              borderRadius: 20, padding: "52px 40px",
            }}>
              <div style={{ fontSize: 52, marginBottom: 20 }}>🏏</div>
              <h2 style={S.ctaTitle}>READY TO PLAY?</h2>
              <p style={S.ctaSub}>
                Join CricAdda today — whether you're a player looking for opportunities
                or an owner building your dream team.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                {!token && (
                  <button style={S.btnGold}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    onClick={() => navigate("/Log_SignUp")}>
                    Get Started — It's Free
                  </button>
                )}
                <button style={S.btnOutline}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={() => navigate("/FindPlayers")}>
                  Browse Players
                </button>
                <button style={{ ...S.btnOutline, borderColor: "rgba(244,185,66,0.4)", color: "#f4b942" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(244,185,66,0.08)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={() => navigate("/Tournaments")}>
                  View Tournaments
                </button>
              </div>
            </div>
          </FadeIn>
        </section>

        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  );
}