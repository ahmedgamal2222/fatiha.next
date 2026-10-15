"use client";

import { useI18n, type Lang } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export function LanguageModal() {
  const { languages, lang, t, setLang, isLanguageModalOpen, closeLanguageModal } = useI18n();
  const { user, refresh } = useAuth();
  if (!isLanguageModalOpen) return null;

  /**
   * يبدّل لغة الواجهة، ويحدّث لغة المستخدم المفضّلة (preferredCulture) إن كان مسجّلاً،
   * حتى تأتي إشعارات المنصة والرسائل البريدية بنفس اللغة المختارة.
   */
  async function choose(code: Lang) {
    setLang(code);
    const def = languages.find((l) => l.code === code);
    if (!user || !def || def.apiCode === user.preferredCulture) return;
    try {
      await api.put("/api/account/profile", { preferredCulture: def.apiCode });
      await refresh();
    } catch {
      /* تجاهل: لا نُعطّل تبديل اللغة بسبب فشل المزامنة */
    }
  }

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
            <h5 className="modal-title">{t("Languages")}</h5>
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
                  onClick={() => choose(l.code)}
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
