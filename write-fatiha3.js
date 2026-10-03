const fs = require('fs');

const part3 = `      <div className="card shadow-sm border-0 rounded-4 mt-4">
        <div className="card-body p-4">
          <h5 className="mb-3">{ar ? "طلب فاتحة جديد" : "New Fatiha Request"}</h5>
          <form onSubmit={submitRequest}>
            <div className="mb-3">
              <label className="form-label fw-semibold">{ar ? "نص الطلب" : "Request Letter"} *</label>
              <textarea className="form-control" rows={4} required value={requestLetter} onChange={(e) => setLetter(e.target.value)} placeholder={ar ? "اكتب نص طلب الفاتحة هنا..." : "Write your Fatiha request text here..."} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">{ar ? "القراءة (القرآن)" : "Qirat (Quran Recitation)"} *</label>
              <select className="form-control" value={selectedQeratId} onChange={(e) => onQeratSelected(Number(e.target.value))} required>
                <option value={0} disabled>{ar ? "اختر قراءة..." : "Select a Qirat..."}</option>
                {qerats.map((q) => (<option key={q.id} value={q.id}>{q.qeratName}</option>))}
              </select>
            </div>
            {selectedQeratAudioUrl && (
              <div className="mb-3 p-2 bg-light rounded border">
                <label className="form-label small fw-semibold">{ar ? "تصفح القراءة المختارة" : "Selected Qirat Preview"}</label>
                <audio controls src={selectedQeratAudioUrl} className="w-100" />
              </div>
            )}
            <AudioRecorder onResult={handleAudioResult} onClear={handleClearAudio} required />
            {audioResult && (
              <div className="mt-2">
                <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={handleClearAudio}>{ar ? "إزالة التسجيل" : "Remove recording"}</button>
              </div>
            )}
            <div className="d-flex justify-content-between align-items-center mt-4 gap-2">
              <div />
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setLetter(""); setSelectedQeratId(0); setSelectedQeratAudioUrl(null); setAudioResult(null); setError(""); setSuccess(""); }}>{ar ? "إلغاء" : "Cancel"}</button>
                <button type="submit" className="btn btn-primary px-4" disabled={busy}>
                  {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-paper-plane me-1" />}
                  {ar ? "تقديم الطلب" : "Submit Request"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {success && <div className="alert alert-success mt-3 rounded-4" style={{ maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}><i className="fas fa-check-circle me-2" /> {success}</div>}
      {error && <div className="alert alert-danger mt-3 rounded-4" style={{ maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}><i className="fas fa-exclamation-circle me-2" /> {error}</div>}
    </div>
  );
}
`;

const existing = fs.readFileSync('F:\\Fatiha-web\\src\\app\\fatiha-requests\\page.tsx', 'utf8');
fs.writeFileSync('F:\\Fatiha-web\\src\\app\\fatiha-requests\\page.tsx', existing + part3);
console.log('part3 written');
