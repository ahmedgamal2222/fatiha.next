const fs = require('fs');

const part2 = `  async function submitRequest(e) {
    e.preventDefault();
    if (!requestLetter.trim()) { setError(ar ? "يرجى كتابة نص الطلب" : "Please enter a request letter"); return; }
    if (!selectedQeratId) { setError(ar ? "يرجى اختيار قراءة" : "Please select a Qerat"); return; }
    if (!audioResult) { setError(ar ? "يرجى تقديم تسجيل صوتي" : "Please provide an audio recording"); return; }
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData();
    form.append("requestLetter", requestLetter.trim());
    form.append("alQeratId", String(selectedQeratId));
    form.append("audioRecord", audioResult.blob, audioResult.name);
    try {
      const res = await api.post("/api/fatiha-requests", form);
      if (res.success) {
        setSuccess(ar ? "تمّ تقديم طلب الفاتحة بنجاح!" : "Fatiha request submitted successfully!");
        setLetter(""); setSelectedQeratId(0); setSelectedQeratAudioUrl(null); setAudioResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        load();
      } else { setError(res.message || (ar ? "فشل التقديم" : "Submission failed")); }
    } catch (err) { setError(err.message || (ar ? "خطأ في الاتصال" : "Connection error")); }
    finally { setBusy(false); }
  }

  async function loadDetails(id) {
    if (details[id]) return;
    try {
      const res = await api.get("/api/fatiha-requests/" + id);
      if (res.success && res.data) setDetails((prev) => ({ ...prev, [id]: { comments: res.data.comments ?? [] } }));
    } catch { /* ignore */ }
  }

  async function toggleExpand(id) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id); await loadDetails(id);
  }

  async function deleteRequest(id) {
    if (!confirm(ar ? "حذف هذا الطلب؟" : "Delete this request?")) return;
    try { await api.del("/api-fatiha-requests/" + id); setItems((prev) => prev.filter((r) => r.id !== id)); setSuccess(ar ? "تم الحذف" : "Deleted"); }
    catch (err) { setError(err.message || (ar ? "فشل الحذف" : "Delete failed")); }
  }

  return (
    <div className="container py-4 min-vh-100 bg-light" style={{ marginTop: 80, marginBottom: 40 }}>
      <h2 className="shadow p-3 mb-4 rounded text-center" style={{ backgroundColor: "#263a5d", color: "white", fontFamily: '"18 Khebrat Musamim Regular", sans-serif', fontSize: "1.6rem", lineHeight: "1.25em" }}>
        {ar ? "طلبات الفاتحة" : "Fatiha Requests"}
      </h2>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <input type="text" className="form-control" placeholder={ar ? "بحث..." : "Search..."} value={requestLetter} onChange={(e) => setLetter(e.target.value)} style={{ maxWidth: 320 }} />
        <Link href="/fatiha-hero" className="btn btn-outline-secondary"><i className="fas fa-home me-1" /> {ar ? "الرئيسية" : "Home"}</Link>
      </div>
      <div className="mb-4">
        <h5 className="mb-3">{ar ? "طلباتي" : "My Requests"}</h5>
        {items.length === 0 ? (
          <p className="text-muted fst-italic">{ar ? "لا توجد طلبات حتى الآن" : "No requests yet"}</p>
        ) : (
          <div className="list-group">
            {items.map((r) => (
              <div key={r.id} className="list-group-item list-group-item-action shadow-sm rounded">
                <div className="d-flex justify-content-between align-items-start w-100">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className={STATUS_ICON[r.status] ?? "fas fa-question"} style={{ fontSize: "1.1rem" }} />
                      <span className="fw-bold">{r.requestLetter.slice(0, 80)}{r.requestLetter.length > 80 ? "\\u2026" : ""}</span>
                    </div>
                    <div className="text-muted small mb-1">
                      {(ar ? "القراءة: " : "Qerat: ") + (r.alQeratName ?? "\\u2014")} &middot; {new Date(r.dateOfRecord).toLocaleDateString(ar ? "ar-EG" : "en-US")} &middot; {(ar ? "الحالة: " : "Status: ") + STATUS_TEXT[r.status]}
                      {r.isApproved && <span className="badge bg-success ms-1">{ar ? "معتمد" : "Approved"}</span>}
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-1">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => toggleExpand(r.id)}>{expandedId === r.id ? (ar ? "إخفاء" : "Hide") : (ar ? "تفاصيل" : "Details")}</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRequest(r.id)}><i className="fas fa-trash me-1" /> {ar ? "حذف" : "Delete"}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
`;

const existing = fs.readFileSync('F:\\Fatiha-web\\src\\app\\fatiha-requests\\page.tsx', 'utf8');
fs.writeFileSync('F:\\Fatiha-web\\src\\app\\fatiha-requests\\page.tsx', existing + part2);
console.log('part2 written');
