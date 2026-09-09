"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { user, isAuthed, logout } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "Admin";

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="cs-site__header cs-style1">
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
                          {t("home")}
                        </Link>
                      </li>

                      {isAuthed && isAdmin && (
                        <li className="nav-item">
                          <Link className="nav-link" href="/admin">
                            {lang === "ar" ? "لوحة التحكم" : "Admin panel"}
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
                            {lang === "ar" ? "الفاتحة" : "Fatiha"}
                          </a>
                          <ul className="dropdown-menu" aria-labelledby="fatihaDropdown">
                            <li>
                              <Link className="dropdown-item" href="/fatiha-requests">
                                {lang === "ar" ? "طلبات الفاتحة" : "Fatiha Request"}
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/books">
                                <i className="fas fa-book-open me-2"></i>
                                {lang === "ar" ? "مكتبة الفاتحة" : "Fatiha Library"}
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/blogs">
                                <i className="fas fa-blog me-2"></i>
                                {lang === "ar" ? "مدوّنة الفاتحة" : "Fatiha Blog"}
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/marketplace">
                                <i className="fas fa-store me-2"></i>
                                {lang === "ar" ? "متجر الفاتحة" : "Fatiha Marketplace"}
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/fatiha-requests">
                                {lang === "ar" ? "تقديم طلب" : "Apply"}
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
                            {lang === "ar" ? "المُجاز" : "MJAZ"}
                          </a>
                          <ul className="dropdown-menu" aria-labelledby="mjazDropdown">
                            <li>
                              <Link className="dropdown-item" href="/authorized-users">
                                {lang === "ar" ? "الطلبات" : "Requests"}
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" href="/authorized-users/apply">
                                {lang === "ar" ? "تقديم طلب" : "Apply"}
                              </Link>
                            </li>
                          </ul>
                        </li>
                      )}

                      {!isAuthed && (
                        <li className="nav-item">
                          <Link className="nav-link" href="/register">
                            {t("register")}
                          </Link>
                        </li>
                      )}
                      {!isAuthed && (
                        <li className="nav-item">
                          <Link className="nav-link" href="/login">
                            {lang === "ar" ? "تسجيل الدخول" : "Log in"}
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
                            {lang === "ar" ? "الإعدادات" : "Settings"}
                          </a>
                          <ul className="dropdown-menu dropdown-menu-end">
                            {isAdmin && (
                              <>
                                <li>
                                  <Link className="dropdown-item" href="/admin/newsletter">
                                    <i className="fas fa-envelope me-2"></i>
                                    {lang === "ar" ? "إرسال نشرة" : "Send Newsletter"}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/pages">
                                    <i className="fas fa-file-alt me-2"></i>
                                    {lang === "ar" ? "إدارة الصفحات" : "Manage Static Pages"}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/books">
                                    <i className="fas fa-book me-2"></i>
                                    {lang === "ar" ? "إدارة المكتبة" : "Manage Fatiha Library"}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/blogs">
                                    <i className="fas fa-blog me-2"></i>
                                    {lang === "ar" ? "إدارة المدوّنة" : "Manage Fatiha Blog"}
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="/admin/marketplace">
                                    <i className="fas fa-store me-2"></i>
                                    {lang === "ar" ? "إدارة المتجر" : "Manage Fatiha Marketplace"}
                                  </Link>
                                </li>
                              </>
                            )}
                            <li>
                              <Link className="dropdown-item" href="/profile">
                                <i className="fas fa-user-edit me-2"></i>
                                {lang === "ar" ? "تحديث الملف" : "Update Profile"}
                              </Link>
                            </li>
                            <li>
                              <hr className="dropdown-divider" />
                            </li>
                            <li>
                              <button className="dropdown-item text-danger" onClick={handleLogout} style={btnStyle}>
                                <i className="fas fa-sign-out-alt me-2"></i>
                                {lang === "ar" ? "تسجيل الخروج" : "Log out"}
                              </button>
                            </li>
                          </ul>
                        </li>
                      )}

                      {/* اللغة */}
                      <li className="nav-item dropdown">
                        <a
                          className="nav-link dropdown-toggle"
                          href="#"
                          role="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className="fas fa-language me-1"></i>
                          {lang === "ar" ? "اللغة" : "Languages"}
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button className="dropdown-item" onClick={() => setLang("ar")} style={btnStyle}>
                              العربية
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => setLang("en")} style={btnStyle}>
                              English
                            </button>
                          </li>
                        </ul>
                      </li>
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
