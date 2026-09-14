"use client";

import { FormEvent, useEffect, useState } from "react";
import { BadgeCheck, Box, ClipboardCheck, Clock3, DraftingCompass, Factory, FilePenLine, Gift, Globe2, Handshake, Headphones, IdCard, Megaphone, MessagesSquare, PackageOpen, PackageCheck, ShieldCheck, ShoppingBag, Truck, UserRoundCheck, UsersRound, type LucideIcon } from "lucide-react";
import content from "../content/goodie-content.json";

export type SitePage = "home" | "about" | "services" | "cases" | "process" | "contact";

const nav = content.navigation.map(({ slug, label }) => [slug, label] as const);
const services = content.services;
const processSteps = content.processSteps.map(({ number, title, description }) => [number, title, description] as const);
const cases = content.cases;
type CaseItem = (typeof cases)[number];
const categoryImages = ["/goodie/category-drinkware.png", "/goodie/category-bags.png", "/goodie/category-lifestyle.png", "/goodie/category-stationery.png", "/goodie/category-outdoor.png", "/goodie/category-apparel.png"];
const serviceProductImages = [
  { src: "/goodie/service-brand-activity-v2.png", alt: "聯名服飾、帽子包袋、杯瓶、收藏小物與限定商品" },
  { src: "/goodie/service-retail-promotion-v2.png", alt: "滿額贈品、集點商品、杯具、生活與收納用品" },
  { src: "/goodie/service-convention-kit-v2.png", alt: "活動提袋、識別證、護照套、行李吊牌、隨行杯與活動禮包" },
  { src: "/goodie/service-corporate-gifts-v2.png", alt: "股東會贈品、客戶贈禮、員工禮包、紀念品與節慶禮盒" },
  { src: "/goodie/service-exhibition-v2.png", alt: "展覽識別證、提袋、工作服、文具、接待贈品與展場周邊" },
];
const caseImages: Record<string, string> = {
  "kobayashi-anime": "/goodie/case-kobayashi.png",
  "crayon-shinchan": "/goodie/case-shinchan.png",
  "hungry-jacks-glass": "/goodie/case-hj-glass.png",
  "super-liquor-summer": "/goodie/case-super-liquor.png",
  "hungry-jacks-convention": "/goodie/case-hj-convention.jpg",
};
const homeCaseImages: Record<string, string> = {
  "kobayashi-anime": "/goodie/home-case-kobayashi.png",
  "hungry-jacks-glass": "/goodie/home-case-hj-glass.png",
  "super-liquor-summer": "/goodie/home-case-super-liquor.png",
  "hungry-jacks-convention": "/goodie/home-case-hj-convention.png",
};
const contactProjectTypes = ["品牌活動", "通路促銷", "企業大會／活動禮包", "企業禮贈品", "展覽活動", "客製專案諮詢"];
const serviceIcons = [Megaphone, ShoppingBag, PackageOpen, Gift, IdCard, MessagesSquare];
const homeWhyIcons = [UsersRound, Globe2, Box, DraftingCompass];
const homeStatIcons = [ShieldCheck, UsersRound, Factory, Globe2];
const missionIcons = [Globe2, UsersRound, Factory, BadgeCheck];
const aboutWhyIcons = [UsersRound, DraftingCompass, Globe2, PackageCheck, Headphones];
const processIcons = [MessagesSquare, FilePenLine, PackageOpen, ClipboardCheck, Factory, Truck];
const benefitIcons = [ShieldCheck, Clock3, UserRoundCheck, Handshake];
function Pictogram({ icon: Icon, className = "" }: { icon: LucideIcon; className?: string }) {
  return <b className={`line-icon pictogram ${className}`}><Icon aria-hidden="true" strokeWidth={1.8} /></b>;
}

function ServiceIcon({ index }: { index: number }) {
  return <Pictogram icon={serviceIcons[index] ?? Gift} className="service-icon" />;
}

function Logo() {
  return <a className="logo" href="/" aria-label="Goodie 首頁"><img src="/goodie-logo.png" alt="Goodie" /></a>;
}

function Header({ page }: { page: SitePage }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <Logo />
      <button className="menu-button" aria-label="開啟選單" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button>
      <nav className={open ? "nav open" : "nav"} aria-label="主要導覽">
        {nav.map(([slug, label]) => <a key={slug} className={page === slug ? "active" : ""} href={`/${slug}`}>{label}</a>)}
        <a className={`nav-cta ${page === "contact" ? "active" : ""}`} href="/contact">聯絡我們 <b>→</b></a>
      </nav>
    </header>
  );
}

function SectionTitle({ eyebrow, children, center = false }: { eyebrow?: string; children: React.ReactNode; center?: boolean }) {
  return <div className={`section-title ${center ? "center" : ""}`}>{eyebrow && <p>{eyebrow}</p>}<h2>{children}</h2><i /></div>;
}

function ArrowButton({ href, children, outline = false }: { href: string; children: React.ReactNode; outline?: boolean }) {
  return <a className={`button ${outline ? "button-outline" : ""}`} href={href}>{children}<span>→</span></a>;
}

function Hero({ page = "home" }: { page?: SitePage }) {
  const home = content.home;
  const [headlineSecond = "", ...headlineRest] = home.headlineAfter.trim().split(/\s+/);
  if (page === "home") {
    return <section className="home-hero">
      <div className="hero-copy">
        <h1>{home.headlineBefore}<br /><span className="headline-line"><em>{home.headlineOrange}</em>{headlineSecond && <> {headlineSecond}</>}</span>{headlineRest.length > 0 && <><br />{headlineRest.join(" ")}</>}</h1><h2>{home.subheading}</h2><p>{home.description}</p>
        <div className="button-row"><ArrowButton href="/services">{home.primaryButton}</ArrowButton><ArrowButton href="/cases" outline>{home.secondaryButton}</ArrowButton></div>
      </div>
      <div className="hero-photo"><img className="active" src="/goodie/banner-home-logo-2026.png" alt="Goodie 品牌商品企劃與客製開發" /></div>
    </section>;
  }

  const hero = content.pageHeroes[page as keyof typeof content.pageHeroes];
  const { title, subtitle, description: body } = hero;
  const pagePhotos = { about: "/goodie/banner-about-services-logo-2026.png", services: "/goodie/banner-about-services-logo-2026.png", cases: "/goodie/banner-cases-process-logo-2026.png", process: "/goodie/banner-cases-process-logo-2026.png" } as const;
  return <section className={`inner-hero inner-${page}`}><div className="inner-copy"><h1>{title}</h1><h2>{subtitle}</h2><i /><p>{body}</p>{page !== "cases" && <ArrowButton href="/contact">與我們合作</ArrowButton>}</div><div className="inner-photo"><img src={pagePhotos[page as keyof typeof pagePhotos]} alt="Goodie 品牌商品系列" /></div></section>;
}

function ContactBand() {
  const company = content.company;
  return <section className="contact-band"><div className="contact-lead"><h2>準備好與我們合作了嗎？</h2><p>讓 Goodie 成為您品牌的最佳夥伴，創造更多可能。</p><ul><li>☎　{company.phone}</li>{company.email && <li>✉　{company.email}</li>}<li>●　{company.address}</li></ul></div><FullContactForm compact /></section>;
}

function LineFloating() {
  const [open, setOpen] = useState(false);
  return <aside className={`line-floating${open ? " open" : ""}`}><div className="line-popup" aria-hidden={!open}><button type="button" onClick={()=>setOpen(false)} aria-label="關閉 LINE QR Code">×</button><b>LINE 官方帳號</b><img src="/goodie/line-official-qr.png" alt="Goodie LINE 官方帳號 QR Code" /><small>掃描 QR Code 加入好友</small></div><button className="line-fab" type="button" aria-label="開啟 LINE 官方帳號 QR Code" aria-expanded={open} onClick={()=>setOpen(!open)}>LINE</button></aside>;
}

function FullContactForm({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);
  function submit(e: FormEvent) { e.preventDefault(); setSent(true); }
  return <form className={`contact-form${compact ? " contact-band-form" : ""}`} onSubmit={submit}><label>姓名 *<input placeholder="請輸入您的姓名" required /></label><label>公司名稱 *<input placeholder="請輸入公司名稱" required /></label><label>電子郵件 *<input type="email" placeholder="請輸入電子郵件" required /></label><label>聯絡電話 *<input placeholder="請輸入聯絡電話" required /></label><label className="full">專案類型 *<select required defaultValue=""><option value="" disabled>請選擇專案類型</option>{contactProjectTypes.map((title)=><option key={title}>{title}</option>)}</select></label><label>預計專案時間<input placeholder="例如：希望於 3 個月內完成" /></label><label>預估數量<input placeholder="例如：1,000 份" /></label><label className="full">您的需求或專案描述 *<textarea placeholder="請簡單說明您的需求、預算、數量、交期等資訊，我們將盡快與您聯繫。" required /></label><label className="full upload">上傳參考圖片（選填）<input type="file" accept=".jpg,.jpeg,.png,.pdf,.ai" /><small>支援 JPG / PNG / PDF / AI 檔案</small></label><button className="dark-button full" type="submit">{sent?"需求已送出，謝謝您":"開始專案 →"}</button></form>;
}

function Footer() {
  return <footer><span>© 2026 KLIX INTERNATIONAL CO., LTD. All Rights Reserved.</span></footer>;
}

function HomePage() {
  const why = [["◎", "專人專案服務", "專屬專案經理全程陪伴，快速理解需求，提供最佳解決方案。"], ["◉", "全球供應鏈整合", "整合全球優質供應資源，提供最具競爭力的價格與穩定交期。"], ["◇", "大型專案經驗", "豐富的大型專案執行經驗，確保每個環節完美到位。"], ["✦", "客製化開發能力", "從設計到生產一條龍服務，實現各種創意與想法。"]];
  const categories = content.home.categories;
  const homeCases = [cases[0], cases[2], cases[3], cases[4]];
  return <><Hero /><main>
    <section className="section"><div className="container"><SectionTitle>我們可以協助哪些專案</SectionTitle><div className="service-cards">{services.map(({title,description},i)=><a className={i===services.length-1?"consultation-card":""} href={i===services.length-1?"/contact":`/services?service=${i}#service-${i}`} key={title} aria-label={i===services.length-1?"前往客製專案諮詢":`查看${title}服務`}><ServiceIcon index={i}/><h3>{title}</h3><p>{description}</p><span className="service-card-link">{i===services.length-1?"告訴我們您的需求 →":"查看服務 →"}</span></a>)}</div></div></section>
    <section className="section soft"><div className="container"><SectionTitle eyebrow="WHY GOODIE">為什麼選擇 Goodie？</SectionTitle><div className="feature-grid">{why.map(([, title, body],i) => <article key={title}><Pictogram icon={homeWhyIcons[i]} className="feature-pictogram"/><h3>{title}</h3><p>{body}</p></article>)}</div><div className="stat-row">{[["50+","國際品牌"],["300+","專案完成"],["100+","合作工廠"],["20+","外銷全球"]].map(([n,l],i)=><div key={l}><Pictogram icon={homeStatIcons[i]} className="stat-pictogram"/><strong>{n}</strong><b>{l}</b></div>)}</div></div></section>
    <section className="section compact"><div className="container"><div className="title-link"><SectionTitle>合作案例</SectionTitle><a href="/cases">查看全部合作案例 →</a></div><div className="case-grid home-cases">{homeCases.map((item,i)=><CaseCard key={item.slug} item={item} index={i} home />)}</div></div></section>
    <section className="section compact"><div className="container"><SectionTitle>合作流程</SectionTitle><div className="mini-process">{processSteps.map(([n,title])=><a href="/process" key={n}><span>{n}</span><b>{title}</b></a>)}</div></div></section>
    <section className="section compact"><div className="container"><SectionTitle>產品分類</SectionTitle><div className="category-grid">{categories.map((x,i)=><article key={x}><div className="product-crop"><img src={categoryImages[i]} alt={`${x}客製商品展示`} /></div><h3>{x}</h3></article>)}</div></div></section>
  </main><ContactBand /></>;
}

function AboutPage() {
  return <><Hero page="about" /><main><section className="section"><div className="container"><SectionTitle eyebrow="OUR MISSION" center>我們的使命</SectionTitle><p className="center-copy">以創意與專業，打造兼具實用性與品牌價值的商品，讓每一份禮贈品都成為品牌的最佳代言人。</p><div className="mission-stats">{[["20+","外銷全球國家"],["300+","專案完成"],["100+","合作工廠"],["98%","國際品牌信賴度"]].map(([n,l],i)=><article key={l}><Pictogram icon={missionIcons[i]}/><strong>{n}</strong><h3>{l}</h3></article>)}</div><SectionTitle eyebrow="WHY CHOOSE GOODIE" center>為什麼選擇 Goodie？</SectionTitle><div className="feature-grid five">{[["專人專案服務","專屬團隊全程陪伴，從需求討論到交貨。"],["客製化開發能力","從設計提案、打樣到量產，提供完整客製方案。"],["全球供應鏈整合","整合全球優質供應資源與穩定交期。"],["嚴格品質控管","層層把關，確保商品品質。"],["售後與物流支援","完整售後服務與全球物流支援。"]].map(([t,b],i)=><article key={t}><Pictogram icon={aboutWhyIcons[i]}/><h3>{t}</h3><p>{b}</p></article>)}</div></div></section></main><ContactBand /></>;
}

function ServicesPage() {
  const [open, setOpen] = useState(0);
  const serviceCategories = services.slice(0, -1);
  const consultation = services[services.length - 1];
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("service")) return;
    const requested = Number(params.get("service"));
    if (!Number.isInteger(requested) || requested < 0 || requested >= serviceCategories.length) return;
    setOpen(requested);
    const timer = window.setTimeout(() => document.getElementById(`service-${requested}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    return () => window.clearTimeout(timer);
  }, []);
  return <><Hero page="services" /><main><section className="section"><div className="container"><SectionTitle center>我們的專案服務</SectionTitle><p className="center-copy">針對不同情境與需求，提供最適合的品牌商品方案</p><div className="accordion">{serviceCategories.map(({title,description,detail,pairings},i)=><article id={`service-${i}`} className={open===i?"expanded":""} key={title}><button onClick={()=>setOpen(open===i?-1:i)} aria-expanded={open===i}><ServiceIcon index={i}/><span><strong>{title}</strong>{open!==i&&<small>{description}</small>}</span><em>{open===i?"⌃":"⌄"}</em></button>{open===i&&<div className="service-detail"><div className="service-purpose"><p>{detail}</p><b>{description}</b></div><div className="service-pairings"><h4>常見搭配</h4><ul>{pairings.map((product)=><li key={product}>{product}</li>)}</ul></div><div className={`service-products-photo service-products-${i}`}><img src={serviceProductImages[i].src} alt={serviceProductImages[i].alt} /></div></div>}</article>)}</div><aside className="service-consultation"><ServiceIcon index={services.length-1}/><div><small>需要不同的商品組合嗎？</small><h3>{consultation.title}</h3><p>{consultation.detail}</p></div><ArrowButton href="/contact">告訴我們您的需求</ArrowButton></aside></div></section></main><ContactBand /></>;
}

function CaseCard({ item, index: _index, home = false }: { item: CaseItem; index: number; home?: boolean }) {
  const image = home ? homeCaseImages[item.slug] ?? caseImages[item.slug] : caseImages[item.slug];
  return <article className="case-card" aria-label={`合作案例：${item.title}`}><div className="case-image"><img src={image} alt={`${item.title}商品成果`} /></div><span>{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><small>◷ {item.year}　♙ {item.quantity}　◇ {item.items.join("、")}</small></article>;
}

export function CaseDetailPage({ slug }: { slug: string }) {
  const index = content.cases.findIndex((item) => item.slug === slug);
  const item = content.cases[index];
  if (!item) return null;
  return <div className="site-shell"><Header page="cases"/><main className="case-detail-page"><section className="case-detail-hero"><div><p>{item.category}</p><h1>{item.title}</h1><h2>{item.description}</h2><ArrowButton href="/contact">洽詢類似專案</ArrowButton></div><div className="case-detail-image"><img src={caseImages[item.slug]} alt={item.title} /></div></section><section className="section"><div className="container case-detail-content"><SectionTitle>專案成果</SectionTitle><p>{item.detail}</p><div className="case-detail-facts"><article><small>專案年份</small><strong>{item.year}</strong></article><article><small>製作數量</small><strong>{item.quantity}</strong></article><article><small>服務內容</small><strong>{item.items.join("、")}</strong></article></div><ArrowButton href="/cases" outline>返回全部案例</ArrowButton></div></section></main><ContactBand/><Footer/></div>;
}

function CasesPage() {
  return <><Hero page="cases" /><main><section className="section"><div className="container"><div className="case-grid">{cases.map((item,i)=><CaseCard key={item.slug} item={item} index={i} />)}</div><div className="center-action"><ArrowButton href="/contact" outline>啟動您的品牌專案</ArrowButton></div><div className="impact-row">{[["300+","專案完成"],["1,000+","客製商品"],["20+","合作國家"],["98%","客戶滿意度"]].map(([n,l])=><div key={l}><strong>{n}</strong><b>{l}</b></div>)}</div></div></section></main><ContactBand /></>;
}

function ProcessPage() {
  return <><Hero page="process" /><main><section className="section"><div className="container wide"><SectionTitle center>我們的合作流程</SectionTitle><div className="process-grid">{processSteps.map(([n,title,body],i)=><article key={n}><Pictogram icon={processIcons[i]}/><strong>{n}</strong><h3>{title}</h3><p>{body}</p><div className={`process-image process-${i}`}><img src="/ref-process.png" alt="" /></div></article>)}</div><div className="benefit-row">{["嚴格品質控管","準時交付","專人服務","長期合作夥伴"].map((title,i)=><div key={title}><Pictogram icon={benefitIcons[i]}/><h3>{title}</h3></div>)}</div></div></section></main><ContactBand /></>;
}

function ContactPage() {
  const company = content.company;
  return <main className="contact-page"><div className="contact-page-inner"><section className="contact-intro"><h1>準備好與我們<br/>合作了嗎？</h1><i/><p>讓 Goodie 成為您品牌的最佳夥伴，<br/>創造更多可能。</p><ul><li>☎　{company.phone}</li><li>✉　{company.email}</li><li>●　{company.address}<br/><small>　　{company.businessHours}</small></li></ul></section><FullContactForm /></div><p className="contact-copyright">© 2026 KLIX INTERNATIONAL CO., LTD. All Rights Reserved.</p></main>;
}

export function GoodieSite({ page }: { page: SitePage }) {
  return <div className="site-shell"><Header page={page}/>{page==="home"&&<HomePage/>}{page==="about"&&<AboutPage/>}{page==="services"&&<ServicesPage/>}{page==="cases"&&<CasesPage/>}{page==="process"&&<ProcessPage/>}{page==="contact"&&<ContactPage/>}{page!=="contact"&&<Footer/>}<LineFloating /></div>;
}
