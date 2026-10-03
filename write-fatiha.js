const fs = require('fs');

const part1 = `"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { AudioRecorder, AudioRecordResult } from "@/components/AudioRecorder";

interface FatihaRequest {
  id: number;
  requestLetter: string;
  audioRecord: string;
  status: number;
  isApproved: boolean;
  dateOfRecord: number;
  alQeratId?: number | null;
  alQeratName?: string | null;
}

interface Qerat {
  id: number;
  qeratName: string;
  audioFile?: string | null;
}

const STATUS_TEXT = { 0: "Open", 1: "Processing", 2: "Closed", 3: "Qualified" };
const STATUS_ICON = { 0: "fas fa-folder-open text-primary", 1: "fas fa-spinner text-warning", 2: "fas fa-lock text-secondary", 3: "fas fa-award text-success" };

export default function FatihaRequestsPage() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";

  const [items, setItems] = useState([]);
  const [qerats, setQerats] = useState([]);
  const [requestLetter, setLetter] = useState("");
  const [selectedQeratId, setSelectedQeratId] = useState(0);
  const [selectedQeratAudioUrl, setSelectedQeratAudioUrl] = useState(null);
  const [audioResult, setAudioResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});
  const fileInputRef = useRef(null);

  const load = useCallback(() => {
    api.get("/api/fatiha-requests").then((r) => setItems(r.data ?? [])).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!loading && !user) return;
    load();
    api.get("/api/al-qerat", false).then((r) => setQerats(r.data ?? [])).catch(() => setQerats([]));
  }, [user, loading, load]);

  function audioSrc(key) {
    if (!key) return null;
    if (/^https?:\\/\\//i.test(key)) return key;
    return API_URL + "/files/" + key.replace(/^\\/+/, "");
  }

  function onQeratSelected(id) {
    setSelectedQeratId(id);
    const q = qerats.find((x) => x.id === id);
    setSelectedQeratAudioUrl(audioSrc(q?.audioFile) ?? null);
  }

  function handleAudioResult(r) { setAudioResult(r); }
  function handleClearAudio() { setAudioResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }
`;

fs.writeFileSync('F:\\Fatiha-web\\src\\app\\fatiha-requests\\page.tsx', part1);
console.log('part1 written');
