import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Product, Partner, Block, Portfolio } from "@shared/schema";
import "../landing.css";

function parseData(raw: string): any {
  try { return JSON.parse(raw); } catch { return {}; }
}

// ─── Header ──────────────────────────────────────────────────────────────────
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      setMenuOpen(false);
      if (href === "#") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className={scrolled ? "scrolled" : ""} id="siteHeader" style={{ position: "sticky" }}>
      <div className="container nav-wrapper">
        <a href="#" className="logo" onClick={(e) => handleNavClick(e, "#")} data-testid="link-logo">
          <img src="/logo.png" alt="WOODINY" style={{ height: 56, width: "auto" }} />
        </a>
        <button
          className={`menu-toggle${menuOpen ? " active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Открыть меню"
          data-testid="button-menu-toggle"
        >
          <span></span>
        </button>
        <nav className={menuOpen ? "active" : ""} id="mainNav">
          <ul>
            <li><a href="#about" onClick={(e) => handleNavClick(e, "#about")} data-testid="link-about">О компании</a></li>
            <li><a href="#capabilities" onClick={(e) => handleNavClick(e, "#capabilities")} data-testid="link-capabilities">Производство</a></li>
            <li><a href="#products" onClick={(e) => handleNavClick(e, "#products")} data-testid="link-products">Продукция</a></li>
            <li><a href="#process" onClick={(e) => handleNavClick(e, "#process")} data-testid="link-process">Как работаем</a></li>
            <li><a href="#contacts" onClick={(e) => handleNavClick(e, "#contacts")} className="nav-cta" data-testid="link-contacts-cta">Оставить заявку</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ data }: { data: any }) {
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const currentRef = useRef(0);
  const fadingOutRef = useRef(false);

  useEffect(() => {
    const vids = videoRefs.current;
    if (!vids.length || window.innerWidth <= 768) return;

    function playVideo(index: number) {
      const vid = vids[index];
      if (!vid) return;
      vid.currentTime = 0;
      vid.play().catch(() => {});
      fadingOutRef.current = false;
      setTimeout(() => { vid.style.opacity = "0.4"; }, 200);
    }

    vids.forEach((vid, i) => {
      vid.addEventListener("timeupdate", () => {
        if (!vid.duration) return;
        const timeLeft = vid.duration - vid.currentTime;
        if (timeLeft <= 0.8 && !fadingOutRef.current && i === currentRef.current) {
          fadingOutRef.current = true;
          vid.style.opacity = "0";
        }
      });
      vid.addEventListener("ended", () => {
        if (i !== currentRef.current) return;
        setTimeout(() => {
          currentRef.current = (currentRef.current + 1) % vids.length;
          playVideo(currentRef.current);
        }, 100);
      });
    });

    vids[0]?.addEventListener("canplay", () => {
      if (vids[0]) vids[0].style.opacity = "0.4";
    }, { once: true });
    vids[0]?.play().catch(() => {});
  }, []);

  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const title = data?.title || "Деревянные изделия\nдля вашего бизнеса —\nваши идеи, наше воплощение";
  const subtitle = data?.subtitle || "Собственное производство в Московской области. Контроль качества на каждом этапе. Работаем с любой древесиной лиственной породы.";
  const text = data?.text || "Крупносерийное производство изделий из дерева";
  const badge = data?.badge || "Собственное производство";
  const cta = data?.cta || "Рассчитать заказ";
  const ctaSecondary = data?.ctaSecondary || "О производстве";

  const titleLines = title.split("\n");

  return (
    <section className="hero">
      {["/hero-video-1.mp4", "/hero-video-2.mp4", "/hero-video-3.mp4", "/hero-video-4.mp4"].map((src, i) => (
        <video
          key={i}
          className="hero-vid"
          data-index={i}
          muted
          playsInline
          poster={i === 0 ? "/hero-poster.png" : undefined}
          ref={(el) => { if (el) videoRefs.current[i] = el; }}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1, pointerEvents: "none", opacity: 0, transition: "opacity 0.8s ease" }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ))}
      <div className="hero-decoration"></div>
      <div className="hero-decoration-2"></div>
      <div className="hero-decoration-3"></div>
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge" data-testid="hero-badge">
              <span className="hero-badge-dot"></span>
              {badge}
            </div>
            <h1 data-testid="text-hero-title">
              {titleLines.map((line, i) =>
                i === titleLines.length - 1 && titleLines.length > 1
                  ? <em key={i}>{line}</em>
                  : <span key={i}>{line}{i < titleLines.length - 1 ? <br /> : null}</span>
              )}
            </h1>
            <p className="hero-subtitle">{subtitle}</p>
            <p className="hero-text">{text}</p>
            <div className="hero-actions">
              <a href="#contacts" className="btn-primary" onClick={(e) => handleAnchor(e, "#contacts")} data-testid="button-hero-cta">
                {cta}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
              <a href="#capabilities" className="btn-ghost" onClick={(e) => handleAnchor(e, "#capabilities")} data-testid="button-hero-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                {ctaSecondary}
              </a>
            </div>
          </div>
          <div className="hero-image" data-testid="img-hero-production">
            <img src="/hero-production.png" alt="Ассортимент деревянных изделий — разделочные доски, менажницы, скалки. Производство ВУДИНИ." loading="eager" />
            <div className="hero-image-badge">Собственный цех</div>
          </div>
        </div>
      </div>
      <div className="hero-line"></div>
    </section>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
function SectionDivider({ style }: { style?: React.CSSProperties }) {
  return (
    <div className="section-divider" style={style}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg>
    </div>
  );
}

// ─── Clients ──────────────────────────────────────────────────────────────────
function ClientsSection({ data }: { data: any }) {
  const label = data?.label || "Наши клиенты";
  const title = data?.title || "Кому мы подходим";
  const desc = data?.desc || "Работаем с бизнесом, которому нужны стабильные поставки качественных деревянных изделий";

  return (
    <section id="about">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">{label}</span>
          <h2 className="section-title" data-testid="text-partners-section">{title}</h2>
          <p className="section-desc">{desc}</p>
        </div>
        <div className="clients-grid">
          <div className="client-card fade-in fade-in-delay-1" data-testid="card-client-retail">
            <div className="client-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><rect width="20" height="5" x="2" y="7" rx="1"/></svg>
            </div>
            <div>
              <h3>Ритейл и сети</h3>
              <p>Регулярные поставки для крупных торговых точек и розничных сетей по всей России</p>
            </div>
          </div>
          <div className="client-card fade-in fade-in-delay-2" data-testid="card-client-marketplace">
            <div className="client-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>
            </div>
            <div>
              <h3>Маркетплейсы</h3>
              <p>Изготовление ходовых позиций под ваш бренд для Ozon, Wildberries, Яндекс.Маркет</p>
            </div>
          </div>
          <div className="client-card fade-in fade-in-delay-3" data-testid="card-client-production">
            <div className="client-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
            </div>
            <div>
              <h3>Производственные компании</h3>
              <p>Деревянные элементы и комплектующие для интеграции в вашу продукцию</p>
            </div>
          </div>
          <div className="client-card fade-in fade-in-delay-4" data-testid="card-client-corporate">
            <div className="client-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h3>Корпоративные заказы</h3>
              <p>Бизнес-подарки, сувенирная продукция и брендированные товары оптом</p>
            </div>
          </div>
          <div className="client-card fade-in fade-in-delay-5" data-testid="card-client-horeca">
            <div className="client-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12a4 4 0 1 1 8 0c0 2.5-2 2.5-2 5h-4c0-2.5-2-2.5-2-5Z"/><path d="M9 17h6"/><path d="M10 22h4"/></svg>
            </div>
            <div>
              <h3>HoReCa</h3>
              <p>Рестораны, отели, бары — посуда и аксессуары из дерева для сервировки и интерьера</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Partners ─────────────────────────────────────────────────────────────────
function PartnersSection() {
  const { data: partners } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });
  const active = partners?.filter(p => p.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) || [];
  if (!active.length) return null;

  const doubled = [...active, ...active];

  return (
    <section className="partners-section" data-testid="section-partners">
      <div className="container">
        <div className="partners-label fade-in">
          <span>Нам доверяют</span>
        </div>
      </div>
      <div className="partners-overflow">
        <div className="partners-track">
          {doubled.map((p, i) => (
            <div key={`${p.id}-${i}`} className="partner-logo" data-testid={`partner-${p.name.toLowerCase().replace(/[^a-zа-я0-9]/gi, "-")}`}>
              {p.logoUrl ? (
                <img src={p.logoUrl} alt={p.name} style={{ maxHeight: 36, maxWidth: 120, objectFit: "contain" }} />
              ) : (
                <span className="partner-name" style={p.brandColor ? { color: p.brandColor } : undefined}>{p.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatsSection() {
  const [counts, setCounts] = useState([0, 0, 0]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  const stats = [
    { target: 100000, suffix: "+", label: "изделий в месяц", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg> },
    { target: 1500, suffix: " м²", label: "производственных площадей", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect width="10" height="10" x="7" y="7" rx="1"/></svg> },
    { target: 50, suffix: "+", label: "постоянных клиентов", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          stats.forEach((stat, idx) => {
            const duration = 2200;
            const start = performance.now();
            const animate = (now: number) => {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 4);
              setCounts(prev => {
                const next = [...prev];
                next[idx] = Math.floor(eased * stat.target);
                return next;
              });
              if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          });
        }
      });
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const formatNumber = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");

  return (
    <div className="stats-section" ref={sectionRef}>
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-item fade-in" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number" data-testid={`text-stat-${i}`}>{formatNumber(counts[i])}{stat.suffix}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Capabilities ─────────────────────────────────────────────────────────────
function CapabilitiesSection({ data }: { data: any }) {
  const label = data?.label || "Наше производство";
  const title = data?.title || "Производственные возможности";
  const desc = data?.desc || "Современное оборудование и многолетний опыт для реализации проектов любой сложности";

  const capabilities = [
    { title: "Работаем с крупными заказами", desc: "От 500 единиц SKU" },
    { title: "Станки ЧПУ", desc: "Точность обработки до 0.1 мм" },
    { title: "Лазерная резка", desc: "Сложные контуры и гравировка" },
    { title: "Токарные работы", desc: "Скалки, толкушки, ручки" },
    { title: "Гравировка по металлу", desc: "Нанесение логотипов и маркировка" },
  ];

  return (
    <section id="capabilities" className="capabilities-section">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">{label}</span>
          <h2 className="section-title" data-testid="text-advantages-title">{title}</h2>
          <p className="section-desc">{desc}</p>
        </div>
        <div className="capabilities-wrapper">
          <div className="capabilities-visual fade-in">
            <div className="capabilities-visual-bg">
              <div className="capabilities-visual-badge">Московская область</div>
              <img src="/production-1.png" alt="Крупное деревообрабатывающее производство ВУДИНИ" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0, opacity: 0.35 }} />
              <div className="capabilities-visual-text">
                <h3>Собственный цех</h3>
                <p>Полный цикл производства на 1500 м²</p>
              </div>
            </div>
          </div>
          <div className="fade-in fade-in-delay-2">
            <ul className="capability-list">
              {capabilities.map((cap, i) => (
                <li key={i} className="capability-item">
                  <div className="capability-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div className="capability-content">
                    <h4>{cap.title}</h4>
                    <p>{cap.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Production Gallery ───────────────────────────────────────────────────────
function ProductionSection() {
  return (
    <section id="production">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">Наше производство</span>
          <h2 className="section-title">Собственный цех в Подмосковье</h2>
          <p className="section-desc">Современное оборудование, отлаженные процессы и строгий контроль качества на каждом этапе</p>
        </div>
        <div className="production-gallery">
          {[
            { src: "/production-1.png", alt: "Деревообрабатывающий цех с ЧПУ-станками", h3: "Станки с ЧПУ", p: "Точность обработки до 0.1 мм", testid: "card-production-cnc" },
            { src: "/production-2.png", alt: "Контроль качества готовой продукции", h3: "Контроль качества", p: "Проверка каждой единицы продукции", testid: "card-production-quality" },
            { src: "/production-3.png", alt: "Склад и отгрузка готовой продукции", h3: "Склад и логистика", p: "Отгрузка по всей России", testid: "card-production-shipping" },
          ].map((card, i) => (
            <div key={i} className={`production-card fade-in fade-in-delay-${i + 1}`} data-testid={card.testid}>
              <img src={card.src} alt={card.alt} loading="lazy" />
              <div className="production-card-overlay">
                <h3>{card.h3}</h3>
                <p>{card.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
function ProductsSection({ data }: { data: any }) {
  const { data: products } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const active = products?.filter(p => p.isActive) || [];

  const label = data?.label || "Каталог";
  const title = data?.title || "Продукция";
  const desc = data?.desc || "Производим широкий ассортимент изделий из натурального дерева";

  const defaultProducts = [
    { name: "Разделочные доски", sub: "Бук, дуб, берёза", testid: "card-product-boards", svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="8" width="36" height="48" rx="4"/><path d="M10 18h36"/><path d="M28 18v38"/><circle cx="22" cy="12" r="2"/></svg> },
    { name: "Менажницы", sub: "Секционные блюда", testid: "card-product-menazhnitsy", svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="32" cy="32" r="24"/><path d="M32 8v48"/><path d="M8 32h48"/><path d="M14 14l36 36"/></svg> },
    { name: "Скалки и толкушки", sub: "Классические и фигурные", testid: "card-product-skalki", svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="26" width="48" height="12" rx="6"/><path d="M8 32H4"/><path d="M56 32h4"/><circle cx="4" cy="32" r="3"/><circle cx="60" cy="32" r="3"/></svg> },
    { name: "Изделия для сервировки", sub: "Сырницы, маслёнки, блюда", testid: "card-product-servirovka", svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="32" cy="36" rx="24" ry="8"/><path d="M8 36c0 8 10.7 14 24 14s24-6 24-14"/><path d="M32 10v12"/><circle cx="32" cy="8" r="3"/></svg> },
    { name: "Изделия по ТЗ", sub: "Под ваш проект", testid: "card-product-custom", svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M40 20a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l6-6a10 10 0 0 1-13 13L22 46a3.5 3.5 0 0 1-5-5l15-15a10 10 0 0 1 13-13l-5 5z"/></svg> },
  ];

  const displayProducts = active.length ? active.slice(0, 5) : null;

  return (
    <section id="products">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">{label}</span>
          <h2 className="section-title" data-testid="text-products-section">{title}</h2>
          <p className="section-desc">{desc}</p>
        </div>
        <div className="products-grid">
          {displayProducts
            ? displayProducts.map((product, i) => (
              <div key={product.id} className={`product-card fade-in fade-in-delay-${i + 1}`} data-testid={`card-landing-product-${product.id}`}>
                <div className="product-thumb">
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} />
                    : <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="8" width="36" height="48" rx="4"/></svg>
                  }
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>{product.category || ""}</p>
                </div>
              </div>
            ))
            : defaultProducts.map((p, i) => (
              <div key={i} className={`product-card fade-in fade-in-delay-${i + 1}`} data-testid={p.testid}>
                <div className="product-thumb">{p.svg}</div>
                <div className="product-info">
                  <h3>{p.name}</h3>
                  <p>{p.sub}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </section>
  );
}

// ─── Process ──────────────────────────────────────────────────────────────────
function ProcessSection({ data }: { data: any }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("animated"), 400);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const label = data?.label || "Процесс";
  const title = data?.title || "Как мы работаем";
  const desc = data?.desc || "Отлаженный процесс от первого запроса до отгрузки готовой продукции";

  const steps = [
    { title: "Получаем ТЗ", desc: "Изучаем ваши требования, объёмы и сроки" },
    { title: "Рассчитываем стоимость", desc: "Коммерческое предложение за 1 рабочий день" },
    { title: "Согласуем образец", desc: "Изготавливаем и утверждаем образец" },
    { title: "Запускаем в производство", desc: "Производство с контролем на каждом этапе" },
    { title: "Проверяем качество", desc: "100% проверка перед упаковкой" },
    { title: "Отгружаем", desc: "Доставка по всей России, ТК или самовывоз" },
  ];

  return (
    <section id="process" className="process-section">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">{label}</span>
          <h2 className="section-title">{title}</h2>
          <p className="section-desc">{desc}</p>
        </div>
        <div className="process-track fade-in" id="processTrack" ref={trackRef}>
          {steps.map((step, i) => (
            <div key={i} className="process-step">
              <div className="step-number">{i + 1}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
function PortfolioSection({ data }: { data: any }) {
  const { data: portfolioItems } = useQuery<Portfolio[]>({ queryKey: ["/api/portfolio"] });
  const active = portfolioItems?.filter(p => p.isActive) || [];

  const label = data?.label || "Наши работы";
  const title = data?.title || "Портфолио";
  const desc = data?.desc || "Примеры изделий, выполненных для наших клиентов";

  const defaultItems = [
    "Разделочные доски", "Менажницы", "Корпоративные",
    "Скалки и толкушки", "Сервировка", "Сувениры",
    "По ТЗ клиента", "Брендирование",
  ];

  const imageSvg = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
  );

  return (
    <section className="portfolio-section">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">{label}</span>
          <h2 className="section-title">{title}</h2>
          <p className="section-desc">{desc}</p>
        </div>
        <div className="portfolio-grid fade-in">
          {active.length
            ? active.slice(0, 8).map((item, i) => (
              <div key={item.id} className="portfolio-item" data-testid={`portfolio-item-${i + 1}`}>
                <div
                  className={`portfolio-item-inner${item.imageUrl ? " has-image" : ""}`}
                  style={item.imageUrl ? {
                    backgroundImage: `url(${item.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  } : undefined}
                >
                  {!item.imageUrl && imageSvg}
                </div>
                <div className="portfolio-overlay"><span>{item.title}</span></div>
              </div>
            ))
            : defaultItems.map((label, i) => (
              <div key={i} className="portfolio-item" data-testid={`portfolio-item-${i + 1}`}>
                <div className="portfolio-item-inner">{imageSvg}</div>
                <div className="portfolio-overlay"><span>{label}</span></div>
              </div>
            ))
          }
        </div>
      </div>
    </section>
  );
}

// ─── Contacts ─────────────────────────────────────────────────────────────────
function ContactSection({ data }: { data: any }) {
  const [form, setForm] = useState({ fio: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const label = data?.label || "Оставить заявку";
  const title = data?.title || "Рассчитаем ваш заказ\nв течение 1 рабочего дня";

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (!val.length) { setForm(f => ({ ...f, phone: "" })); return; }
    if (val[0] === "8") val = "7" + val.slice(1);
    if (val[0] !== "7") val = "7" + val;
    let formatted = "+7";
    if (val.length > 1) formatted += " (" + val.slice(1, 4);
    if (val.length > 4) formatted += ") " + val.slice(4, 7);
    if (val.length > 7) formatted += "-" + val.slice(7, 9);
    if (val.length > 9) formatted += "-" + val.slice(9, 11);
    setForm(f => ({ ...f, phone: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.fio.trim()) newErrors.fio = "Введите ФИО";
    const phoneClean = form.phone.replace(/\D/g, "");
    if (phoneClean.length < 11) newErrors.phone = "Введите корректный номер";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Введите корректный email";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setSubmitting(true);
    try {
      await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.fio, phone: form.phone, email: form.email, message: form.message, status: "new" }),
      });
      setSuccess(true);
      setForm({ fio: "", phone: "", email: "", message: "" });
      setTimeout(() => setSuccess(false), 6000);
    } catch {}
    setSubmitting(false);
  };

  const titleLines = title.split("\n");

  return (
    <section id="contacts" className="form-section">
      <div className="container">
        <div className="section-header fade-in">
          <span className="section-label">{label}</span>
          <h2 className="section-title" data-testid="text-contact-section">
            {titleLines.map((line, i) => <span key={i}>{line}{i < titleLines.length - 1 ? <br /> : null}</span>)}
          </h2>
        </div>
        <div className="form-wrapper">
          <div className="form-info fade-in">
            <h3>Расскажите о вашем проекте</h3>
            <p>Заполните форму, и наш менеджер свяжется с вами для обсуждения деталей заказа. Расчёт стоимости бесплатный.</p>
            <ul className="form-features">
              {[
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>, text: "Бесплатный расчёт стоимости" },
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: "Конфиденциальность гарантирована" },
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>, text: "Ответ в течение 1 рабочего дня" },
              ].map((f, i) => (
                <li key={i}>
                  <div className="form-feature-icon">{f.icon}</div>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="form-container fade-in fade-in-delay-2">
            {success && <div className="form-success">✓ Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.</div>}
            <form onSubmit={handleSubmit}>
              <div className={`form-group${errors.fio ? " has-error" : ""}`}>
                <label>ФИО <span className="required">*</span></label>
                <input type="text" placeholder="Иван Иванов" value={form.fio} onChange={e => setForm(f => ({ ...f, fio: e.target.value }))} data-testid="input-contact-name" />
                {errors.fio && <div className="error-text">{errors.fio}</div>}
              </div>
              <div className="form-row">
                <div className={`form-group${errors.phone ? " has-error" : ""}`}>
                  <label>Телефон <span className="required">*</span></label>
                  <input type="tel" placeholder="+7 (___) ___-__-__" value={form.phone} onChange={handlePhone} onFocus={e => { if (!e.target.value) setForm(f => ({ ...f, phone: "+7 (" })); }} onBlur={e => { if (e.target.value === "+7 (" || e.target.value === "+7") setForm(f => ({ ...f, phone: "" })); }} data-testid="input-contact-phone" />
                  {errors.phone && <div className="error-text">{errors.phone}</div>}
                </div>
                <div className={`form-group${errors.email ? " has-error" : ""}`}>
                  <label>Email <span className="required">*</span></label>
                  <input type="email" placeholder="email@company.ru" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-testid="input-contact-email" />
                  {errors.email && <div className="error-text">{errors.email}</div>}
                </div>
              </div>
              <div className="form-group">
                <label>Сообщение</label>
                <textarea placeholder="Опишите ваш запрос: какие изделия, объём, сроки..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} data-testid="input-contact-message" />
              </div>
              <button type="submit" className="btn-submit" disabled={submitting} data-testid="button-submit-inquiry">
                {submitting ? "Отправка..." : "Отправить заявку"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer>
      <div className="container footer-content">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/logo.png" alt="WOODINY" style={{ height: 48, width: "auto", filter: "brightness(0) invert(1)", marginBottom: 8 }} />
            </div>
            <p>Крупносерийное производство изделий из дерева. Собственное производство в Московской области.</p>
          </div>
          <div className="footer-links">
            <h4>Навигация</h4>
            <ul>
              <li><a href="#about" onClick={(e) => handleAnchor(e, "#about")}>О компании</a></li>
              <li><a href="#capabilities" onClick={(e) => handleAnchor(e, "#capabilities")}>Производство</a></li>
              <li><a href="#production" onClick={(e) => handleAnchor(e, "#production")}>Наш цех</a></li>
              <li><a href="#products" onClick={(e) => handleAnchor(e, "#products")}>Продукция</a></li>
              <li><a href="#process" onClick={(e) => handleAnchor(e, "#process")}>Как работаем</a></li>
              <li><a href="#contacts" onClick={(e) => handleAnchor(e, "#contacts")}>Контакты</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Контакты</h4>
            <ul>
              <li><a href="tel:+74956467200" data-testid="link-footer-phone">8 (495) 646-72-00</a></li>
              <li><a href="tel:+79671197997" data-testid="link-footer-mobile">8 (967) 119-79-97</a></li>
              <li><a href="mailto:woodiny@mail.ru" data-testid="link-footer-email">woodiny@mail.ru</a></li>
              <li><span>МО, Г.О. Одинцовский, д. Малые Вязёмы,<br />Петровский проезд, д.5 стр.1</span></li>
              <li><span>Пн–Пт: 9:00–18:00</span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 ООО «Вудини». Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Fade-in observer hook ────────────────────────────────────────────────────
function useFadeInObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });

    document.querySelectorAll(".landing-page .fade-in").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  });
}

// ─── Track visit ──────────────────────────────────────────────────────────────
function useTrackVisit() {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: window.location.pathname, referrer: document.referrer }),
    }).catch(() => {});
  }, []);
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { data: blocks } = useQuery<Block[]>({ queryKey: ["/api/blocks"] });

  useFadeInObserver();
  useTrackVisit();

  function getBlockData(type: string) {
    const block = blocks?.find(b => b.type === type && b.isActive);
    if (!block?.data) return {};
    return parseData(block.data as string);
  }

  const heroData = getBlockData("hero");
  const clientsData = getBlockData("clients");
  const featuresData = getBlockData("features");
  const productsData = getBlockData("products");
  const portfolioData = getBlockData("portfolio");
  const processData = getBlockData("process");
  const contactsData = getBlockData("contacts");

  return (
    <div className="landing-page">
      <Header />
      <HeroSection data={heroData} />
      <SectionDivider style={{ padding: "2rem 0" }} />
      <ClientsSection data={clientsData} />
      <PartnersSection />
      <StatsSection />
      <CapabilitiesSection data={featuresData} />
      <ProductionSection />
      <SectionDivider />
      <ProductsSection data={productsData} />
      <SectionDivider />
      <ProcessSection data={processData} />
      <PortfolioSection data={portfolioData} />
      <ContactSection data={contactsData} />
      <Footer />
    </div>
  );
}
