"use client";

import { useI18n } from "@/context/I18nContext";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="cs-footer cs-style1 cs-color1 sticky-footer mt-auto footer-fixed">
      <div className="container">
        <div className="row">
          <div className="col-lg-6 col-sm-12">
            <div className="d-flex justify-content-start align-items-center">
              <div>© 2025 - Fatiha.Id {t("All Rights Reserved.")}</div>
            </div>
          </div>
          <div className="col-lg-6 col-sm-12">
            <div className="d-flex justify-content-end">
              <div className="cs-social__btns cs-style1">
                <a href="https://www.facebook.com/profile.php?id=61552038775677" target="_blank" rel="noreferrer">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://x.com/fatihaplatform" target="_blank" rel="noreferrer">
                  <i className="fab fa-x-twitter"></i>
                </a>
                <a href="https://www.linkedin.com/company/106934327" target="_blank" rel="noreferrer">
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a href="https://www.youtube.com/@Fatiha-id" target="_blank" rel="noreferrer">
                  <i className="fab fa-youtube"></i>
                </a>
                <a href="https://www.tiktok.com/@fatihaplatform" target="_blank" rel="noreferrer">
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
