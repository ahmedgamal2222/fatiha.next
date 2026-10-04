"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
  const { t } = useI18n();
  const { user, isAuthed, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.role === "Admin";
  const isHome = pathname === "/";

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
                        <Link className="nav-link" href="/">
                          {t("Home")}
                        </Link>
                      </li>

                      {isAuthed && isAdmin && (
                        <li className="nav-item">
                          <Link className="nav-link" href="/admin">
                            {t("Admin panel")}
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
                            <li>
                              <Link className="dropdown-item" href="/fatiha-requests">
                                {t("Fatiha Request")}
                              </Link>
                            </li>
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
                            <li>
                              <Link className="dropdown-item" href="/fatiha-requests">
                                {t("Apply")}
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
                                {t("Requests")}
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/authorized-users/apply">
                                {t("Apply")}
                              </Link>
                            </li>
                          </ul>
                        </li>
                      )}

                      {!isAuthed && (
                        <li className="nav-item">
                          <Link className="nav-link" href="/register">
                            {t("Register")}
                          </Link>
                        </li>
                      )}
                      {!isAuthed && (
                        <li className="nav-item">
                          <Link className="nav-link" href="/login">
                            {t("Log in")}
                          </Link>
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
