"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useRouter, usePathname } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";
import { api } from "@/lib/api";

type MenuKey = "fatiha" | "mjaz" | "admin" | "user" | null;

interface NavLink {
  href: string;
  label: string;
  icon: string;
  desc?: string;
}

/**
 * هيدر مخصّص بالكامل (بدون Bootstrap) لضمان تناسق الأيقونات والمسافات في كل
 * اللغات والاتجاهات، مع قوائم منسدلة تُدار بـ React ودرج جوال انسيابي.
 */
export function Navbar() {
  const { t, lang, languages, openLanguageModal } = useI18n();
  const { user, isAuthed, isAdmin, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // لا يظهر رابط الاختبار التأهيلي إلا لمن لديه طلب قائم مؤهّل للاختبار
  const [canTakeExam, setCanTakeExam] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const isHome = pathname === "/";
  const isBuilder = pathname.startsWith("/admin/pages/builder");
  const currentLangName = languages.find((l) => l.code === lang)?.name ?? "";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const fatihaLinks: NavLink[] = [
    { href: "/fatiha-requests/new", label: t("Apply"), icon: "fa-file-signature", desc: t("New Fatiha Request") },
    { href: "/fatiha-requests", label: t("Fatiha Requests"), icon: "fa-clipboard-list", desc: t("My Requests") },
    // يظهر الاختبار فقط عند وجود طلب قائم لم يُعتمد بعد (وليس لمجرد تسجيل الدخول)
    ...(canTakeExam
      ? [{ href: "/fatiha-exam", label: t("Take Qualifying Exam"), icon: "fa-graduation-cap" }]
      : []),
    { href: "/al-qerat", label: t("Ten Recitations (Al-Qerat)"), icon: "fa-book-quran", desc: t("Listen to the recitations") },
  ];

  const mjazLinks: NavLink[] = [
    { href: "/authorized-users/apply", label: t("Apply"), icon: "fa-user-graduate", desc: t("Join as an instructor") },
    { href: "/authorized-users", label: t("Requests"), icon: "fa-users-rectangle", desc: t("Certified instructors") },
  ];

  const adminLinks: NavLink[] = [
    { href: "/admin", label: t("Admin Panel"), icon: "fa-gauge-high", desc: t("Dashboard") },
    { href: "/admin/fatiha-requests", label: t("Manage Fatiha Requests"), icon: "fa-clipboard-check" },
    { href: "/admin/authorized-users", label: t("Ijazah Applications"), icon: "fa-user-graduate" },
    { href: "/admin/al-qerat", label: t("Manage Recitations"), icon: "fa-book-quran" },
    { href: "/admin/fatiha-exam", label: t("Manage Exam Questions"), icon: "fa-circle-question" },
    { href: "/admin/users", label: t("Manage Users"), icon: "fa-users" },
    { href: "/admin/certificates", label: t("Certificates"), icon: "fa-certificate" },
    { href: "/admin/newsletter", label: t("Send Newsletter"), icon: "fa-envelope" },
    { href: "/admin/pages", label: t("Manage Static Pages"), icon: "fa-file-lines" },
    { href: "/admin/books", label: t("Manage Fatiha Library"), icon: "fa-book" },
    { href: "/admin/blogs", label: t("Manage Fatiha Blog"), icon: "fa-newspaper" },
    { href: "/admin/marketplace", label: t("Manage Fatiha Marketplace"), icon: "fa-store" },
    { href: "/admin/settings", label: t("Settings"), icon: "fa-gear" },
  ];

  const userLinks: NavLink[] = [
    { href: "/profile", label: t("Update Profile"), icon: "fa-user-pen" },
    { href: "/fatiha-requests", label: t("Fatiha Requests"), icon: "fa-clipboard-list" },
  ];

  useEffect(() => {
    setOpenMenu(null);
    setDrawer(false);
  }, [pathname]);

  // تحديث أهلية الاختبار: لا يظهر الرابط إلا لصاحب طلب قائم غير معتمد
  const refreshExamEligibility = useCallback(async () => {
    if (!isAuthed || isAdmin) {
      setCanTakeExam(false);
      return;
    }
    try {
      const res = await api.get<Array<{ status: number; isApproved: boolean }>>("/api/fatiha-requests");
      setCanTakeExam(
        (res.data ?? []).some((r) => !r.isApproved && r.status !== 2 && r.status !== 3)
      );
    } catch {
      setCanTakeExam(false);
    }
  }, [isAuthed, isAdmin]);

  useEffect(() => {
    void refreshExamEligibility();
  }, [refreshExamEligibility, pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenMenu(null); setDrawer(false); }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer]);

  const toggle = useCallback((key: MenuKey) => {
    setOpenMenu((current) => (current === key ? null : key));
  }, []);

  async function handleLogout() {
    setOpenMenu(null);
    setDrawer(false);
    await logout();
    router.push("/");
  }

  const headerClass = [
    "fhx-header",
    isHome ? "is-home" : "is-solid",
    scrolled ? "is-scrolled" : "",
    isBuilder ? "fhx-header--hidden" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <header className={headerClass} ref={headerRef}>
        <div className="fhx-shell">
          <div className="fhx-header__bar">
            <Link className="fhx-brand" href="/" aria-label="Fatiha.id">
              <span className="fhx-brand__seal">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Logo.png" alt="Fatiha.id" />
              </span>
              <span className="fhx-brand__text">
                <strong>{t("Fathia")}</strong>
                <small>FATIHA.ID</small>
              </span>
            </Link>

            <nav className="fhx-nav" aria-label={t("Main navigation")}>
              <Link href="/" className={`fhx-nav__link${isActive("/") ? " is-active" : ""}`} aria-current={isActive("/") ? "page" : undefined}>
                <span className="fhx-nav__ic"><i className="fas fa-house" aria-hidden="true" /></span>
                <span className="fhx-nav__label">{t("Home")}</span>
              </Link>

              {isAuthed && !isAdmin && (
                <div className="fhx-menu">
                  <button
                    type="button"
                    className={`fhx-nav__link${openMenu === "fatiha" ? " is-open" : ""}`}
                    aria-expanded={openMenu === "fatiha"}
                    aria-haspopup="true"
                    onClick={() => { toggle("fatiha"); void refreshExamEligibility(); }}
                  >
                    <span className="fhx-nav__ic"><i className="fas fa-book-open" aria-hidden="true" /></span>
                    <span className="fhx-nav__label">{t("Fathia")}</span>
                    <i className="fas fa-chevron-down fhx-nav__caret" aria-hidden="true" />
                  </button>
                  {openMenu === "fatiha" && (
                    <div className="fhx-dropdown" role="menu">
                      <div className="fhx-dropdown__label">
                        <i className="fas fa-star-and-crescent" aria-hidden="true" />
                        {t("Fatiha journey")}
                      </div>
                      {fatihaLinks.map((item) => (
                        <Link key={item.href} href={item.href} className="fhx-drop" role="menuitem">
                          <span className="fhx-drop__ic"><i className={`fas ${item.icon}`} aria-hidden="true" /></span>
                          <span className="fhx-drop__text">
                            <strong>{item.label}</strong>
                            {item.desc ? <small>{item.desc}</small> : null}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isAuthed && !isAdmin && (
                <div className="fhx-menu">
                  <button
                    type="button"
                    className={`fhx-nav__link${openMenu === "mjaz" ? " is-open" : ""}`}
                    aria-expanded={openMenu === "mjaz"}
                    aria-haspopup="true"
                    onClick={() => toggle("mjaz")}
                  >
                    <span className="fhx-nav__ic"><i className="fas fa-user-graduate" aria-hidden="true" /></span>
                    <span className="fhx-nav__label">{t("MJAZ")}</span>
                    <i className="fas fa-chevron-down fhx-nav__caret" aria-hidden="true" />
                  </button>
                  {openMenu === "mjaz" && (
                    <div className="fhx-dropdown" role="menu">
                      <div className="fhx-dropdown__label">
                        <i className="fas fa-award" aria-hidden="true" />
                        {t("Certified instructors")}
                      </div>
                      {mjazLinks.map((item) => (
                        <Link key={item.href} href={item.href} className="fhx-drop" role="menuitem">
                          <span className="fhx-drop__ic"><i className={`fas ${item.icon}`} aria-hidden="true" /></span>
                          <span className="fhx-drop__text">
                            <strong>{item.label}</strong>
                            {item.desc ? <small>{item.desc}</small> : null}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Link href="/al-qerat" className={`fhx-nav__link${isActive("/al-qerat") ? " is-active" : ""}`}>
                <span className="fhx-nav__ic"><i className="fas fa-book-quran" aria-hidden="true" /></span>
                <span className="fhx-nav__label">{t("Qiraat")}</span>
              </Link>

              <Link href="/books" className={`fhx-nav__link${isActive("/books") ? " is-active" : ""}`}>
                <span className="fhx-nav__ic"><i className="fas fa-book-open-reader" aria-hidden="true" /></span>
                <span className="fhx-nav__label">{t("Fatiha Library")}</span>
              </Link>

              {isAdmin && (
                <div className="fhx-menu">
                  <button
                    type="button"
                    className={`fhx-nav__link${openMenu === "admin" || isActive("/admin") ? " is-open is-active" : ""}`}
                    aria-expanded={openMenu === "admin"}
                    aria-haspopup="true"
                    onClick={() => toggle("admin")}
                  >
                    <span className="fhx-nav__ic"><i className="fas fa-gauge-high" aria-hidden="true" /></span>
                    <span className="fhx-nav__label">{t("Admin Panel")}</span>
                    <i className="fas fa-chevron-down fhx-nav__caret" aria-hidden="true" />
                  </button>
                  {openMenu === "admin" && (
                    <div className="fhx-dropdown fhx-dropdown--wide" role="menu">
                      <div className="fhx-dropdown__label">
                        <i className="fas fa-shield-halved" aria-hidden="true" />
                        {t("Control center")}
                      </div>
                      {adminLinks.map((item) => (
                        <Link key={item.href} href={item.href} className="fhx-drop" role="menuitem">
                          <span className="fhx-drop__ic"><i className={`fas ${item.icon}`} aria-hidden="true" /></span>
                          <span className="fhx-drop__text"><strong>{item.label}</strong></span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            <div className="fhx-actions">
              <button
                type="button"
                className="fhx-icon-btn"
                onClick={openLanguageModal}
                title={`${t("Languages")} — ${currentLangName}`}
                aria-label={t("Languages")}
              >
                <i className="fas fa-globe" aria-hidden="true" />
              </button>

              {isAuthed && <NotificationBell />}

              {!authLoading && !isAuthed && (
                <div className="fhx-auth">
                  <Link href="/login" className="fhx-btn fhx-btn--ghost">
                    <i className="fas fa-right-to-bracket" aria-hidden="true" />
                    {t("Log in")}
                  </Link>
                  <Link href="/register" className="fhx-btn fhx-btn--gold">
                    <i className="fas fa-user-plus" aria-hidden="true" />
                    {t("Register")}
                  </Link>
                </div>
              )}

              {!authLoading && isAuthed && (
                <div className="fhx-menu">
                  <button
                    type="button"
                    className="fhx-icon-btn"
                    aria-expanded={openMenu === "user"}
                    aria-haspopup="true"
                    aria-label={t("Account menu")}
                    onClick={() => toggle("user")}
                  >
                    <i className="fas fa-user" aria-hidden="true" />
                  </button>
                  {openMenu === "user" && (
                    <div className="fhx-dropdown" role="menu" style={{ insetInlineStart: "auto", insetInlineEnd: 0 }}>
                      <div className="fhx-dropdown__user">
                        <span className="fhx-dropdown__avatar"><i className="fas fa-user" aria-hidden="true" /></span>
                        <span className="fhx-dropdown__meta">
                          <strong>{user?.nameAr || user?.nameEn || t("profile")}</strong>
                          <small>{user?.email}</small>
                        </span>
                      </div>
                      {userLinks.map((item) => (
                        <Link key={item.href} href={item.href} className="fhx-drop" role="menuitem">
                          <span className="fhx-drop__ic"><i className={`fas ${item.icon}`} aria-hidden="true" /></span>
                          <span className="fhx-drop__text"><strong>{item.label}</strong></span>
                        </Link>
                      ))}
                      <div className="fhx-dropdown__sep" />
                      <button type="button" className="fhx-drop fhx-drop--danger" onClick={handleLogout} role="menuitem">
                        <span className="fhx-drop__ic"><i className="fas fa-right-from-bracket" aria-hidden="true" /></span>
                        <span className="fhx-drop__text"><strong>{t("Log out")}</strong></span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className={`fhx-burger${drawer ? " is-open" : ""}`}
                aria-label={t("Menu")}
                aria-expanded={drawer}
                onClick={() => { setDrawer((v) => !v); if (!drawer) void refreshExamEligibility(); }}
              >
                <span /><span /><span />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`fhx-drawer${drawer ? " is-open" : ""}`} aria-hidden={!drawer}>
        <div className="fhx-drawer__backdrop" onClick={() => setDrawer(false)} />
        <aside className="fhx-drawer__panel" role="dialog" aria-modal="true" aria-label={t("Menu")}>
          <div className="fhx-drawer__head">
            <Link className="fhx-brand" href="/" onClick={() => setDrawer(false)}>
              <span className="fhx-brand__seal">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Logo.png" alt="Fatiha.id" />
              </span>
              <span className="fhx-brand__text">
                <strong>{t("Fathia")}</strong>
                <small>FATIHA.ID</small>
              </span>
            </Link>
            <button type="button" className="fhx-drawer__close" onClick={() => setDrawer(false)} aria-label={t("Close")}>
              <i className="fas fa-xmark" aria-hidden="true" />
            </button>
          </div>

          <div className="fhx-drawer__group">
            <div className="fhx-drawer__title">
              <i className="fas fa-compass" aria-hidden="true" />
              {t("Navigate")}
            </div>
            <Link href="/" className={`fhx-dlink${isActive("/") ? " is-active" : ""}`} onClick={() => setDrawer(false)}>
              <span className="fhx-dlink__ic"><i className="fas fa-house" aria-hidden="true" /></span>
              <span>{t("Home")}</span>
            </Link>
            <Link href="/al-qerat" className={`fhx-dlink${isActive("/al-qerat") ? " is-active" : ""}`} onClick={() => setDrawer(false)}>
              <span className="fhx-dlink__ic"><i className="fas fa-book-quran" aria-hidden="true" /></span>
              <span>{t("Ten Recitations (Al-Qerat)")}</span>
            </Link>
            <Link href="/books" className={`fhx-dlink${isActive("/books") ? " is-active" : ""}`} onClick={() => setDrawer(false)}>
              <span className="fhx-dlink__ic"><i className="fas fa-book-open-reader" aria-hidden="true" /></span>
              <span>{t("Fatiha Library")}</span>
            </Link>
            <Link href="/blogs" className={`fhx-dlink${isActive("/blogs") ? " is-active" : ""}`} onClick={() => setDrawer(false)}>
              <span className="fhx-dlink__ic"><i className="fas fa-newspaper" aria-hidden="true" /></span>
              <span>{t("Fatiha Blog")}</span>
            </Link>
            <Link href="/marketplace" className={`fhx-dlink${isActive("/marketplace") ? " is-active" : ""}`} onClick={() => setDrawer(false)}>
              <span className="fhx-dlink__ic"><i className="fas fa-store" aria-hidden="true" /></span>
              <span>{t("Fatiha Marketplace")}</span>
            </Link>
          </div>

          {isAuthed && !isAdmin && (
            <div className="fhx-drawer__group">
              <div className="fhx-drawer__title">
                <i className="fas fa-star-and-crescent" aria-hidden="true" />
                {t("Fatiha journey")}
              </div>
              {fatihaLinks.map((item) => (
                <Link key={item.href} href={item.href} className="fhx-dlink" onClick={() => setDrawer(false)}>
                  <span className="fhx-dlink__ic"><i className={`fas ${item.icon}`} aria-hidden="true" /></span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {isAuthed && !isAdmin && (
            <div className="fhx-drawer__group">
              <div className="fhx-drawer__title">
                <i className="fas fa-award" aria-hidden="true" />
                {t("MJAZ")}
              </div>
              {mjazLinks.map((item) => (
                <Link key={item.href} href={item.href} className="fhx-dlink" onClick={() => setDrawer(false)}>
                  <span className="fhx-dlink__ic"><i className={`fas ${item.icon}`} aria-hidden="true" /></span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="fhx-drawer__group">
              <div className="fhx-drawer__title">
                <i className="fas fa-shield-halved" aria-hidden="true" />
                {t("Control center")}
              </div>
              {adminLinks.map((item) => (
                <Link key={item.href} href={item.href} className="fhx-dlink" onClick={() => setDrawer(false)}>
                  <span className="fhx-dlink__ic"><i className={`fas ${item.icon}`} aria-hidden="true" /></span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="fhx-drawer__group">
            <div className="fhx-drawer__title">
              <i className="fas fa-language" aria-hidden="true" />
              {t("Language")}
            </div>
            <button
              type="button"
              className="fhx-dlink"
              onClick={() => { setDrawer(false); openLanguageModal(); }}
            >
              <span className="fhx-dlink__ic"><i className="fas fa-globe" aria-hidden="true" /></span>
              <span style={{ flex: "1 1 auto" }}>{currentLangName}</span>
              <i className="fas fa-chevron-down" aria-hidden="true" />
            </button>
          </div>

          <div className="fhx-drawer__foot">
            {authLoading ? null : isAuthed ? (
              <>
                <div className="fhx-drawer__user">
                  <span className="fhx-dropdown__avatar"><i className="fas fa-user" aria-hidden="true" /></span>
                  <span className="fhx-dropdown__meta">
                    <strong>{user?.nameAr || user?.nameEn || t("profile")}</strong>
                    <small>{user?.email}</small>
                  </span>
                </div>
                <Link href="/profile" className="fhx-btn fhx-btn--emerald" onClick={() => setDrawer(false)}>
                  <i className="fas fa-user-pen" aria-hidden="true" />
                  {t("Update Profile")}
                </Link>
                <button type="button" className="fhx-btn fhx-btn--ghost" onClick={handleLogout}>
                  <i className="fas fa-right-from-bracket" aria-hidden="true" />
                  {t("Log out")}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="fhx-btn fhx-btn--emerald" onClick={() => setDrawer(false)}>
                  <i className="fas fa-right-to-bracket" aria-hidden="true" />
                  {t("Log in")}
                </Link>
                <Link href="/register" className="fhx-btn fhx-btn--gold" onClick={() => setDrawer(false)}>
                  <i className="fas fa-user-plus" aria-hidden="true" />
                  {t("Register")}
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>

    </>
  );
}
