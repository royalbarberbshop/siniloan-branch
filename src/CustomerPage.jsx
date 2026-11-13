import React, { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase.js";
import { LogIn, CheckCircle2, MapPin, Phone, Clock3, Download, Check } from "lucide-react";
import corrected from "./customer-corrected.css?inline";

// Shop details. Values marked "confirm" come from the design mockup and may be placeholders.
const SHOP = { address: "Brgy. J. Rizal, Siniloan, Laguna", landmark: "Near the town plaza", phone: "+63 912 345 6789" /* confirm */, email: "royalbarbers@gmail.com" /* confirm */, hours: "Monday – Sunday", open: "7:00 AM – 7:00 PM" };
const MIN_PER_CUSTOMER = 15; // rough wait estimate per customer ahead; change here if needed
const ACTIVE = ["booked", "checked_in", "waiting", "in_service"];
const VIEWS = ["home", "about", "services", "contact", "book", "appointments"];
const base = import.meta.env.BASE_URL;
const pad = n => String(n).padStart(2, "0");
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const qn = n => `Q-${pad(Math.max(Number(n) || 0, 0)).padStart(3, "0")}`;
const t12 = v => new Date(`2000-01-01T${String(v).slice(0, 5)}:00`).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
const peso = n => `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const manilaFmt = (d, o) => new Date(d).toLocaleString("en-PH", { timeZone: "Asia/Manila", ...o });
const longDate = ymd => `${manilaFmt(`${ymd}T12:00:00+08:00`, { month: "long", day: "numeric", year: "numeric" })} (${manilaFmt(`${ymd}T12:00:00+08:00`, { weekday: "long" })})`;
const ord = n => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const refNo = a => `RB-${String(a.queue_date).replace(/-/g, "")}-${String(a.queue_number).padStart(3, "0")}`;
const viewFromHash = () => { const h = window.location.hash.replace("#", ""); return VIEWS.includes(h) ? h : "home"; };

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
.cp{min-height:100vh;background:#f7f5f0;color:#111827;font-family:Inter,system-ui,sans-serif;font-size:14px}
.cp *{box-sizing:border-box}.cp button{font-family:inherit;cursor:pointer}.cp h1,.cp h2,.cp h3,.cp p{margin:0}
.cp-nav{background:#fff;border-bottom:1px solid #e7e7e1;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 max(5vw,20px);position:sticky;top:0;z-index:5;gap:16px}
.cp-brand{display:flex;align-items:center;gap:9px;background:none;border:0;padding:0;text-align:left}.cp-mark{width:30px;height:30px;border-radius:50%;background:#111827;color:#cda653;display:grid;place-items:center;font-weight:800;font-size:14px}
.cp-brand b{display:block;font-size:12px;font-weight:800;color:#111827}.cp-brand small{display:block;font-size:8px;color:#cda653;letter-spacing:.5px}
.cp-links{display:flex;gap:28px}.cp-links button{background:none;border:0;font-size:12px;color:#374151;padding:4px 0}.cp-links button.on{color:#cda653;font-weight:600}
.cp-right{display:flex;align-items:center;gap:14px}.cp-text{background:none;border:0;font-size:11px;color:#6b7280;text-decoration:underline}
.cp-gold{background:#cda653;color:#111827;border:0;border-radius:3px;font-weight:700;font-size:12px;padding:9px 16px}.cp-gold:disabled{opacity:.5;cursor:not-allowed}
.cp-line{background:#fff;border:1px solid #111827;color:#111827;border-radius:3px;font-weight:600;font-size:12px;padding:9px 18px}.cp-dark{background:#111827;color:#cda653;border:0;border-radius:3px;font-weight:700;font-size:12px;padding:10px 18px}
.cp-hero{background:#111827;color:#fff;padding:70px max(7vw,24px)}.cp-hero-in{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.cp-pill{display:inline-block;border:1px solid #cda653;color:#cda653;border-radius:20px;font-size:9px;padding:5px 10px;font-weight:600;letter-spacing:.4px}
.cp-hero h1{font-size:34px;font-weight:800;margin:20px 0 14px}.cp-hero p{color:#b6bdc9;font-size:12px;line-height:1.7;max-width:380px}.cp-hero .row{display:flex;gap:10px;margin-top:24px}
.cp-hero .ghost{background:none;border:1px solid #cda653;color:#cda653;border-radius:3px;font-weight:600;font-size:12px;padding:9px 16px}
.cp-crest{background:#fff;border-radius:6px;display:grid;place-items:center;padding:14px;min-height:200px}
.cp-banner{background:#111827;padding:46px max(7vw,24px)}.cp-banner h1{color:#cda653;font-size:28px;font-weight:800;max-width:1000px;margin:0 auto 8px}.cp-banner p{color:#b6bdc9;font-size:12px;max-width:1000px;margin:0 auto}
.cp-sec{max-width:920px;margin:0 auto;padding:48px 20px}.cp-eyebrow{color:#cda653;font-size:9px;font-weight:700;letter-spacing:.8px;text-align:center}.cp-title{font-size:23px;font-weight:800;text-align:center;margin:6px 0 10px}.cp-sub{text-align:center;color:#6b7280;font-size:12px;line-height:1.6;max-width:520px;margin:0 auto 26px}
.cp-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.cp-stat{background:#fff;border:1px solid #e7e7e1;border-radius:6px;text-align:center;padding:18px 10px}.cp-stat small{display:block;font-size:8px;font-weight:700;letter-spacing:.5px;color:#374151}.cp-stat strong{display:block;font-size:26px;font-weight:800;margin:8px 0 4px}.cp-stat span{font-size:9px;color:#6b7280}
.cp-stat.me{border:1.5px solid #cda653}.cp-stat.me strong,.cp-stat.me small{color:#cda653}.cp-stat.now{background:#111827;border-color:#111827}.cp-stat.now small{color:#cda653}.cp-stat.now strong{color:#fff}
.cp-tag{display:inline-block;font-size:8px;font-weight:700;padding:3px 7px;border-radius:3px;background:#f3ead8;color:#b58a3c}.cp-tag.g{background:#10b981;color:#fff}
.cp-box{background:#fff;border:1px solid #e7e7e1;border-radius:6px;padding:22px;margin-top:16px}.cp-box h3{font-size:13px;font-weight:700;margin-bottom:14px}
.cp-seq{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.cp-seq i{font-style:normal;color:#6b7280}.cp-q{border:1px solid #e7e7e1;background:#f7f5f0;border-radius:5px;padding:12px 14px;min-width:130px}.cp-q small{display:block;font-size:7.5px;font-weight:700;color:#cda653;letter-spacing:.4px}.cp-q b{display:block;font-size:15px;margin:4px 0}.cp-q span{font-size:9px;color:#6b7280}
.cp-q.now{background:#111827;border-color:#111827}.cp-q.now b{color:#fff}.cp-q.me{border:1.5px solid #cda653;background:#faf6ec}.cp-muted{color:#6b7280;font-size:11px}
.cp-steps{background:#fff;border-bottom:1px solid #e7e7e1;display:flex;justify-content:space-between;gap:8px;padding:14px max(6vw,16px);overflow-x:auto}.cp-s{display:flex;align-items:center;gap:8px;font-size:11px;color:#6b7280;white-space:nowrap}.cp-s span{width:20px;height:20px;border-radius:50%;background:#e8e8e2;display:grid;place-items:center;font-size:10px;font-weight:700}
.cp-s.done span{background:#111827;color:#fff}.cp-s.cur span{background:#cda653;color:#fff}.cp-s.cur{color:#111827;font-weight:700}
.cp-card{background:#fff;border-radius:8px;box-shadow:0 2px 14px #0000000d;padding:24px;max-width:520px;margin:0 auto}.cp-wide{max-width:640px}.cp-btns{display:flex;justify-content:space-between;gap:10px;max-width:520px;margin:18px auto 0}.cp-btns.w{max-width:640px}
.cp-svc{display:grid;grid-template-columns:150px 1fr;background:#fff;border:1.5px solid #e7e7e1;border-radius:8px;overflow:hidden;max-width:620px;margin:0 auto 12px}.cp-svc.sel{border-color:#cda653}
.cp-img{background:linear-gradient(135deg,#1b2740,#111827);color:#cda653;display:grid;place-items:center;min-height:110px}.cp-svc-b{padding:16px}.cp-svc-b .top{display:flex;justify-content:space-between;gap:8px;font-weight:700}.cp-svc-b .top em{font-style:normal;color:#cda653}
.cp-svc-b p{color:#6b7280;font-size:11px;margin:6px 0}.cp-svc-b .foot{display:flex;justify-content:space-between;align-items:center;margin-top:8px}.cp-ok{color:#10b981;font-size:11px;font-weight:600}
.cp-selbar{background:#111827;color:#cda653;border-radius:4px;display:flex;justify-content:space-between;font-size:11px;padding:11px 14px;max-width:520px;margin:0 auto 14px}.cp-selbar span{color:#b6bdc9}
.cp-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center}.cp-cal small{font-size:10px;font-weight:700;padding:6px 0}.cp-cal button{height:34px;border:0;border-radius:5px;background:#f7f5f0;font-size:11px;font-weight:600}.cp-cal button.sel{background:#cda653;color:#fff}.cp-cal button:disabled{background:none;color:#cfd2d8;cursor:not-allowed}
.cp-cal-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-weight:800}.cp-cal-h button{width:26px;height:26px;border:1px solid #e0e0da;background:#fff;border-radius:4px}
.cp-slots{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 18px}.cp-slot{border:1px solid #111827;background:#fff;border-radius:4px;font-size:11px;font-weight:600;padding:8px 14px;min-width:74px}.cp-slot.sel{background:#cda653;border-color:#cda653}.cp-slot:disabled{background:#eeeee9;border-color:#eeeee9;color:#a5a9b2;text-decoration:line-through;cursor:not-allowed}
.cp-h{font-size:9px;font-weight:700;color:#374151;letter-spacing:.4px}.cp-sel{display:flex;justify-content:space-between;gap:10px;font-size:12px;border-bottom:1px solid #eee;padding-bottom:12px;margin-bottom:14px;flex-wrap:wrap}.cp-sel b{color:#cda653}
.cp-f{margin-bottom:16px}.cp-f label{display:block;font-weight:700;font-size:11px;margin-bottom:6px}.cp-f input,.cp-f textarea,.cp-f select{width:100%;border:1px solid #e5e5df;background:#f7f7f3;border-radius:4px;padding:10px;font:inherit;font-size:12px}.cp-f small{display:block;font-size:9px;color:#6b7280;margin-top:5px}
.cp-tbl .r{display:flex;justify-content:space-between;gap:14px;font-size:11px;padding:9px 0;border-bottom:1px solid #f0f0ea;color:#6b7280}.cp-tbl .r b{color:#111827;text-align:right}.cp-tbl .r b.g{color:#cda653}
.cp-pay{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}.cp-pay button{border:1.5px solid #e0e0da;background:#fff;border-radius:6px;padding:11px;text-align:left;font-size:11px}.cp-pay button.sel{border-color:#cda653;background:#faf6ec}.cp-pay b{display:block;font-size:12px}
.cp-qr{display:block;width:170px;max-width:100%;margin:10px auto;border-radius:6px}.cp-err{background:#fdecec;color:#a33;border-radius:5px;padding:10px;font-size:11px;margin-top:12px}
.cp-ok-i{width:44px;height:44px;border-radius:50%;background:#d1fae5;color:#10b981;display:grid;place-items:center;margin:0 auto 14px}
.cp-tk{background:#111827;border-radius:10px;max-width:400px;margin:22px auto;overflow:hidden;color:#fff}.cp-tk .t{background:#1b2436;padding:22px}.cp-tk .t small{color:#cda653;font-size:9px;font-weight:700}.cp-tk .t strong{display:block;color:#cda653;font-size:40px;margin:6px 0}.cp-tk .b{padding:18px 22px}
.cp-tk .r{display:flex;justify-content:space-between;font-size:10px;color:#8b93a3;padding:6px 0;gap:12px}.cp-tk .r b{color:#fff;text-align:right}.cp-tk .r b.g{color:#cda653}.cp-tk .bd{background:#d1fae5;color:#047857;padding:2px 8px;border-radius:3px;font-size:8px}
.cp-act{background:#fff;border:1.5px solid #cda653;border-radius:8px;padding:20px;display:grid;grid-template-columns:170px 1fr auto;gap:20px;margin:14px 0}.cp-act .n{background:#111827;border-radius:6px;text-align:center;padding:20px 10px;color:#cda653}.cp-act .n small{font-size:8px;font-weight:700}.cp-act .n strong{display:block;font-size:30px;margin:6px 0}.cp-act .n span{color:#b6bdc9;font-size:9px}
.cp-hist{background:#fff;border:1px solid #e7e7e1;border-radius:6px;padding:14px 16px;display:flex;justify-content:space-between;gap:10px;margin-bottom:8px;font-size:11px;color:#6b7280;align-items:center;flex-wrap:wrap}.cp-hist b{color:#111827;display:block;font-size:12px}
.cp-st{font-size:8px;font-weight:700;padding:3px 7px;border-radius:3px;margin-right:10px;background:#cda653;color:#fff}.cp-st.c{background:#d1fae5;color:#047857}.cp-st.x{background:#fee2e2;color:#b91c1c}
.cp-two{display:grid;grid-template-columns:1fr 1fr;gap:34px}.cp-info{background:#f7f5f0;border:1px solid #e7e7e1;border-radius:6px;padding:20px;display:grid;gap:10px;font-size:11px}.cp-info div{display:flex;gap:8px;align-items:center}
.cp-map{margin-top:14px;border-radius:6px;min-height:130px;background:linear-gradient(135deg,#dfe8e0,#cfdce6);display:grid;place-items:center;font-size:11px;color:#374151;text-decoration:none}
.cp-ft{background:#111827;color:#b6bdc9;padding:38px max(7vw,24px);font-size:11px}.cp-ft-in{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:24px;line-height:1.8}.cp-ft h4{margin:0 0 8px;color:#cda653;font-size:9px;letter-spacing:.6px}.cp-ft b{color:#fff}
@media(max-width:760px){.cp-links{display:none}.cp-hero-in,.cp-two,.cp-ft-in,.cp-act{grid-template-columns:1fr}.cp-cards{grid-template-columns:1fr 1fr}.cp-svc{grid-template-columns:1fr}.cp-pay{grid-template-columns:1fr}}
.cp .rb-queue-note{margin-top:14px}
.cp .cp-acct{display:flex;gap:12px;align-items:center}.cp .cp-mob{display:none}
.cp .rb-queue-list{display:flex;flex-wrap:wrap;gap:8px;align-items:stretch}.cp .rb-queue-item{flex:1 1 150px}.cp .rb-queue-arrow{flex:0 0 20px;align-self:center;text-align:center}.cp .rb-queue-item em{font-style:normal;font-size:9px;font-weight:800;color:#96712b}
@media(max-width:800px){.cp .cp-acct{display:none}.cp .cp-mob{display:block}}
@media print{.cp-nav,.cp-btns,.cp-ft,.cp-steps{display:none}}
`;

const styles = css + corrected;
const Crest = ({ s = 120 }) => <svg width={s} height={s} viewBox="0 0 100 100" aria-hidden="true"><path d="M34 16l8 11 8-14 8 14 8-11-2 15H36z" fill="#c9a227" /><circle cx="50" cy="58" r="36" fill="#fff" stroke="#c9a227" strokeWidth="5" /><text x="50" y="75" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="700" fontSize="50" fill="#1a3a7c">R</text></svg>;
function Logo({ size = 140 }) { const [bad, setBad] = useState(false); return bad ? <Crest s={size} /> : <img src={`${base}Royal-Logo.png`} height={size} style={{ maxWidth: "100%", objectFit: "contain" }} alt="Royal Barbershop" onError={() => setBad(true)} />; }

export default function CustomerPage() {
  const [session, setSession] = useState(null), [profile, setProfile] = useState(null), [view, setView] = useState(viewFromHash());
  const [authMode, setAuthMode] = useState("login"), [auth, setAuth] = useState({ name: "", phone: "", email: "", password: "" });
  const [services, setServices] = useState([]), [barbers, setBarbers] = useState([]), [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]), [qLoading, setQLoading] = useState(true), [qError, setQError] = useState("");
  const [step, setStep] = useState(1), [service, setService] = useState(""), [barber, setBarber] = useState("any"), [date, setDate] = useState(today()), [time, setTime] = useState("");
  const [slotList, setSlotList] = useState([]), [slotLoad, setSlotLoad] = useState(false), [cal, setCal] = useState(() => { const [y, m] = today().split("-").map(Number); return { y, m: m - 1 }; });
  const [payChoice, setPayChoice] = useState("deposit"), [gref, setGref] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [ticket, setTicket] = useState(null);
  const [msg, setMsg] = useState({ name: "", phone: "", text: "" });

  const go = v => { window.location.hash = v; window.scrollTo(0, 0); };
  useEffect(() => { const f = () => setView(viewFromHash()); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  useEffect(() => { if (!supabase) return; supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => subscription.unsubscribe(); }, []);
  useEffect(() => { if (!supabase) return; Promise.all([supabase.from("services").select("id,name,description,duration_minutes,price_pesos").eq("is_active", true).order("name"), supabase.from("barbers").select("id,display_name").eq("is_active", true).order("display_name")]).then(([s, b]) => { if (!s.error) setServices(s.data || []); if (!b.error) setBarbers(b.data || []); }); }, []);
  useEffect(() => {
    if (!supabase) return; let live = true, timer;
    const load = async () => { const { data, error } = await supabase.rpc("customer_get_today_live_queue"); if (!live) return; if (error) setQError("Live queue is temporarily unavailable."); else { setQError(""); setQueue(data || []); } setQLoading(false); };
    load(); timer = window.setInterval(load, 15000); return () => { live = false; window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!session?.user?.id || !supabase) { setProfile(null); setAppointments([]); return; }
    supabase.from("profiles").select("full_name,phone").eq("id", session.user.id).maybeSingle().then(({ data }) => { if (data) setProfile(data); });
    supabase.from("appointments").select("id,starts_at,queue_date,queue_number,status,payment_status,payment_choice,payment_verified_at,service_price_snapshot,created_at,services(name,price_pesos),barbers(display_name)").eq("customer_id", session.user.id).order("starts_at", { ascending: false }).limit(30).then(({ data }) => setAppointments(data || []));
  }, [session?.user?.id, ticket]);
  useEffect(() => {
    if (view !== "book" || step !== 3 || !service || !session || !supabase) return; let live = true; setSlotLoad(true);
    supabase.rpc("customer_get_available_slots", { p_service_id: service, p_date: date, p_barber_id: barber === "any" ? null : barber }).then(({ data, error }) => { if (!live) return; setSlotList(error ? [] : data || []); if (error) setError("Could not load available times. Please try again."); setSlotLoad(false); });
    return () => { live = false; };
  }, [view, step, service, date, barber, session]);

  const chosen = services.find(x => x.id === service), selBarber = barbers.find(x => x.id === barber);
  const price = Number(chosen?.price_pesos || 0), dueNow = payChoice === "full" ? price : price / 2;
  const mine = appointments.find(a => a.queue_date === today() && ACTIVE.includes(a.status));
  const serving = queue.filter(q => q.status === "in_service"), waiting = queue.filter(q => q.status !== "in_service");
  const myIdx = mine ? queue.findIndex(q => q.queue_number === mine.queue_number) : -1;
  const ahead = myIdx >= 0 ? queue.slice(0, myIdx).filter(q => q.status !== "in_service").length : waiting.length;
  const fullName = profile?.full_name || auth.name || "", phone = profile?.phone || auth.phone || "";

  async function submitAuth(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if (authMode === "signup") { const { error } = await supabase.auth.signUp({ email: auth.email.trim(), password: auth.password, options: { data: { full_name: auth.name.trim(), phone: auth.phone.trim() } } }); if (error) throw error; setError("Account created. If email confirmation is enabled, verify your email, then sign in."); setAuthMode("login"); }
      else { const { error } = await supabase.auth.signInWithPassword({ email: auth.email.trim(), password: auth.password }); if (error) throw error; }
    } catch (e2) { setError(e2.message || "Unable to continue."); } finally { setBusy(false); }
  }
  async function facebook() { setError(""); setBusy(true); try { const { error } = await supabase.auth.signInWithOAuth({ provider: "facebook", options: { redirectTo: `${window.location.origin}${base}book`, scopes: "email,public_profile" } }); if (error) throw error; } catch (e) { setError(e.message || "Unable to continue with Facebook."); setBusy(false); } }
  async function signOut() { await supabase.auth.signOut(); setProfile(null); setAppointments([]); setTicket(null); go("home"); }
  async function confirm() {
    const r = gref.trim(); if (!/^\d{6,25}$/.test(r)) { setError("Enter your GCash reference number (6–25 digits)."); return; }
    setError(""); setBusy(true);
    try {
      const { data, error } = await supabase.rpc("customer_create_paid_appointment", { p_service_id: service, p_barber_id: barber === "any" ? null : barber, p_starts_at: new Date(`${date}T${time}:00+08:00`).toISOString(), p_payment_choice: payChoice, p_provider_reference: r });
      if (error) throw error; setTicket(Array.isArray(data) ? data[0] : data);
    } catch (e) { setError(e.message || "That time is no longer available. Please choose another slot."); } finally { setBusy(false); }
  }
  function resetBooking() { setTicket(null); setStep(1); setService(""); setTime(""); setGref(""); setError(""); }

  const Steps = () => <div className="cp-steps">{["Select Service", "Select Date", "Select Time", "User Details", "Confirmation"].map((l, i) => <div key={l} className={`cp-s ${step === i + 1 ? "cur" : step > i + 1 ? "done" : ""}`}><span>{i + 1}</span>{l}</div>)}</div>;
  const Head = ({ n, t, s }) => <><div className="cp-eyebrow">STEP {n} OF 5</div><h2 className="cp-title">{t}</h2>{s && <p className="cp-sub">{s}</p>}</>;
  const next = (to, label, ok = true) => <button className="cp-gold" disabled={!ok} onClick={() => { setError(""); setStep(to); }}>{label}</button>;
  const back = to => <button className="cp-line" onClick={() => { setError(""); setStep(to); }}>Back</button>;

  const authPanel = <section className="cp-sec"><div className="cp-card"><h2 className="cp-title" style={{ marginTop: 0 }}>{authMode === "signup" ? "Create your account" : "Sign in to book"}</h2><p className="cp-sub">An account lets us keep your queue ticket and appointment history.</p>
    <button className="cp-line" style={{ width: "100%", marginBottom: 12 }} onClick={facebook} disabled={busy}>Continue with Facebook</button>
    <form onSubmit={submitAuth}>
      {authMode === "signup" && <><div className="cp-f"><label>Full Name *</label><input required value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} /></div><div className="cp-f"><label>Contact Number (Philippine Mobile) *</label><input required pattern="09[0-9]{9}" value={auth.phone} onChange={e => setAuth({ ...auth, phone: e.target.value })} placeholder="09123456789" /><small>Format: 11 digits starting with 09</small></div></>}
      <div className="cp-f"><label>Email address</label><input required type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} /></div>
      <div className="cp-f"><label>Password</label><input required minLength={6} type="password" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} /></div>
      <button className="cp-gold" style={{ width: "100%" }} disabled={busy}>{busy ? "Please wait..." : authMode === "signup" ? "Create account" : "Sign in"} <LogIn size={13} style={{ verticalAlign: "middle" }} /></button></form>
    <p className="cp-muted" style={{ textAlign: "center", marginTop: 14 }}>{authMode === "signup" ? "Already registered?" : "New here?"} <button className="cp-text" onClick={() => { setError(""); setAuthMode(authMode === "signup" ? "login" : "signup"); }}>{authMode === "signup" ? "Sign in" : "Create an account"}</button></p>
    {error && <div className="cp-err">{error}</div>}</div></section>;

  if (!isSupabaseConfigured || !supabase) return <div className="cp"><style>{styles}</style><section className="cp-sec"><div className="cp-card"><h2 className="cp-title">Booking is temporarily unavailable</h2><p className="cp-sub">The selected Supabase environment is not configured.</p></div></section></div>;

  const nav = <header className="rb-header"><div className="rb-nav-wrap"><button className="rb-brand-btn" type="button" onClick={() => go("home")}><span className="rb-brand"><img className="rb-brand-logo" src={`${base}royal_barbershop_logo.svg`} alt="Royal Barbershop logo" /><span><b>ROYAL BARBERSHOP</b><small>SINILOAN, LAGUNA</small></span></span></button>
    <nav className="rb-nav" aria-label="Main navigation">{[["home", "Home"], ["about", "About"], ["services", "Services"], ["contact", "Contact"]].map(([v, l]) => <button key={v} type="button" className={view === v ? "rb-active" : ""} onClick={() => go(v)}>{l}</button>)}
      {session && <button type="button" className="cp-mob" onClick={() => go("appointments")}>My Appointments</button>}<button type="button" className="cp-mob" onClick={session ? signOut : () => go("appointments")}>{session ? "Sign out" : "Sign in"}</button></nav>
    <div className="cp-right"><div className="cp-acct">{session && <button className="cp-text" onClick={() => go("appointments")}>My Appointments</button>}<button className="cp-text" onClick={session ? signOut : () => go("appointments")}>{session ? "Sign out" : "Sign in"}</button></div><button className="rb-btn rb-gold rb-nav-book" type="button" onClick={() => { resetBooking(); go("book"); }}>Book Appointment</button></div></div></header>;

  const footer = <footer className="rb-footer"><div className="rb-footer-grid"><div><div className="rb-brand"><img className="rb-brand-logo" src={`${base}royal_barbershop_logo.svg`} alt="Royal Barbershop logo" /><span><b>ROYAL BARBERSHOP</b></span></div><p>Quality haircuts and straightforward queue systems for the modern gentleman in Siniloan. Experience grooming without the hassle.</p></div>
    <div><h4>HOURS OF OPERATION</h4><p>{SHOP.hours}<br /><b>{SHOP.open}</b></p></div><div><h4>LOCATION</h4><p>{SHOP.address}<br />Landmark: {SHOP.landmark}</p></div><div><h4>GET IN TOUCH</h4><p>{SHOP.phone}<br />{SHOP.email}</p></div></div></footer>;

  let body = null;
  if (view === "home") {
    const items = []; let n = 0;
    queue.slice(0, 6).forEach(q => { const now = q.status === "in_service"; if (!now) n++; items.push({ q, now, you: !!mine && q.queue_number === mine.queue_number, label: now ? "CURRENTLY SERVING" : `${ord(n)} IN LINE` }); });
    body = <main className="rb-live-queue-page"><section className="rb-live-queue-panel" aria-labelledby="queue-title" aria-live="polite">
      <div className="rb-queue-heading"><span className="rb-live-indicator"><i /> LIVE QUEUE STATUS</span><h1 id="queue-title">Siniloan Branch Queue Status</h1><p>{SHOP.address}</p></div>
      <div className="rb-queue-stats">
        <article className="rb-queue-stat rb-your-ticket"><span>YOUR TICKET</span><strong>{mine ? qn(mine.queue_number) : "—"}</strong><small>{mine ? (mine.status === "in_service" ? "IN SERVICE" : mine.status === "booked" ? "BOOKED" : "WAITING") : session ? "No active ticket today" : "Sign in to see yours"}</small></article>
        <article className="rb-queue-stat"><span>CURRENTLY SERVING</span><strong>{serving[0] ? qn(serving[0].queue_number) : "—"}</strong><small>{serving[0] ? `IN SERVICE${serving.length > 1 ? ` · +${serving.length - 1} more` : ""}` : "No one yet"}</small></article>
        <article className="rb-queue-stat"><span>{mine ? "CUSTOMERS AHEAD" : "CUSTOMERS WAITING"}</span><strong>{ahead}</strong><small>{mine ? "Estimated turn" : "In line today"}</small></article>
        <article className="rb-queue-stat"><span>ESTIMATED WAIT</span><strong>{ahead * MIN_PER_CUSTOMER} Mins</strong><small>Subject to barber progress</small></article></div>
      <section className="rb-queue-sequence" aria-label="Live queue sequence"><h2>Live Queue Sequence</h2>
        {qLoading ? <p className="rb-queue-note">Loading today’s queue…</p> : qError ? <p className="rb-queue-note">{qError}</p> : items.length === 0 ? <p className="rb-queue-note">There are no customers in the live queue yet today.</p> : <div className="rb-queue-list">{items.map((x, i) => <React.Fragment key={`${x.q.queue_number}-${i}`}>{i > 0 && <span className="rb-queue-arrow" aria-hidden="true">›</span>}<article className={`rb-queue-item ${x.now ? "rb-serving" : ""} ${x.you ? "rb-you" : ""}`}><span>{x.label}</span><strong>{qn(x.q.queue_number)}</strong><small>{x.q.service_name}</small>{x.you && <em>YOUR POSITION</em>}</article></React.Fragment>)}</div>}
        <p className="rb-queue-note">Queue information is displayed for monitoring purposes. Today’s queue only, updated every 15 seconds.</p></section></section></main>;
  } else if (view === "about") {
    body = <><div className="cp-banner"><h1>About Royal Barbershop</h1><p>Learn about our local heritage, services, and commitment to the Siniloan community.</p></div><section className="cp-sec"><div className="cp-two" style={{ alignItems: "center" }}><div><div className="cp-eyebrow" style={{ textAlign: "left" }}>ESTABLISHED LOCAL BARBERSHOP</div><h2 className="cp-title" style={{ textAlign: "left" }}>A Heritage of Grooming</h2><p className="cp-muted" style={{ lineHeight: 1.8, marginBottom: 14 }}>Located in {SHOP.address}, Royal Barbershop has been providing reliable and premium haircuts to our neighborhood since our opening. We take pride in running a straightforward, high-quality local business.</p><p className="cp-muted" style={{ lineHeight: 1.8 }}>Our mission is simple: to make quality grooming accessible and organized. With our digital queue system, every customer receives dedicated attention without needing to stand in line for hours outside.</p></div><div className="cp-crest" style={{ border: "1px solid #e7e7e1" }}><Logo size={220} /></div></div></section></>;
  } else if (view === "services") {
    body = <><div className="cp-banner"><h1>Our Services</h1><p>We keep it simple, specialized, and of the highest local standard.</p></div><section className="cp-sec"><div className="cp-eyebrow">OUR OFFERINGS</div><h2 className="cp-title">The Signature Service</h2><div style={{ height: 14 }} />
      {services.length === 0 && <p className="cp-sub">Services are loading…</p>}
      {services.map(s => <div key={s.id} className="cp-svc" style={{ maxWidth: 740 }}><div className="cp-img" style={{ minHeight: 190, backgroundImage: `url(${base}haircut.jpg), linear-gradient(135deg,#1b2740,#111827)`, backgroundSize: "cover", backgroundPosition: "center" }} /><div className="cp-svc-b" style={{ padding: 24 }}><h3 style={{ fontSize: 20, fontWeight: 800 }}>{s.name}</h3><div style={{ color: "#cda653", fontSize: 20, fontWeight: 800, margin: "6px 0" }}>{peso(s.price_pesos)}</div><p>{s.description || "Professional barber service."}</p><p><Clock3 size={12} style={{ verticalAlign: "middle" }} /> ~{s.duration_minutes} Minutes</p><button className="cp-gold" style={{ marginTop: 10 }} onClick={() => { resetBooking(); setService(s.id); setStep(2); go("book"); }}>Book This Service</button></div></div>)}</section></>;
  } else if (view === "contact") {
    body = <><div className="cp-banner"><h1>Contact Us</h1><p>Have questions or need assistance with your booking? Reach out to our Siniloan branch.</p></div><section className="cp-sec"><div className="cp-two"><div><h2 style={{ fontSize: 18, fontWeight: 800 }}>Send us a Message</h2><p className="cp-muted" style={{ margin: "4px 0 16px" }}>We will respond as soon as our barber is free.</p>
      <div className="cp-f"><label>Full Name</label><input value={msg.name} onChange={e => setMsg({ ...msg, name: e.target.value })} /></div><div className="cp-f"><label>Contact Number</label><input value={msg.phone} onChange={e => setMsg({ ...msg, phone: e.target.value })} /></div><div className="cp-f"><label>Your Message</label><textarea rows={4} placeholder="How can we help you?" value={msg.text} onChange={e => setMsg({ ...msg, text: e.target.value })} /></div>
      <a className="cp-gold" style={{ textDecoration: "none", display: "inline-block" }} href={`mailto:${SHOP.email}?subject=${encodeURIComponent("Message from " + (msg.name || "a customer"))}&body=${encodeURIComponent(`${msg.text}\n\nName: ${msg.name}\nContact: ${msg.phone}`)}`}>Send Message</a></div>
      <div><div className="cp-info"><b style={{ fontSize: 14 }}>Royal Barbershop</b><div><MapPin size={13} />{SHOP.address}</div><div><Phone size={13} />{SHOP.phone}</div><div><Clock3 size={13} />{SHOP.hours} {SHOP.open}</div></div><a className="cp-map" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent(SHOP.address)}`}><span><MapPin size={16} style={{ verticalAlign: "middle" }} /> View Brgy. J. Rizal, Siniloan on Google Maps</span></a></div></div></section></>;
  } else if (view === "appointments") {
    if (!session) body = authPanel; else {
      const isActive = a => ACTIVE.includes(a.status) && a.queue_date >= today(), act = appointments.filter(isActive), hist = appointments.filter(a => !isActive(a));
      const status = a => a.status === "booked" && a.payment_choice && !a.payment_verified_at ? "WAITING FOR CONFIRMATION" : a.status === "booked" ? "CONFIRMED" : "ACTIVE QUEUE";
      const sp = a => a.service_price_snapshot ?? a.services?.price_pesos;
      body = <section className="cp-sec"><h1 style={{ fontSize: 24, fontWeight: 800 }}>My Appointments</h1><p className="cp-muted" style={{ margin: "6px 0 18px", maxWidth: 360 }}>Track your upcoming active queue and browse through your history at Royal Barbershop Siniloan.</p>
        {act.length === 0 && <div className="cp-box"><p className="cp-muted">You have no active appointments.</p></div>}
        {act.map(a => { const qi = queue.findIndex(q => q.queue_number === a.queue_number), today_ = a.queue_date === today() && qi >= 0; return <div className="cp-act" key={a.id}><div className="n"><small>YOUR QUEUE NUMBER</small><strong>{qn(a.queue_number)}</strong><span>{today_ ? `Estimated Wait: ~${queue.slice(0, qi).filter(q => q.status !== "in_service").length * MIN_PER_CUSTOMER} mins` : manilaFmt(a.starts_at, { month: "short", day: "numeric" })}</span></div>
          <div><div style={{ marginBottom: 10 }}><span className="cp-st">{status(a)}</span><span className="cp-muted">Ref: <b>{refNo(a)}</b></span></div><h3 style={{ fontSize: 16, fontWeight: 800 }}>{a.services?.name}</h3><p className="cp-muted" style={{ margin: "8px 0" }}>{manilaFmt(a.starts_at, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} @ {manilaFmt(a.starts_at, { hour: "numeric", minute: "2-digit" })}</p><p className="cp-muted">Barber: <b>{a.barbers?.display_name || "To be assigned"}</b></p><button className="cp-dark" style={{ marginTop: 12 }} onClick={() => go("home")}>View Real-Time Queue</button></div>
          <div style={{ textAlign: "right" }}><div className="cp-muted">Booked on {manilaFmt(a.created_at, { month: "short", day: "numeric", year: "numeric" })}</div><b style={{ color: "#cda653", fontSize: 16 }}>{peso(sp(a))}</b></div></div>; })}
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: "26px 0 10px" }}>Appointment History</h3>
        {hist.length === 0 && <p className="cp-muted">No past appointments yet.</p>}
        {hist.map(a => <div className="cp-hist" key={a.id}><span style={{ display: "flex", alignItems: "center" }}><span className={`cp-st ${a.status === "completed" ? "c" : "x"}`}>{a.status.replace("_", " ").toUpperCase()}</span><span><b>{a.services?.name} ({peso(sp(a))})</b>Date: {manilaFmt(a.starts_at, { month: "long", day: "2-digit", year: "numeric" })} @ {manilaFmt(a.starts_at, { hour: "numeric", minute: "2-digit" })}</span></span><span>Ref: {refNo(a)}</span></div>)}</section>;
    }
  } else if (view === "book") {
    if (!session) body = authPanel;
    else if (ticket) {
      const tk = ticket, st = tk.status === "booked" ? "WAITING FOR CONFIRMATION" : String(tk.status).toUpperCase();
      body = <section className="cp-sec" style={{ textAlign: "center" }}><div className="cp-ok-i"><CheckCircle2 size={24} /></div><h2 className="cp-title" style={{ marginTop: 0 }}>APPOINTMENT REQUEST RECEIVED</h2><p className="cp-sub">Your payment reference was submitted. The shop will verify it and confirm your appointment. Here is your queue information.</p>
        <div className="cp-tk" style={{ textAlign: "left" }}><div className="t"><small>YOUR QUEUE TICKET</small><strong>{qn(tk.queue_number)}</strong><span style={{ fontSize: 10, color: "#b6bdc9" }}>Queue number for {manilaFmt(tk.starts_at, { month: "long", day: "numeric" })}</span></div><div className="b">
          {[["Customer Name", fullName || session.user.email], ["Grooming Service", `${chosen?.name || ""} (${peso(price)})`], ["Date & Schedule", `${manilaFmt(tk.starts_at, { month: "short", day: "numeric", year: "numeric" })} @ ${manilaFmt(tk.starts_at, { hour: "numeric", minute: "2-digit" })}`], ["Assigned Barber", selBarber?.display_name || "Any available barber"]].map(([k, v]) => <div className="r" key={k}>{k}<b>{v}</b></div>)}
          <div className="r" style={{ borderTop: "1px solid #25304a", marginTop: 6, paddingTop: 12 }}>Reference Number<b className="g">{refNo(tk)}</b></div><div className="r">Appointment Status<b><span className="bd" style={{ background: "#fff4dc", color: "#8a641c" }}>{st}</span></b></div></div></div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}><button className="cp-line" onClick={() => window.print()}><Download size={12} style={{ verticalAlign: "middle" }} /> Save Appointment</button><button className="cp-dark" onClick={() => { resetBooking(); go("appointments"); }}>View My Appointment</button></div></section>;
    } else {
      const morning = slotList.filter(s => String(s.slot_time) < "12:00"), later = slotList.filter(s => String(s.slot_time) >= "12:00");
      const slotBtn = s => { const v = String(s.slot_time).slice(0, 5); return <button key={v} disabled={!s.is_available} className={`cp-slot ${time === v ? "sel" : ""}`} onClick={() => setTime(v)}>{t12(v)}</button>; };
      const first = new Date(cal.y, cal.m, 1).getDay(), dim = new Date(cal.y, cal.m + 1, 0).getDate(), [ty, tm] = today().split("-").map(Number), atMin = cal.y === ty && cal.m === tm - 1;
      body = <><Steps /><section className="cp-sec">
        {step === 1 && <><Head n={1} t="Select Your Desired Service" />{services.map(s => <div key={s.id} className={`cp-svc ${service === s.id ? "sel" : ""}`}><div className="cp-img" style={{ backgroundImage: `url(${base}haircut.jpg), linear-gradient(135deg,#1b2740,#111827)`, backgroundSize: "cover", backgroundPosition: "center" }} /><div className="cp-svc-b"><div className="top"><span>{s.name}</span><em>{peso(s.price_pesos)}</em></div><p>{s.description || "Professional barber service."}</p><small style={{ fontWeight: 700 }}>Duration: ~{s.duration_minutes} mins</small><div className="foot"><span className="cp-ok"><Check size={12} style={{ verticalAlign: "middle" }} /> Available Service</span><button className="cp-gold" onClick={() => { setService(s.id); setTime(""); setStep(2); }}>Select Service</button></div></div></div>)}</>}
        {step === 2 && <><Head n={2} t="Choose Appointment Date" /><div className="cp-selbar"><span>Selected Service: <b style={{ color: "#cda653" }}>{chosen?.name} ({peso(price)})</b></span><span>{chosen?.duration_minutes} Mins</span></div>
          <div className="cp-card"><div className="cp-cal-h"><span>{new Date(cal.y, cal.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span><span><button disabled={atMin} onClick={() => setCal(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 })}>‹</button> <button onClick={() => setCal(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 })}>›</button></span></div>
            <div className="cp-cal">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <small key={d}>{d}</small>)}{Array.from({ length: first }, (_, i) => <span key={`e${i}`} />)}{Array.from({ length: dim }, (_, i) => { const ymd = `${cal.y}-${pad(cal.m + 1)}-${pad(i + 1)}`; return <button key={ymd} disabled={ymd < today()} className={date === ymd ? "sel" : ""} onClick={() => { setDate(ymd); setTime(""); }}>{i + 1}</button>; })}</div></div>
          <div className="cp-btns">{back(1)}{next(3, "Next Step")}</div></>}
        {step === 3 && <><Head n={3} t="Select Appointment Time" s={`Shop operating hours: ${SHOP.open}. Start times are offered every 30 minutes for your selected service.`} /><div className="cp-card cp-wide">
          <div className="cp-sel"><span><b style={{ color: "#111827" }}>Selected Date:</b> <b>{longDate(date)}</b></span><span className="cp-muted">Timezone: GMT+8 (Laguna, PH)</span></div>
          <div className="cp-f"><label>Barber</label><select value={barber} onChange={e => { setBarber(e.target.value); setTime(""); }}><option value="any">Any available barber</option>{barbers.map(b => <option key={b.id} value={b.id}>{b.display_name}</option>)}</select></div>
          {slotLoad ? <p className="cp-muted">Checking availability…</p> : slotList.length === 0 ? <p className="cp-muted">No working hours or open times for this date. Please choose another date or barber.</p> : <><div className="cp-h">MORNING SESSIONS</div><div className="cp-slots">{morning.map(slotBtn)}</div><div className="cp-h">AFTERNOON &amp; EVENING SESSIONS</div><div className="cp-slots">{later.map(slotBtn)}</div></>}
          {error && <div className="cp-err">{error}</div>}</div><div className="cp-btns w">{back(2)}{next(4, "Next Step", !!time)}</div></>}
        {step === 4 && <><Head n={4} t="Provide Customer Details" s="These details come from your account. We use your contact number to send booking status updates and track your real-time queue position." /><div className="cp-card">
          <div className="cp-f"><label>Full Name *</label><input readOnly value={fullName} /></div><div className="cp-f"><label>Contact Number (Philippine Mobile) *</label><input readOnly value={phone} /><small>Format: 11 digits starting with 09</small></div>
          {(!fullName || !phone) && <div className="cp-err">Your account is missing a name or mobile number. Please update your profile with the shop before booking.</div>}</div><div className="cp-btns">{back(3)}{next(5, "Review Appointment", !!fullName && !!phone)}</div></>}
        {step === 5 && <><Head n={5} t="Review and Confirm Appointment" s="Please double check your booking and client details. Your appointment is confirmed after the shop verifies your GCash payment." /><div className="cp-card cp-wide"><h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Appointment Details</h3><div className="cp-tbl">
          {[["Customer Name", fullName], ["Service Offered", chosen?.name], ["Price", peso(price), "g"], ["Date & Time", `${longDate(date)} @ ${t12(time)}`], ["Assigned Barber", selBarber?.display_name || "Any available barber"]].map(([k, v, c]) => <div className="r" key={k}>{k}<b className={c}>{v}</b></div>)}</div>
          <h3 style={{ fontSize: 13, fontWeight: 800, margin: "18px 0 4px" }}>GCash Payment</h3><div className="cp-pay">{[["deposit", "50% Downpayment", price / 2], ["full", "100% Full Payment", price]].map(([k, l, a]) => <button key={k} className={payChoice === k ? "sel" : ""} onClick={() => setPayChoice(k)}><b>{l}</b>Pay {peso(a)} now{k === "deposit" ? ` · ${peso(price - a)} at the shop` : ""}</button>)}</div>
          <p className="cp-muted" style={{ textAlign: "center" }}>Scan the shop’s GCash/Instapay QR and send <b>{peso(dueNow)}</b>.</p><img className="cp-qr" src={`${base}media/gcash-qr.jpg`} alt="Royal Barbershop GCash QR" />
          <div className="cp-f"><label>GCash Reference Number *</label><input inputMode="numeric" value={gref} onChange={e => setGref(e.target.value.replace(/\D/g, ""))} placeholder="Digits only (6–25)" /><small>Each reference number can be used once.</small></div>{error && <div className="cp-err">{error}</div>}</div>
          <div className="cp-btns w"><button className="cp-line" onClick={() => { setError(""); setStep(1); }}>Edit Appointment</button><button className="cp-gold" disabled={busy} onClick={confirm}>{busy ? "Submitting…" : "Confirm Appointment"}</button></div></>}
      </section></>;
    }
  }
  return <div className="cp"><style>{styles}</style>{nav}{body}{footer}</div>;
}
