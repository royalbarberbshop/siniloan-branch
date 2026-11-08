import React, { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import {
  LayoutDashboard, CalendarDays, ListOrdered, UserRoundPlus, Users,
  Scissors, ReceiptText, ChartNoAxesCombined, Settings, LogOut,
  Search, Bell, Plus, ChevronDown, Clock3, Check, X, UserRound,
  CreditCard, CircleDollarSign, TrendingUp, Menu, QrCode, Download,
  CircleHelp, CalendarCheck, Banknote, ArrowUpRight, Filter, Printer,
  ShieldCheck, Save, CircleCheck, CircleAlert
} from "lucide-react";

const initialAppointments = [
  { id:"APT-001", queue:"Q-001", customer:"Adrian Dela Cruz", phone:"0917 234 1001", service:"Classic Haircut", barber:"Mark Reyes", date:todayISO(), time:"09:00 AM", status:"Completed", amount:150 },
  { id:"APT-002", queue:"Q-002", customer:"Joshua Santos", phone:"0918 321 2002", service:"Fade Haircut", barber:"Simon Lopez", date:todayISO(), time:"09:30 AM", status:"In Service", amount:200 },
  { id:"APT-003", queue:"Q-003", customer:"Miguel Ramos", phone:"0919 456 3003", service:"Haircut + Beard", barber:"Mark Reyes", date:todayISO(), time:"10:00 AM", status:"Waiting", amount:280 },
  { id:"APT-004", queue:"Q-004", customer:"Daniel Garcia", phone:"0920 567 4004", service:"Classic Haircut", barber:"Unassigned", date:todayISO(), time:"10:30 AM", status:"Checked In", amount:150 },
  { id:"APT-005", queue:"Q-005", customer:"Nathan Flores", phone:"0921 678 5005", service:"Beard Trim", barber:"Simon Lopez", date:todayISO(), time:"11:00 AM", status:"Booked", amount:100 },
  { id:"APT-006", queue:"Q-006", customer:"Ethan Mendoza", phone:"0922 789 6006", service:"Premium Haircut", barber:"Mark Reyes", date:todayISO(), time:"11:30 AM", status:"Cancelled", amount:250 },
  { id:"APT-007", queue:"Q-007", customer:"Gabriel Torres", phone:"0923 890 7007", service:"Classic Haircut", barber:"Simon Lopez", date:todayISO(), time:"01:00 PM", status:"Waiting", amount:150 },
];
function todayISO(){ return new Date().toISOString().slice(0,10); }
const initialServices = [
  {id:1,name:"Classic Haircut",category:"Haircut",duration:30,price:150,active:true},
  {id:2,name:"Fade Haircut",category:"Haircut",duration:40,price:200,active:true},
  {id:3,name:"Premium Haircut",category:"Haircut",duration:45,price:250,active:true},
  {id:4,name:"Beard Trim",category:"Grooming",duration:20,price:100,active:true},
  {id:5,name:"Haircut + Beard",category:"Package",duration:50,price:280,active:true},
];
const initialBarbers = [
  {id:1,name:"Mark Reyes",role:"Senior Barber",status:"Available",schedule:"Mon–Sat · 9:00 AM–6:00 PM",today:8},
  {id:2,name:"Simon Lopez",role:"Master Barber",status:"Busy",schedule:"Tue–Sun · 10:00 AM–7:00 PM",today:6},
  {id:3,name:"Carlo Mendoza",role:"Barber",status:"On Break",schedule:"Mon–Fri · 9:00 AM–5:00 PM",today:3},
];
const initialCustomers = [
  {id:"CUS-001",name:"Adrian Dela Cruz",phone:"0917 234 1001",visits:12,lastVisit:"Oct 12, 2026",status:"Active"},
  {id:"CUS-002",name:"Joshua Santos",phone:"0918 321 2002",visits:8,lastVisit:"Oct 10, 2026",status:"Active"},
  {id:"CUS-003",name:"Miguel Ramos",phone:"0919 456 3003",visits:5,lastVisit:"Oct 08, 2026",status:"Active"},
  {id:"CUS-004",name:"Daniel Garcia",phone:"0920 567 4004",visits:2,lastVisit:"Oct 01, 2026",status:"Active"},
  {id:"CUS-005",name:"Nathan Flores",phone:"0921 678 5005",visits:1,lastVisit:"Sep 25, 2026",status:"Inactive"},
];
const initialSales = [
  {id:"TRX-1038",time:"10:22 AM",customer:"Adrian Dela Cruz",service:"Classic Haircut",barber:"Mark Reyes",amount:150,payment:"Cash",status:"Completed"},
  {id:"TRX-1037",time:"10:10 AM",customer:"Patricia Lim",service:"Haircut + Beard",barber:"Simon Lopez",amount:280,payment:"GCash",status:"Completed"},
  {id:"TRX-1036",time:"09:54 AM",customer:"Joshua Santos",service:"Fade Haircut",barber:"Simon Lopez",amount:200,payment:"Cash",status:"Completed"},
  {id:"TRX-1035",time:"09:20 AM",customer:"Marco Villanueva",service:"Premium Haircut",barber:"Mark Reyes",amount:250,payment:"GCash",status:"Completed"},
];

const navGroups = [
  {label:"OVERVIEW", items:[["Dashboard",LayoutDashboard],["Appointments",CalendarDays],["Live Queue",ListOrdered],["Register Walk-in",UserRoundPlus]]},
  {label:"MANAGEMENT", items:[["Customers",Users],["Barbers & Staff",Scissors],["Services & Pricing",ReceiptText]]},
  {label:"OPERATIONS", items:[["Point of Sale",CreditCard],["Sales & Cash Drawer",CircleDollarSign],["Reports & Analytics",ChartNoAxesCombined]]},
  {label:"SYSTEM", items:[["Settings",Settings]]}
];

function money(n){ return new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",maximumFractionDigits:2}).format(n || 0); }
function readStorage(key, fallback){ try { const v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function Status({value}) {
  const key = String(value || "").toLowerCase().replaceAll(" ","-");
  return <span className={`status status-${key}`}>{value}</span>;
}
function Button({children,onClick,kind="primary",icon:Icon,disabled=false}) {
  return <button type={onClick ? "button" : "submit"} className={`btn btn-${kind}`} onClick={onClick} disabled={disabled}>{Icon && <Icon size={15}/>}<span>{children}</span></button>;
}
function PageTitle({title,subtitle,action}) {
  return <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}
function Metric({label,value,change,icon:Icon,tone="gold"}) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19}/></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong>{change && <small><TrendingUp size={12}/> {change}</small>}</div></div>;
}
function EmptyState({title="Nothing here yet",text="New records will appear here."}) {
  return <div className="empty-state"><CircleHelp size={25}/><strong>{title}</strong><span>{text}</span></div>;
}

export default function App({ profile, onSignOut }){
  const [page,setPage] = useState("Dashboard");
  const [mobileNav,setMobileNav] = useState(false);
  const [search,setSearch] = useState("");
  const [appointments,setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [customers,setCustomers] = useState(()=>readStorage("royal-customers",initialCustomers));
  const [barbers,setBarbers] = useState([]);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [barbersError, setBarbersError] = useState("");
  const [services,setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [sales,setSales] = useState(()=>readStorage("royal-sales",initialSales));
  const [toast,setToast] = useState("");
  const [modal,setModal] = useState(null);
  const [profileName,setProfileName] = useState(profile?.full_name || "Shop Administrator");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAppointmentsError("Supabase is not configured.");
      return;
    }
    let cancelled = false;
    let refreshTimer;

    async function loadAppointments(showLoading = false) {
      if (showLoading) setAppointmentsLoading(true);
      setAppointmentsError("");
      const { data, error } = await supabase
        .from("appointments")
        .select(`id, starts_at, queue_date, queue_number, status, payment_status,
          customer:profiles!appointments_customer_id_fkey(full_name, phone),
          walk_in_customer:walk_in_customers!appointments_walk_in_customer_id_fkey(full_name, phone),
          service:services!appointments_service_id_fkey(name, price_pesos),
          barber:barbers!appointments_barber_id_fkey(display_name),
          preferred_barber:barbers!appointments_preferred_barber_id_fkey(display_name)`)
        .order("queue_date", { ascending: false })
        .order("queue_number", { ascending: true });
      if (cancelled) return;
      if (error) {
        setAppointmentsError(error.message);
        setAppointmentsLoading(false);
        return;
      }
      const statusLabels = {
        booked: "Booked", checked_in: "Checked In", waiting: "Waiting",
        in_service: "In Service", completed: "Completed", cancelled: "Cancelled", no_show: "No Show"
      };
      setAppointments((data || []).map(row => {
        const starts = new Date(row.starts_at);
        return {
          id: row.id,
          reference: `APT-${String(row.id).slice(0, 8).toUpperCase()}`,
          queue: `Q-${String(row.queue_number).padStart(3, "0")}`,
          queueNumber: row.queue_number,
          customer: row.customer?.full_name || row.walk_in_customer?.full_name || "Customer",
          phone: row.customer?.phone || row.walk_in_customer?.phone || "",
          service: row.service?.name || "Service unavailable",
          barber: row.barber?.display_name || row.preferred_barber?.display_name || "Unassigned",
          date: row.queue_date,
          time: starts.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }),
          status: statusLabels[row.status] || row.status,
          amount: Number(row.service?.price_pesos || 0),
          paymentStatus: row.payment_status,
        };
      }));
      setAppointmentsLoading(false);
    }

    loadAppointments(true);

    // Keep this dashboard synchronized when another admin device registers a
    // walk-in or changes an appointment's queue status.
    const channel = supabase
      .channel("admin-live-appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => loadAppointments(false), 180);
      })
      .subscribe();

    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(()=>localStorage.setItem("royal-customers",JSON.stringify(customers)),[customers]);
    useEffect(()=>localStorage.setItem("royal-sales",JSON.stringify(sales)),[sales]);
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let cancelled = false;
    async function loadBarbers() {
      setBarbersLoading(true);
      setBarbersError("");
      const { data, error } = await supabase
        .from("barbers")
        .select("id, display_name, role, availability_status, is_active")
        .order("display_name");
      if (cancelled) return;
      if (error) {
        setBarbersError(error.message);
        setBarbersLoading(false);
        return;
      }
      setBarbers((data || []).map(row => ({
        id: row.id,
        name: row.display_name,
        role: row.role || "Barber",
        status: row.availability_status || (row.is_active ? "Available" : "Inactive"),
        schedule: "Schedule not configured",
        today: 0,
      })));
      setBarbersLoading(false);
    }
    loadBarbers();
    return () => { cancelled = true; };
  }, []);

  const saveBarber = async (draft, editingId) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const payload = {
      display_name: draft.name.trim(),
      role: draft.role || "Barber",
      availability_status: draft.status || "Available",
      is_active: (draft.status || "Available") !== "Inactive",
    };
    if (!payload.display_name) throw new Error("Enter the barber's full name.");
    const query = editingId
      ? supabase.from("barbers").update(payload).eq("id", editingId)
      : supabase.from("barbers").insert(payload);
    const { data, error } = await query
      .select("id, display_name, role, availability_status, is_active")
      .single();
    if (error) throw error;
    const saved = {
      id: data.id,
      name: data.display_name,
      role: data.role || "Barber",
      status: data.availability_status || "Available",
      schedule: "Schedule not configured",
      today: 0,
    };
    setBarbers(current => {
      const next = editingId ? current.map(item => item.id === editingId ? saved : item) : [...current, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    return saved;
  };

  const updateBarberStatus = async (barber, status) => {
    await saveBarber({ name: barber.name, role: barber.role, status }, barber.id);
  };

  useEffect(() => {
  if (!isSupabaseConfigured || !supabase) return;

  let cancelled = false;

  async function loadServices() {
    setServicesLoading(true);
    setServicesError("");

    const { data, error } = await supabase
      .from("services")
      .select("id, name, description, category, duration_minutes, price_pesos, is_active")
      .order("name");

    if (cancelled) return;

    if (error) {
      setServicesError(error.message);
      setServicesLoading(false);
      return;
    }

    setServices(
      data.map(service => ({
        id: service.id,
        name: service.name,
        category: service.category || "Other",
        duration: service.duration_minutes,
        price: Number(service.price_pesos),
        active: service.is_active,
        description: service.description ?? ""
      }))
    );

    setServicesLoading(false);
  }

  loadServices();

  return () => {
    cancelled = true;
  };
}, []);

  const saveService = async (draft, editingId) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const payload = {
      name: draft.name.trim(),
      description: (draft.description || "").trim() || null,
      category: draft.category || "Other",
      duration_minutes: Number(draft.duration),
      price_pesos: Number(draft.price),
      is_active: Boolean(draft.active),
    };

    if (!payload.name) throw new Error("Enter a service name.");
    if (!Number.isInteger(payload.duration_minutes) || payload.duration_minutes < 5 || payload.duration_minutes > 360) {
      throw new Error("Duration must be between 5 and 360 minutes.");
    }
    if (!Number.isFinite(payload.price_pesos) || payload.price_pesos < 0) {
      throw new Error("Enter a valid service price.");
    }

    const query = editingId
      ? supabase.from("services").update(payload).eq("id", editingId)
      : supabase.from("services").insert(payload);

    const { data, error } = await query
      .select("id, name, description, category, duration_minutes, price_pesos, is_active")
      .single();

    if (error) throw error;

    const saved = {
      id: data.id,
      name: data.name,
      description: data.description || "",
      category: data.category || "Other",
      duration: data.duration_minutes,
      price: Number(data.price_pesos),
      active: data.is_active,
    };

    setServices(current => {
      const next = editingId
        ? current.map(item => item.id === editingId ? saved : item)
        : [...current, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });

    return saved;
  };

  const notify = (message)=>{ setToast(message); window.setTimeout(()=>setToast(""),2800); };
  const navigate = (name)=>{setPage(name);setMobileNav(false);setSearch("");};
  const updateStatus = async (id, status) => {
    if (!supabase) { notify("Supabase is not configured."); return; }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id))) {
      notify("This appointment has no valid database ID. Refresh the page and try again.");
      return;
    }
    const statusValues = { "Booked": "booked", "Checked In": "checked_in", "Waiting": "waiting", "In Service": "in_service", "Completed": "completed", "Cancelled": "cancelled", "No Show": "no_show" };
    const nextStatus = statusValues[status];
    if (!nextStatus) { notify("Unsupported appointment status."); return; }
    const { error } = await supabase.rpc("admin_update_appointment_status", {
      p_appointment_id: id,
      p_new_status: nextStatus,
    });
    if (error) { notify(`Could not update appointment: ${error.message}`); return; }
    setAppointments(current => current.map(item => item.id === id ? { ...item, status } : item));
    notify(`Appointment marked ${status.toLowerCase()}.`);
  };
  const addWalkIn = async (form)=>{
    if (!supabase) { notify("Supabase is not configured."); return; }
    const service = services.find(s => s.name === form.service);
    const barber = barbers.find(b => b.name === form.barber);
    if (!form.name?.trim() || !form.phone?.trim()) { notify("Enter the customer's name and phone number."); return; }
    if (!service?.id) { notify("Choose an active service before registering the walk-in."); return; }
    try {
      const { data, error } = await supabase.rpc("admin_register_walk_in", {
        p_customer_name: form.name.trim(),
        p_customer_phone: form.phone.trim(),
        p_service_id: service.id,
        p_barber_id: barber?.id || null,
      });
      if (error) throw error;
      const created = Array.isArray(data) ? data[0] : data;
      if (!created?.id || !created?.queue_number) throw new Error("The database did not return the new appointment details.");
      const item = {
        id: created.id,
        reference: `APT-${String(created.id).slice(0, 8).toUpperCase()}`,
        queue: `Q-${String(created.queue_number).padStart(3, "0")}`,
        customer: form.name.trim(), phone: form.phone.trim(), service: service.name,
        barber: barber?.name || "Unassigned", date: created.queue_date,
        time: new Date(created.starts_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
        status: "Waiting", amount: Number(service.price || 0), paymentStatus: "unpaid",
      };
      setAppointments(current => [item, ...current]);
      setModal(null);
      navigate("Live Queue");
      notify(`Walk-in saved. Queue number ${item.queue}.`);
    } catch (error) {
      notify(`Could not register walk-in: ${error?.message || "Unknown error"}`);
    }
  };
  const checkout = (form)=>{
    if(!form.items.length){notify("Add at least one service before checkout.");return;}
    const amount=form.items.reduce((sum,s)=>sum+s.price,0);
    const sale={id:`TRX-${String(Date.now()).slice(-6)}`,time:new Date().toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}),customer:form.customer||"Walk-in Customer",service:form.items.map(x=>x.name).join(", "),barber:form.barber,amount,payment:form.payment,status:"Completed"};
    setSales(s=>[sale,...s]);
    setAppointments(a=>a.map(x=>x.customer===form.customer&&x.status!=="Completed"?{...x,status:"Completed"}:x));
    setModal(null);notify(`Sale recorded: ${money(amount)}.`);
  };
  const currentPage = page;
  const commonProps = {
  appointments, setAppointments,
  customers, setCustomers,
  barbers, setBarbers,
  services, setServices,
  appointmentsLoading, appointmentsError,
  servicesLoading, servicesError, saveService,
  barbersLoading, barbersError, saveBarber, updateBarberStatus,
  sales, setSales,
  search, setSearch,
  notify, setModal,
  updateStatus, navigate, addWalkIn, checkout
};
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?"sidebar-open":""}`}>
      <div className="brand"><div className="brand-mark">R</div><div><strong>ROYAL</strong><span>BARBER SHOP</span></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="shop-label"><span className="online-dot"></span> SHOP MANAGEMENT</div>
      <nav>{navGroups.map(group=><div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(([name,Icon])=><button key={name} className={`nav-item ${currentPage===name?"active":""}`} onClick={()=>navigate(name)}><Icon size={17}/><span>{name}</span>{name==="Live Queue"&&<em>{appointments.filter(a=>["Waiting","Checked In"].includes(a.status)).length}</em>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="user-avatar">SA</div><div className="user-meta"><strong>{profileName}</strong><span>Administrator</span></div><button title="Sign out" onClick={onSignOut}><LogOut size={16}/></button></div>
    </aside>
    {mobileNav && <div className="scrim" onClick={()=>setMobileNav(false)}></div>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu/></button><div className="breadcrumb">Royal Barber Shop <span>/</span> <strong>{page}</strong></div><div className="top-actions"><div className="open-status"><span className="online-dot"></span> Shop Open</div><button className="icon-button" onClick={()=>notify("You're all caught up.")} aria-label="Notifications"><Bell size={18}/><i></i></button><div className="top-user"><div className="user-avatar">SA</div><div><strong>{profileName}</strong><span>Administrator</span></div><ChevronDown size={15}/></div></div></header>
      <div className="content">
        {page==="Dashboard" && <Dashboard {...commonProps}/>}
        {page==="Appointments" && <Appointments {...commonProps}/>}
        {page==="Live Queue" && <Queue {...commonProps}/>}
        {page==="Register Walk-in" && <WalkIn {...commonProps}/>}
        {page==="Customers" && <Customers {...commonProps}/>}
        {page==="Barbers & Staff" && <Barbers {...commonProps}/>}
        {page==="Services & Pricing" && <Services {...commonProps}/>}
        {page==="Point of Sale" && <POS {...commonProps}/>}
        {page==="Sales & Cash Drawer" && <Sales {...commonProps}/>}
        {page==="Reports & Analytics" && <Reports {...commonProps}/>}
        {page==="Settings" && <SettingsPage profileName={profileName} setProfileName={setProfileName} notify={notify}/>}
      </div>
      <footer className="footer"><span>© 2026 Royal Barber Shop</span><span>Admin workspace <b>•</b> Supabase connected</span></footer>
    </main>
    {modal && <Modal modal={modal} setModal={setModal} services={services} barbers={barbers} setBarbers={setBarbers} customers={customers} setCustomers={setCustomers} addWalkIn={addWalkIn} checkout={checkout} notify={notify}/>}
    {toast && <div className="toast"><CircleCheck size={17}/>{toast}</div>}
  </div>;
}

function Dashboard(p){
  const today = p.appointments.filter(a=>a.date===todayISO());
  const waiting = today.filter(a=>["Waiting","Checked In"].includes(a.status));
  const inService = today.filter(a=>a.status==="In Service");
  const completed = today.filter(a=>a.status==="Completed");
  const revenue = p.sales.reduce((n,s)=>n+s.amount,0);
  return <>
    <PageTitle title="Dashboard" subtitle="Here's what's happening at Royal Barber Shop today." action={<Button icon={Plus} onClick={()=>p.setModal({type:"walkin"})}>Register Walk-in</Button>}/>
    <div className="welcome-strip"><div><span className="eyebrow">TUESDAY · SHOP OVERVIEW</span><h2>Welcome back, Administrator <span>✦</span></h2><p>Keep your shop running smoothly. Here's your daily overview.</p></div><div className="welcome-date"><CalendarDays size={16}/>{new Date().toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</div></div>
    <div className="metrics-grid">
      <Metric label="Today's Appointments" value={today.length} change="+12% vs. last week" icon={CalendarCheck}/>
      <Metric label="Waiting Customers" value={waiting.length} icon={Clock3} tone="blue"/>
      <Metric label="Currently In Service" value={inService.length} icon={Scissors} tone="purple"/>
      <Metric label="Today's Sales (demo)" value={money(revenue)} change="From recorded demo transactions" icon={CircleDollarSign} tone="green"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel span-two"><div className="panel-head"><div><h3>Live Queue Overview</h3><p>Customers waiting to be served</p></div><button className="text-link" onClick={()=>p.navigate("Live Queue")}>View live queue <ArrowUpRight size={14}/></button></div>
        {waiting.length ? <div className="queue-preview">{waiting.slice(0,4).map(a=><div className="queue-preview-row" key={a.id}><div className="queue-number">{a.queue}</div><div className="queue-customer"><strong>{a.customer}</strong><span>{a.service} · {a.barber}</span></div><Status value={a.status}/><span className="queue-time">{a.time}</span><button className="small-action" onClick={()=>p.updateStatus(a.id,"In Service")} title="Call customer"><Scissors size={15}/></button></div>)}</div>:<EmptyState title="Queue is clear" text="New checked-in customers will appear here."/>}
      </section>
      <section className="panel"><div className="panel-head"><div><h3>Quick Actions</h3><p>Common tasks</p></div></div><div className="quick-actions"><button onClick={()=>p.setModal({type:"walkin"})}><span className="quick-icon gold-bg"><UserRoundPlus/></span><span><strong>Register Walk-in</strong><small>Add a walk-in customer</small></span><Plus size={15}/></button><button onClick={()=>p.navigate("Appointments")}><span className="quick-icon blue-bg"><CalendarDays/></span><span><strong>View Appointments</strong><small>Manage today's bookings</small></span><ArrowUpRight size={15}/></button><button onClick={()=>p.navigate("Point of Sale")}><span className="quick-icon green-bg"><CreditCard/></span><span><strong>Open POS</strong><small>Record a service payment</small></span><ArrowUpRight size={15}/></button><button onClick={()=>p.navigate("Reports & Analytics")}><span className="quick-icon purple-bg"><ChartNoAxesCombined/></span><span><strong>View Reports</strong><small>Review shop performance</small></span><ArrowUpRight size={15}/></button></div></section>
      <section className="panel span-two"><div className="panel-head"><div><h3>Today's Appointments</h3><p>Latest bookings and service progress</p></div><button className="text-link" onClick={()=>p.navigate("Appointments")}>View all <ArrowUpRight size={14}/></button></div><AppointmentTable appointments={today.slice(0,5)} updateStatus={p.updateStatus} compact/></section>
      <section className="panel"><div className="panel-head"><div><h3>Barbers on Shift</h3><p>Current team availability</p></div><button className="text-link" onClick={()=>p.navigate("Barbers & Staff")}>Manage</button></div><div className="barber-list">{p.barbers.map(b=><div className="barber-row" key={b.id}><div className="person-avatar">{b.name.split(" ").map(s=>s[0]).join("").slice(0,2)}</div><div className="person-details"><strong>{b.name}</strong><span>{b.role}</span></div><Status value={b.status}/></div>)}</div></section>
    </div>
  </>;
}

function AppointmentTable({appointments,updateStatus,compact=false}){
  if(!appointments.length) return <EmptyState title="No appointments found" text="Appointments created through the booking workflow will appear here." />;
  return <div className="table-wrap"><table><thead><tr><th>QUEUE / ID</th><th>CUSTOMER</th><th>SERVICE</th><th>TIME</th><th>STATUS</th><th></th></tr></thead><tbody>{appointments.map(a=><tr key={a.id}><td><strong className="mono">{a.queue}</strong><small className="cell-sub">{a.reference || `APT-${String(a.id).slice(0, 8).toUpperCase()}`}</small></td><td><strong>{a.customer}</strong><small className="cell-sub">{a.phone}</small></td><td>{a.service}<small className="cell-sub">{a.barber}</small></td><td>{a.time}</td><td><Status value={a.status}/></td><td><div className="row-actions">{a.status==="Booked"&&<button className="mini-btn" onClick={()=>updateStatus(a.id,"Checked In")}>Check in</button>}{a.status==="Checked In"&&<button className="mini-btn" onClick={()=>updateStatus(a.id,"Waiting")}>Add to queue</button>}{a.status==="Waiting"&&<button className="mini-btn" onClick={()=>updateStatus(a.id,"In Service")}>Call</button>}{a.status==="In Service"&&<button className="mini-btn success" onClick={()=>updateStatus(a.id,"Completed")}>Complete</button>}{!["Booked","Checked In","Waiting","In Service"].includes(a.status)&&<button className="mini-btn muted" title="No available action">Details</button>}</div></td></tr>)}</tbody></table></div>;
}

function Appointments(p){
  const [filter,setFilter]=useState("All");
  const items=p.appointments.filter(a=>(filter==="All"||a.status===filter)&&`${a.customer} ${a.queue} ${a.service} ${a.phone}`.toLowerCase().includes(p.search.toLowerCase()));
  return <><PageTitle title="Appointments & Queue Management" subtitle="Manage bookings, check-ins, and service progress." action={<span className="small-note">Bookings are created through the customer booking workflow.</span>}/>{p.appointmentsError&&<div className="notice notice-error">Unable to load appointments: {p.appointmentsError}</div>}{p.appointmentsLoading&&<div className="notice">Loading appointments from Supabase…</div>}<div className="metrics-grid compact-metrics"><Metric label="Total Bookings" value={p.appointments.length} icon={CalendarDays}/><Metric label="Waiting" value={p.appointments.filter(a=>a.status==="Waiting").length} icon={Clock3} tone="blue"/><Metric label="In Service" value={p.appointments.filter(a=>a.status==="In Service").length} icon={Scissors} tone="purple"/><Metric label="Completed" value={p.appointments.filter(a=>a.status==="Completed").length} icon={Check} tone="green"/></div><section className="panel"><div className="table-toolbar"><div className="search-box"><Search size={16}/><input value={p.search} onChange={e=>p.setSearch(e.target.value)} placeholder="Search customer, queue number..."/></div><div className="toolbar-right"><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{["Booked","Checked In","Waiting","In Service","Completed","Cancelled","No Show"].map(s=><option key={s}>{s}</option>)}</select><button className="btn btn-secondary" onClick={()=>{p.setSearch("");setFilter("All")}}><Filter size={15}/> Reset</button></div></div>{!p.appointmentsLoading&&<AppointmentTable appointments={items} updateStatus={p.updateStatus}/>}</section></>;
}

function Queue(p){
  const [filter,setFilter]=useState("Active");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const todaysAppointments = p.appointments.filter(a => a.date === today);
  const active=todaysAppointments.filter(a=>["Waiting","Checked In","In Service"].includes(a.status)).sort((a,b)=>(a.queueNumber||0)-(b.queueNumber||0));
  const items=(filter==="Active"?active:todaysAppointments.filter(a=>a.status===filter)).filter(a=>`${a.customer} ${a.queue} ${a.service}`.toLowerCase().includes(p.search.toLowerCase()));
  const next=active.find(a=>a.status==="Waiting"||a.status==="Checked In");
  return <><PageTitle title="Live Queue Management" subtitle="Check in customers, call the next customer, and update service status." action={<Button icon={Plus} onClick={()=>p.setModal({type:"walkin"})}>Add Walk-in</Button>}/>{p.appointmentsLoading&&<div className="notice">Loading today's queue…</div>}{p.appointmentsError&&<div className="notice notice-error">Unable to sync the live queue: {p.appointmentsError}</div>}<div className="queue-layout"><div className="queue-main"><section className="panel"><div className="panel-head"><div><h3>Live Waiting Queue</h3><p>{active.length} active customers</p></div><div className="live-pill"><span></span> LIVE</div></div><div className="table-toolbar"><div className="search-box"><Search size={16}/><input value={p.search} onChange={e=>p.setSearch(e.target.value)} placeholder="Search queue or customer"/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Active</option>{["Booked","Waiting","Checked In","In Service","Completed","Cancelled"].map(s=><option key={s}>{s}</option>)}</select></div>{items.length?<div className="queue-cards">{items.map(a=><div className={`queue-card ${a.status==="In Service"?"serving":""}`} key={a.id}><div className="queue-card-num">{a.queue}</div><div className="queue-card-info"><strong>{a.customer}</strong><span>{a.service} · {a.barber}</span><small><Clock3 size={12}/>{a.time}</small></div><Status value={a.status}/><div className="queue-card-actions">{a.status==="Booked"&&<Button kind="secondary" onClick={()=>p.updateStatus(a.id,"Checked In")}>Check in</Button>}{a.status==="Checked In"&&<Button onClick={()=>p.updateStatus(a.id,"Waiting")}>Join queue</Button>}{a.status==="Waiting"&&<Button onClick={()=>p.updateStatus(a.id,"In Service")} icon={Scissors}>Call customer</Button>}{a.status==="In Service"&&<Button kind="success" onClick={()=>p.updateStatus(a.id,"Completed")} icon={Check}>Complete</Button>}</div></div>)}</div>:<EmptyState title="No customers in this view" text="Add a walk-in or change the status filter."/>}</section></div><aside className="queue-side"><section className="current-ticket"><span className="eyebrow">NEXT IN LINE</span><div className="ticket-number">{next?.queue||"—"}</div><h3>{next?.customer||"No waiting customers"}</h3><p>{next?next.service:"The queue is currently clear."}</p>{next&&<Button block icon={Scissors} onClick={()=>p.updateStatus(next.id,"In Service")}>Call Next Customer</Button>}<div className="ticket-divider"></div><div className="ticket-stat"><span>Waiting</span><strong>{active.filter(a=>a.status==="Waiting"||a.status==="Checked In").length}</strong></div><div className="ticket-stat"><span>In service</span><strong>{active.filter(a=>a.status==="In Service").length}</strong></div></section><section className="panel"><h3>Queue guidelines</h3><ul className="guidelines"><li>Verify appointment before check-in.</li><li>Only mark “In Service” when the barber is ready.</li><li>Complete service after it is finished.</li><li>Use the POS page to record payment.</li></ul></section></aside></div></>;
}

function WalkIn(p){
  const [form,setForm]=useState({name:"",phone:"",service:p.services[0]?.name||"",barber:"Unassigned"});
  const change=(k,v)=>setForm(f=>({...f,[k]:v}));
  const selected=p.services.find(s=>s.name===form.service);
  return <><PageTitle title="Register Walk-in Customer" subtitle="Create a queue ticket for a customer who arrived without an online booking."/><div className="form-page-grid"><section className="panel form-panel"><div className="form-heading"><div className="form-icon"><UserRoundPlus/></div><div><h3>Queue Entry Form</h3><p>Fields marked with * are required.</p></div></div><form onSubmit={e=>{e.preventDefault();p.addWalkIn(form)}} className="form-grid"><label className="full">Customer full name *<input required value={form.name} onChange={e=>change("name",e.target.value)} placeholder="Enter customer's name"/></label><label>Contact number *<input required pattern="[0-9+ ()-]{7,20}" value={form.phone} onChange={e=>change("phone",e.target.value)} placeholder="09XX XXX XXXX"/></label><label>Service *<select value={form.service} onChange={e=>change("service",e.target.value)}>{p.services.filter(s=>s.active).map(s=><option key={s.id} value={s.name}>{s.name}</option>)}</select></label><label className="full">Preferred barber<select value={form.barber} onChange={e=>change("barber",e.target.value)}><option>Unassigned</option>{p.barbers.map(b=><option key={b.id}>{b.name}</option>)}</select></label><div className="form-actions full"><Button kind="secondary" onClick={()=>setForm({name:"",phone:"",service:p.services[0]?.name||"",barber:"Unassigned"})}>Clear</Button><Button icon={QrCode}>Register & Generate Ticket</Button></div></form></section><aside className="ticket-preview panel"><span className="eyebrow">TICKET PREVIEW</span><div className="preview-logo">R</div><h3>ROYAL BARBER SHOP</h3><p>Queue Entry Ticket</p><div className="preview-dash"></div><span className="preview-label">SERVICE</span><strong>{form.service}</strong><span className="preview-label">CUSTOMER</span><strong>{form.name||"Customer name"}</strong><div className="preview-queue">Q-###</div><p className="muted-text">Queue number is assigned when registered.</p><div className="price-line"><span>Estimated service price</span><strong>{money(selected?.price||0)}</strong></div></aside></div></>;
}

function Customers(p){
  const rows=p.customers.filter(c=>`${c.name} ${c.phone} ${c.id}`.toLowerCase().includes(p.search.toLowerCase()));
  return <><PageTitle title="Customer Directory" subtitle="Search customer profiles and review visit history." action={<Button icon={Plus} onClick={()=>p.setModal({type:"customer"})}>Add Customer</Button>}/><div className="metrics-grid compact-metrics"><Metric label="Total Customers" value={p.customers.length} icon={Users}/><Metric label="Active Profiles" value={p.customers.filter(c=>c.status==="Active").length} icon={ShieldCheck} tone="green"/><Metric label="Repeat Customers" value={p.customers.filter(c=>c.visits>=5).length} icon={TrendingUp} tone="blue"/><Metric label="Customer Records" value="Demo" icon={ReceiptText} tone="purple"/></div><section className="panel"><div className="table-toolbar"><div className="search-box"><Search size={16}/><input value={p.search} onChange={e=>p.setSearch(e.target.value)} placeholder="Search name, phone, or customer ID"/></div><span className="muted-text">{rows.length} customers</span></div><div className="table-wrap"><table><thead><tr><th>CUSTOMER ID</th><th>CUSTOMER</th><th>PHONE NUMBER</th><th>TOTAL VISITS</th><th>LAST VISIT</th><th>STATUS</th></tr></thead><tbody>{rows.map(c=><tr key={c.id}><td className="mono">{c.id}</td><td><strong>{c.name}</strong></td><td>{c.phone}</td><td>{c.visits}</td><td>{c.lastVisit}</td><td><Status value={c.status}/></td></tr>)}</tbody></table></div></section></>;
}

function Barbers(p){
  const [editing, setEditing] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState({name:"", role:"Barber", status:"Available"});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const openEditor = barber => {
    setEditorOpen(true);
    setEditing(barber?.id || null);
    setDraft({name:barber?.name || "", role:barber?.role || "Barber", status:barber?.status || "Available"});
    setFormError("");
  };
  const save = async event => {
    event.preventDefault();
    setSaving(true); setFormError("");
    try {
      await p.saveBarber(draft, editing);
      setEditorOpen(false); setEditing(null); setDraft({name:"", role:"Barber", status:"Available"});
      p.notify(editing ? "Barber profile updated in Supabase." : "Barber added to Supabase.");
    } catch (error) { setFormError(error.message || "Unable to save barber."); }
    finally { setSaving(false); }
  };
  return <>
    <PageTitle title="Barbers & Staff Roster" subtitle="Manage barber profiles, shift information, and current availability." action={<Button icon={Plus} onClick={()=>openEditor(null)}>Add New Barber</Button>}/>
    {p.barbersLoading && <div className="notice">Loading barber records from Supabase…</div>}
    {p.barbersError && <div className="notice notice-error">Unable to load barbers: {p.barbersError}</div>}
    {!p.barbersLoading && !p.barbersError && p.barbers.length===0 && <section className="panel"><EmptyState title="No barbers yet" text="Add a barber to create the first roster record."/></section>}
    <div className="barber-grid">{p.barbers.map(b=><section className="panel barber-profile" key={b.id}>
      <div className="barber-profile-top"><div className="barber-big-avatar">{b.name.split(" ").map(s=>s[0]).join("").slice(0,2)}</div><Status value={b.status}/></div>
      <h3>{b.name}</h3><p>{b.role}</p><div className="barber-info-line"><Clock3 size={15}/><span>{b.schedule}</span></div>
      <div className="barber-stats"><div><strong>—</strong><span>Services today</span></div><div><strong>—</strong><span>Service value today</span></div></div>
      <div className="barber-card-actions"><Button kind="secondary" onClick={()=>openEditor(b)}>Edit Profile</Button><Button kind={b.status==="Available"?"secondary":"success"} onClick={async()=>{try{await p.updateBarberStatus(b,b.status==="Available"?"On Break":"Available");p.notify("Barber availability saved to Supabase.");}catch(error){p.notify(`Unable to update availability: ${error.message}`);}}}>{b.status==="Available"?"Set Break":"Set Available"}</Button></div>
    </section>)}</div>
    <section className="panel"><h3>Staff scheduling note</h3><p className="muted-text">Barber profiles are saved in Supabase. Shift schedules are managed separately through barber working hours and are not configured here yet.</p></section>
    { editorOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setEditorOpen(false);setEditing(null);setDraft({name:"",role:"Barber",status:"Available"});}}}><div className="modal"><div className="modal-head"><div><h2>{editing ? "Edit Barber" : "Add Barber"}</h2><p>{editing ? "Update this barber's roster profile." : "Add a barber profile to the roster."}</p></div><button onClick={()=>{setEditorOpen(false);setEditing(null);setDraft({name:"",role:"Barber",status:"Available"});}}><X/></button></div><form className="modal-form" onSubmit={save}>
      <label>Full name<input required value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder="Enter full name"/></label>
      <label>Role<select value={draft.role} onChange={e=>setDraft(d=>({...d,role:e.target.value}))}><option>Barber</option><option>Senior Barber</option><option>Master Barber</option><option>Manager</option></select></label>
      <label>Availability<select value={draft.status} onChange={e=>setDraft(d=>({...d,status:e.target.value}))}><option>Available</option><option>On Break</option><option>Busy</option><option>Inactive</option></select></label>
      {formError && <div className="notice notice-error">{formError}</div>}
      <div className="modal-actions"><Button kind="secondary" onClick={()=>{setEditorOpen(false);setEditing(null);setDraft({name:"",role:"Barber",status:"Available"});}}>Cancel</Button><Button disabled={saving}>{saving?"Saving…":"Save Barber"}</Button></div>
    </form></div></div>}
  </>;
}

function Services(p){
  const [editing,setEditing]=useState(null);
  const [saving,setSaving]=useState(false);
  const [formError,setFormError]=useState("");
  const emptyDraft={name:"",description:"",category:"Haircut",duration:30,price:150,active:true};
  const [draft,setDraft]=useState(emptyDraft);
  const reset=()=>{setEditing(null);setDraft(emptyDraft);setFormError("");};
  const save=async()=>{
    setFormError("");
    setSaving(true);
    try{
      await p.saveService(draft,editing);
      reset();
      p.notify(editing?"Service updated in Supabase.":"Service added to Supabase.");
    }catch(error){
      setFormError(error?.message||"Unable to save this service. Please try again.");
    }finally{
      setSaving(false);
    }
  };
  return <><PageTitle title="Services & Pricing" subtitle="Manage the shop's service catalog and prices stored in Supabase." action={<Button icon={Plus} onClick={reset}>Add Service</Button>}/>
    {p.servicesError&&<div className="notice notice-error" role="alert">Unable to load services: {p.servicesError}</div>}
    <div className="service-layout">
      <section className="panel">
        <div className="panel-head"><div><h3>Service Catalog</h3><p>{p.services.length} services configured in the database</p></div></div>
        {p.servicesLoading?<div className="empty-state">Loading services from Supabase…</div>:p.services.length===0?<EmptyState title="No services added yet" text="Add your shop's first service using the form."/>:
        <div className="table-wrap"><table><thead><tr><th>SERVICE</th><th>CATEGORY</th><th>DURATION</th><th>PRICE</th><th>STATUS</th><th></th></tr></thead><tbody>{p.services.map(s=><tr key={s.id}><td><strong>{s.name}</strong>{s.description&&<small className="muted-text" style={{display:"block"}}>{s.description}</small>}</td><td>{s.category}</td><td>{s.duration} min</td><td><strong>{money(s.price)}</strong></td><td><Status value={s.active?"Active":"Inactive"}/></td><td><button className="mini-btn" onClick={()=>{setEditing(s.id);setDraft({...s});setFormError("");}}>Edit</button></td></tr>)}</tbody></table></div>}
      </section>
      <section className="panel service-editor">
        <h3>{editing?"Edit Service":"New Service"}</h3>
        <p className="muted-text">Changes are saved directly to your Supabase database.</p>
        <label>Service name<input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} placeholder="e.g. Classic Haircut" maxLength={120}/></label>
        <label>Description (optional)<input value={draft.description||""} onChange={e=>setDraft(d=>({...d,description:e.target.value}))} placeholder="Short service description" maxLength={500}/></label>
        <label>Category<select value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value}))}><option>Haircut</option><option>Grooming</option><option>Package</option><option>Other</option></select></label>
        <div className="two-fields"><label>Duration (minutes)<input type="number" min="5" max="360" step="1" value={draft.duration} onChange={e=>setDraft(d=>({...d,duration:e.target.value}))}/></label><label>Price (PHP)<input type="number" min="0" step="0.01" value={draft.price} onChange={e=>setDraft(d=>({...d,price:e.target.value}))}/></label></div>
        <label className="check-label"><input type="checkbox" checked={draft.active} onChange={e=>setDraft(d=>({...d,active:e.target.checked}))}/> Service is active</label>
        {formError&&<div className="notice notice-error" role="alert">{formError}</div>}
        <Button block icon={Save} onClick={save} disabled={saving||p.servicesLoading}>{saving?"Saving…":"Save Service"}</Button>
        {editing&&<Button block kind="secondary" onClick={reset} disabled={saving}>Cancel Edit</Button>}
      </section>
    </div>
  </>;
}

function POS(p){
  const [customer,setCustomer]=useState("");
  const [barber,setBarber]=useState(p.barbers[0]?.name||"");
  const [payment,setPayment]=useState("Cash");
  const [selected,setSelected]=useState([]);
  const add=(s)=>setSelected(xs=>[...xs,{...s,lineId:Date.now()+Math.random()}]);
  const total=selected.reduce((n,s)=>n+s.price,0);
  return <><PageTitle title="Point of Sale (POS)" subtitle="Create a sale for completed services and record the customer's payment."/><div className="pos-layout"><section className="panel"><div className="panel-head"><div><h3>Available Services</h3><p>Select one or more services to add to the transaction.</p></div></div><div className="pos-service-list">{p.services.filter(s=>s.active).map(s=><div className="pos-service" key={s.id}><div className="service-symbol"><Scissors size={17}/></div><div className="pos-service-info"><strong>{s.name}</strong><span>{s.duration} minutes · {s.category}</span><b>{money(s.price)}</b></div><Button kind="secondary" onClick={()=>add(s)}>Add to sale</Button></div>)}</div></section><section className="panel pos-cart"><div className="panel-head"><div><h3>Current Transaction</h3><p>Sale summary</p></div><span className="live-pill">DRAFT</span></div><label>Customer<select value={customer} onChange={e=>setCustomer(e.target.value)}><option value="">Walk-in Customer</option>{p.customers.map(c=><option key={c.id}>{c.name}</option>)}</select></label><label>Barber<select value={barber} onChange={e=>setBarber(e.target.value)}>{p.barbers.map(b=><option key={b.id}>{b.name}</option>)}</select></label><div className="cart-lines">{selected.length?selected.map(s=><div className="cart-line" key={s.lineId}><div><strong>{s.name}</strong><small>{money(s.price)}</small></div><button onClick={()=>setSelected(xs=>xs.filter(x=>x.lineId!==s.lineId))} aria-label="Remove item"><X size={15}/></button></div>):<EmptyState title="No items added" text="Choose a service to start a sale."/>}</div><label>Payment method<select value={payment} onChange={e=>setPayment(e.target.value)}><option>Cash</option><option>GCash</option><option>Card</option><option>Other</option></select></label><div className="total-line"><span>Total amount</span><strong>{money(total)}</strong></div><Button block icon={Check} disabled={!selected.length} onClick={()=>{p.checkout({customer,barber,payment,items:selected});setSelected([]);setCustomer("")}}>Complete Payment</Button><p className="small-note"><ShieldCheck size={13}/> Demo only: no real payment is processed.</p></section></div></>;
}

function Sales(p){
  const total=p.sales.reduce((n,s)=>n+s.amount,0);
  const [paymentFilter,setPaymentFilter]=useState("All");
  const rows=p.sales.filter(s=>(paymentFilter==="All"||s.payment===paymentFilter)&&`${s.id} ${s.customer} ${s.service}`.toLowerCase().includes(p.search.toLowerCase()));
  return <><PageTitle title="Sales & Cash Drawer" subtitle="Review recorded sales and payment methods. No live payment terminal is connected." action={<Button icon={Download} kind="secondary" onClick={()=>downloadCSV(p.sales,"royal-barber-sales.csv")}>Export CSV</Button>}/><div className="metrics-grid"><Metric label="Recorded Sales" value={p.sales.length} icon={ReceiptText}/><Metric label="Recorded Revenue" value={money(total)} icon={CircleDollarSign} tone="green"/><Metric label="Cash Payments" value={money(p.sales.filter(s=>s.payment==="Cash").reduce((n,s)=>n+s.amount,0))} icon={Banknote} tone="blue"/><Metric label="GCash Payments" value={money(p.sales.filter(s=>s.payment==="GCash").reduce((n,s)=>n+s.amount,0))} icon={CreditCard} tone="purple"/></div><section className="panel"><div className="table-toolbar"><div className="search-box"><Search size={16}/><input value={p.search} onChange={e=>p.setSearch(e.target.value)} placeholder="Search transaction or customer"/></div><select value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)}><option>All</option><option>Cash</option><option>GCash</option><option>Card</option><option>Other</option></select></div><div className="table-wrap"><table><thead><tr><th>TRANSACTION ID</th><th>TIME</th><th>CUSTOMER</th><th>SERVICE</th><th>PAYMENT</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td className="mono">{s.id}</td><td>{s.time}</td><td>{s.customer}</td><td>{s.service}</td><td><span className="payment-tag">{s.payment}</span></td><td><strong>{money(s.amount)}</strong></td><td><Status value={s.status}/></td></tr>)}</tbody></table></div></section></>;
}
function downloadCSV(rows,filename){
 const cols=["id","time","customer","service","barber","amount","payment","status"];
 const csv=[cols.join(","),...rows.map(r=>cols.map(k=>`"${String(r[k]??"").replaceAll('"','""')}"`).join(","))].join("\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
function Reports(p){
  const total=p.sales.reduce((n,s)=>n+s.amount,0);
  const max=Math.max(1,...p.sales.map(s=>s.amount));
  const serviceCounts=p.sales.reduce((acc,s)=>{acc[s.service]=(acc[s.service]||0)+1;return acc;},{});
  return <><PageTitle title="Reports & Analytics" subtitle="Review recorded transactions and operational activity in this demo." action={<Button icon={Download} kind="secondary" onClick={()=>downloadCSV(p.sales,"royal-barber-report.csv")}>Export Report</Button>}/><div className="metrics-grid"><Metric label="Gross Recorded Sales" value={money(total)} icon={CircleDollarSign} tone="green"/><Metric label="Transactions" value={p.sales.length} icon={ReceiptText}/><Metric label="Appointments" value={p.appointments.length} icon={CalendarDays} tone="blue"/><Metric label="Registered Customers" value={p.customers.length} icon={Users} tone="purple"/></div><div className="reports-grid"><section className="panel"><div className="panel-head"><div><h3>Sales by Transaction</h3><p>Illustrative view of recorded demo sales</p></div></div><div className="bar-chart">{p.sales.slice(0,8).reverse().map((s,i)=><div className="chart-col" key={s.id}><div className="chart-value">{Math.round(s.amount)}</div><div className="chart-bar" style={{height:`${Math.max(8,s.amount/max*100)}%`}}></div><span>{s.id.slice(-3)}</span></div>)}</div><div className="chart-legend"><span></span>Recorded sales (PHP)</div></section><section className="panel"><h3>Service Breakdown</h3><p className="muted-text">Count by service description</p><div className="breakdown-list">{Object.entries(serviceCounts).map(([name,count])=><div className="breakdown-row" key={name}><div><span>{name}</span><strong>{count}</strong></div><div className="progress-track"><span style={{width:`${count/Math.max(1,...Object.values(serviceCounts))*100}%`}}></span></div></div>)}</div></section><section className="panel span-two"><div className="panel-head"><div><h3>Operational Summary</h3><p>Current record counts</p></div></div><div className="summary-cards"><div><span>Waiting</span><strong>{p.appointments.filter(a=>a.status==="Waiting").length}</strong></div><div><span>In service</span><strong>{p.appointments.filter(a=>a.status==="In Service").length}</strong></div><div><span>Completed appointments</span><strong>{p.appointments.filter(a=>a.status==="Completed").length}</strong></div><div><span>Active barbers</span><strong>{p.barbers.length}</strong></div></div><p className="small-note"><CircleAlert size={14}/> These are prototype reports based on browser-stored demo data, not verified accounting records.</p></section></div></>;
}

function SettingsPage({profileName,setProfileName,notify}){
  const [shop,setShop]=useState({name:"Royal Barber Shop",phone:"09XX XXX XXXX",address:"San Pablo City, Laguna",open:"09:00",close:"18:00",queuePrefix:"Q",slot:30});
  const [days,setDays]=useState(["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]);
  const [saved,setSaved]=useState(false);
  const toggleDay=d=>setDays(ds=>ds.includes(d)?ds.filter(x=>x!==d):[...ds,d]);
  return <><PageTitle title="Settings" subtitle="Configure basic shop information, operating hours, and admin preferences."/><div className="settings-grid"><section className="panel settings-panel"><div className="panel-head"><div><h3>Business Profile</h3><p>Details displayed in booking confirmations and receipts.</p></div></div><form onSubmit={e=>{e.preventDefault();setSaved(true);notify("Settings saved in this browser demo.")}}><div className="settings-form"><label>Business name<input value={shop.name} onChange={e=>setShop(s=>({...s,name:e.target.value}))}/></label><label>Contact number<input value={shop.phone} onChange={e=>setShop(s=>({...s,phone:e.target.value}))}/></label><label className="full">Business address<input value={shop.address} onChange={e=>setShop(s=>({...s,address:e.target.value}))}/></label><label>Opening time<input type="time" value={shop.open} onChange={e=>setShop(s=>({...s,open:e.target.value}))}/></label><label>Closing time<input type="time" value={shop.close} onChange={e=>setShop(s=>({...s,close:e.target.value}))}/></label><label>Queue number prefix<input value={shop.queuePrefix} maxLength={4} onChange={e=>setShop(s=>({...s,queuePrefix:e.target.value}))}/></label><label>Default appointment slot (minutes)<select value={shop.slot} onChange={e=>setShop(s=>({...s,slot:Number(e.target.value)}))}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label></div><h3 className="settings-subhead">Operating Days</h3><div className="days-list">{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d=><label key={d} className="day-toggle"><span>{d}</span><input type="checkbox" checked={days.includes(d)} onChange={()=>toggleDay(d)}/><i></i></label>)}</div><div className="settings-actions"><Button icon={Save}>Save Settings</Button>{saved&&<span className="saved-message"><Check size={14}/> Saved in demo</span>}</div></form></section><section className="panel settings-panel"><div className="panel-head"><div><h3>Administrator Profile</h3><p>Local display preference for the admin interface.</p></div></div><label>Display name<input value={profileName} onChange={e=>setProfileName(e.target.value)}/></label><div className="settings-callout"><ShieldCheck size={18}/><div><strong>Security status</strong><p>Authentication is not connected in this prototype. Do not use this demo to store real customer data or credentials.</p></div></div><h3 className="settings-subhead">Data & Privacy</h3><p className="muted-text">Demo records are stored in this browser's local storage. They are not shared across devices and may be cleared if browser data is removed.</p><Button kind="danger" onClick={()=>{if(confirm("Clear all prototype records? This cannot be undone.")){["royal-appointments","royal-customers","royal-barbers","royal-services","royal-sales"].forEach(k=>localStorage.removeItem(k));window.location.reload();}}}>Reset Demo Data</Button></section></div></>;
}

function Modal({modal,setModal,services,barbers,customers,addWalkIn,notify}){
  const [form,setForm]=useState({name:"",phone:"",service:services.find(s=>s.active)?.name||"",barber:"Unassigned",role:"Barber"});
  const change=(k,v)=>setForm(f=>({...f,[k]:v}));
  if(modal.type==="walkin")return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><div className="modal"><div className="modal-head"><div><h2>Register Walk-in</h2><p>Create a queue entry for a new arrival.</p></div><button onClick={()=>setModal(null)}><X/></button></div><form onSubmit={e=>{e.preventDefault();addWalkIn(form)}} className="modal-form"><label>Customer name *<input required value={form.name} onChange={e=>change("name",e.target.value)} placeholder="Full name"/></label><label>Phone number *<input required value={form.phone} onChange={e=>change("phone",e.target.value)} placeholder="09XX XXX XXXX"/></label><label>Service<select value={form.service} onChange={e=>change("service",e.target.value)}>{services.filter(s=>s.active).map(s=><option key={s.id} value={s.name}>{s.name}</option>)}</select></label><label>Preferred barber<select value={form.barber} onChange={e=>change("barber",e.target.value)}><option>Unassigned</option>{barbers.map(b=><option key={b.id}>{b.name}</option>)}</select></label><div className="modal-actions"><Button kind="secondary" onClick={()=>setModal(null)}>Cancel</Button><Button icon={QrCode}>Register Customer</Button></div></form></div></div>;
  if(modal.type==="customer")return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><div className="modal"><div className="modal-head"><div><h2>Add Customer</h2><p>Create a customer directory entry.</p></div><button onClick={()=>setModal(null)}><X/></button></div><form className="modal-form" onSubmit={e=>{e.preventDefault();if(customers.some(c=>c.phone===form.phone)){notify("A customer with this phone number already exists.");return;}setCustomers(cs=>[{id:`CUS-${String(Date.now()).slice(-5)}`,name:form.name,phone:form.phone,visits:0,lastVisit:"—",status:"Active"},...cs]);setModal(null);notify("Customer added to this browser demo.");}}><label>Full name<input required value={form.name} onChange={e=>change("name",e.target.value)}/></label><label>Phone number<input required value={form.phone} onChange={e=>change("phone",e.target.value)}/></label><div className="modal-actions"><Button kind="secondary" onClick={()=>setModal(null)}>Cancel</Button><Button>Save Customer</Button></div></form></div></div>;
  if(modal.type==="barber")return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><div className="modal"><div className="modal-head"><div><h2>Add Barber</h2><p>Add a barber profile to the roster.</p></div><button onClick={()=>setModal(null)}><X/></button></div><form className="modal-form" onSubmit={e=>{e.preventDefault();setBarbers(bs=>[...bs,{id:Math.max(0,...bs.map(b=>b.id))+1,name:form.name,role:form.role,status:"Available",schedule:"Schedule not configured",today:0}]);notify("Barber added to this browser demo.");setModal(null)}}><label>Full name<input required value={form.name} onChange={e=>change("name",e.target.value)}/></label><label>Role<select value={form.role} onChange={e=>change("role",e.target.value)}><option>Barber</option><option>Senior Barber</option><option>Master Barber</option><option>Manager</option></select></label><div className="modal-actions"><Button kind="secondary" onClick={()=>setModal(null)}>Cancel</Button><Button>Save Barber</Button></div></form></div></div>;
  return null;
}
