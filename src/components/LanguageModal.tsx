"use client";

import { useI18n } from "@/context/I18nContext";

export function LanguageModal() {
  const { languages, lang, setLang, isLanguageModalOpen, closeLanguageModal } = useI18n();
  if (!isLanguageModalOpen) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
      role="dialog"
      onClick={closeLanguageModal}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content rounded-4">
          <div className="modal-header">
            <h5 className="modal-title">{lang === "ar" ? "اختر لغتك" : "Choose Your Language"}</h5>
            <button type="button" className="btn-close" onClick={closeLanguageModal}></button>
          </div>
          <div className="modal-body">
            <div className="list-group">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center${
                    l.code === lang ? " active" : ""
                  }`}
                  onClick={() => setLang(l.code)}
                  dir={l.dir}
                >
                  <span>{l.name}</span>
                  {l.code === lang && <i className="fas fa-check"></i>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
