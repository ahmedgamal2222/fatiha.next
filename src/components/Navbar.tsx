"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useRouter, usePathname } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";

export function Navbar() {
  const { t, lang, languages, openLanguageModal } = useI18n();
  const { user, isAuthed, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.role === "Admin";
  const isHome = pathname === "/";
  const currentLangName = languages.find((l) => l.code === lang)?.name ?? "";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className={`cs-site__header cs-style1${isHome ? " cs-nav--home" : ""}`}>
      <div className="cs-main__header">
        <div className="container">
          <div className="cs-main__header__in">
            {/* الشعار */}
            <div className="cs-main__header__left">
              <Link className="navbar-brand cs-site__branding" href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Logo.png" alt="Fatiha.id" />
              </Link>
            </div>

            {/* القائمة */}
            <div className="cs-main__header__right">
              <nav className="navbar navbar-expand-lg">
                <div className="container-fluid">
                  <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                  >
                    <span className="navbar-toggler-icon"></span>
                  </button>

                  <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto cs-nav__list">
                      <li className="nav-item">
                        <Link className={`nav-link${isActive("/") ? " is-active" : ""}`} href="/" aria-current={isActive("/") ? "page" : undefined}>
                          <i className="fas fa-house" aria-hidden="true" />
                          <span>{t("Home")}</span>
                        </Link>
                      </li>

                      {isAuthed && isAdmin && (
                        <li className="nav-item">
                          <Link className={`nav-link${isActive("/admin") ? " is-active" : ""}`} href="/admin">
                            <i className="fas fa-gauge-high" aria-hidden="true" />
                            <span>{t("Admin panel")}</span>
                          </Link>
                        </li>
                      )}

                      {/* قسم الفاتحة */}
                      {isAuthed && !isAdmin && (
                        <li className="nav-item dropdown">
                          <a
                            className="nav-link dropdown-toggle"
                            href="#"
                            id="fatihaDropdown"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            {t("Fathia")}
                          </a>
                          <ul className="dropdown-menu" aria-labelledby="fatihaDropdown">
                            {/* التقديم مباشرةً على طلب الفاتحة (نموذج التقديم) وليس صفحة الطلبات */}
                            <li>
                              <Link className="dropdown-item fw-semibold" href="/fatiha-requests/new">
                                <i className="fas fa-file-signature me-2 text-primary"></i>
                                {t("Apply")}
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/fatiha-requests">
                                <i className="fas fa-list-check me-2"></i>
                                {t("My Fatiha Requests")}
                              </Link>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <Link className="dropdown-item" href="/books">
                                <i className="fas fa-book-open me-2"></i>
                                {t("Fatiha Library")}
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/blogs">
                                <i className="fas fa-blog me-2"></i>
                                {t("Fatiha Blog")}
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/marketplace">
                                <i className="fas fa-store me-2"></i>
                                {t("Fatiha Marketplace")}
                              </Link>
                            </li>
                          </ul>
                        </li>
                      )}

                      {/* قسم المجاز */}
                      {isAuthed && !isAdmin && (
                        <li className="nav-item dropdown">
                          <a
                            className="nav-link dropdown-toggle"
                            href="#"
                            id="mjazDropdown"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            {t("MJAZ")}
                          </a>
                          <ul className="dropdown-menu" aria-labelledby="mjazDropdown">
                            <li>
                              <Link className="dropdown-item" href="/authorized-users">
                                <i className="fas fa-users-rectangle me-2" aria-hidden="true" />
                                {t("Requests")}
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/authorized-users/apply">
                                <i className="fas fa-user-graduate me-2" aria-hidden="true" />
                                {t("Apply")}
                              </Link>
                            </li>
                          </ul>
                        </li>
                      )}

                      {/* مبدّل اللغة — متاح دائماً في الرأس */}
                      <li className="nav-item">
                        <button
                          type="button"
                          className="nav-link fh-lang-switch"
                          onClick={openLanguageModal}
                          title={t("Languages")}
                          aria-label={t("Languages")}
                        >
                          <i className="fas fa-globe" aria-hidden="true" />
                          <span className="fh-lang-switch__text">{currentLangName}</span>
                        </button>
                      </li>

                      {!isAuthed && (
                        <li className="nav-item">
                          <Link className="nav-link" href="/register">
                            <i className="fas fa-user-plus" aria-hidden="true" />
                            <span>{t("Register")}</span>
                          </Link>
                        </li>
                      )}
                      {!isAuthed && (
                        <li className="nav-item">
                          <Link className="nav-link" href="/login">
                            <i className="fas fa-right-to-bracket" aria-hidden="true" />
                            <span>{t("Log in")}</span>
                          </Link>
                        </li>
                      )}

                      {/* جرس الإشعارات */}
                      {isAuthed && (
                        <li className="nav-item d-flex align-items-center">
                          <NotificationBell />
                        </li>
                      )}

                      {/* الإعدادات */}
                      {isAuthed && (
                        <li className="nav-item dropdown">
                          <a
                            className="nav-link dropdown-toggle"
                            href="#"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="fas fa-cog me-1"></i>
                            {t("Settings")}
                          </a>
                          <ul className="dropdown-menu dropdown-menu-end">
                            {isAuthed && user ? (
                              <li className="fh-user-chip">
                                <span className="fh-user-chip__avatar" aria-hidden="true">
                                  <i className="fas fa-user" />
                                </span>
                                <span className="fh-user-chip__meta">
                                  <strong>{user.nameAr || user.nameEn || t("profile")}</strong>
                                  <small dir="ltr">{user.email}</small>
                                </span>
                              </li>
                            ) : null}
                            {isAdmin && (
                              <>
                                <li>
                                  <Link className="dropdown-item" href="/admin">
                                    <i className="fas fa-gauge-high me-2"></i>
                                    {t("Admin panel")}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/fatiha-requests">
                                    <i className="fas fa-clipboard-check me-2"></i>
                                    {t("Manage Fatiha Requests")}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/authorized-users">
                                    <i className="fas fa-user-graduate me-2"></i>
                                    {t("Ijazah Applications")}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/al-qerat">
                                    <i className="fas fa-book-quran me-2"></i>
                                    {t("Manage Recitations")}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/fatiha-exam">
                                    <i className="fas fa-circle-question me-2"></i>
                                    {t("Manage Exam Questions")}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/users">
                                    <i className="fas fa-users me-2"></i>
                                    {t("Manage Users")}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/newsletter">
                                    <i className="fas fa-envelope me-2"></i>
                                    {t("Send Newsletter")}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/pages">
                                    <i className="fas fa-file-alt me-2"></i>
                                    {t("Manage Static Pages")}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/books">
                                    <i className="fas fa-book me-2"></i>
                                    {t("Manage Fatiha Library")}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/blogs">
                                    <i className="fas fa-blog me-2"></i>
                                    {t("Manage Fatiha Blog")}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/marketplace">
                                    <i className="fas fa-store me-2"></i>
                                    {t("Manage Fatiha Marketplace")}
                                  </Link>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                              </>
                            )}
                            <li>
                              <Link className="dropdown-item" href="/profile">
                                <i className="fas fa-user-edit me-2"></i>
                                {t("Update Profile")}
                              </Link>
                            </li>
                            <li>
                              <hr className="dropdown-divider" />
                            </li>
                            <li>
                              <button className="dropdown-item text-danger" onClick={handleLogout} style={btnStyle}>
                                <i className="fas fa-sign-out-alt me-2"></i>
                                {t("Log out")}
                              </button>
                            </li>
                          </ul>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const btnStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "start",
  background: "none",
  border: "none",
};
