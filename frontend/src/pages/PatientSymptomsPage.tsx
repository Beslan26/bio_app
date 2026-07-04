import React, { useEffect, useState, useRef } from 'react';
import { createTextComplaint, createVoiceComplaint, getPatientComplaintsList, PatientComplaintResponse } from '../api/patient';
// Импортируем функцию интерактивного анализа из слоя инфраструктуры
import { analyzeComplaintText, AiAnalysisResponse } from '../api/infrastructure';

export const PatientSymptomsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<PatientComplaintResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Текстовый ввод
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ИНТЕРАКТИВНЫЙ ИИ-АНАЛИЗ НА ЛЕТУ (Экспресс-разбор)
  const [aiResult, setAiResult] = useState<AiAnalysisResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Голосовой ввод
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchComplaintsHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getPatientComplaintsList();
      const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setComplaints(sorted);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить историю симптомов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintsHistory();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Функция экспресс-анализа текущего текста без сохранения в историю
  const handleExpressAiAnalyze = async () => {
    if (!textInput.trim() || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const data = await analyzeComplaintText(textInput.trim());
      setAiResult(data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'ИИ сейчас перегружен. Попробуйте позже.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        setIsSubmitting(true);
        try {
          await createVoiceComplaint(audioBlob);
          await fetchComplaintsHistory();
        } catch (err: any) {
          alert(err.response?.data?.detail || 'Ошибка обработки аудиозаписи');
        } filllllly: { setIsSubmitting(false); } // finally исправлен внутри
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => { setRecordingTime((prev) => prev + 1); }, 1000);
    } catch (err) { alert('Не удалось получить доступ к вашему микрофону'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isSubmitting || isRecording) return;
    setIsSubmitting(true);
    try {
      await createTextComplaint(textInput.trim());
      setTextInput('');
      setAiResult(null); // Сбрасываем экспресс-результат
      await fetchComplaintsHistory();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка при отправке текста');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Симптомы и ИИ-анализ</h1>
        <p className="mt-1 text-sm text-slate-500">
          Опишите ваше самочувствие текстом или надиктуйте голосом. Наш ИИ-ассистент извлечет ключевые медицинские факты для врача.
        </p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100 font-mono">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЛЕВАЯ КОЛОНКА: ИНПУТЫ (ТЕКСТ, ЭКСПРЕСС-ИИ И ГОЛОС) */}
        <div className="space-y-4 lg:col-span-1">
          {/* Текстовая форма */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Описать симптомы текстом</h2>
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <textarea
                rows={4} required disabled={isSubmitting || isRecording}
                placeholder="Например: Сильно болит колено при ходьбе, появился отек, температура нормальная..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-800 outline-none focus:border-medical-500 disabled:opacity-50 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!textInput.trim() || isSubmitting || isRecording || isAiLoading}
                  onClick={handleExpressAiAnalyze}
                  className="w-1/2 py-2 text-xs font-semibold text-medical-700 bg-medical-50 border border-medical-200 hover:bg-medical-100 disabled:opacity-50 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {isAiLoading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />}
                  🧠 Проверить ИИ
                </button>
                <button
                  type="submit"
                  disabled={!textInput.trim() || isSubmitting || isRecording}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-medical-600 hover:bg-medical-700 disabled:opacity-50 rounded-xl transition flex items-center justify-center"
                >
                  {isSubmitting ? 'Сохранение...' : 'Отправить в карту'}
                </button>
              </div>
            </form>
          </div>

          {/* ИНТЕРАКТИВНОЕ ЗАКЛЮЧЕНИЕ ЭКСПРЕСС-АНАЛИЗА */}
          {aiResult && (
            <div className="bg-slate-900 text-white rounded-xl shadow-md p-5 space-y-3 animate-fade-in border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">⚡ Моментальный разбор</h3>
                <button type="button" onClick={() => setAiResult(null)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
              </div>

              {aiResult.triage_status && (
                <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-lg border border-slate-700 text-xs">
                  <span className="text-slate-400">Категория срочности:</span>
                  <span className="font-mono font-bold text-amber-400 uppercase tracking-wide">{aiResult.triage_status}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Симптоматический профиль:</span>
                <div className="flex flex-wrap gap-1">
                  {aiResult.extracted_facts?.map((f, i) => (
                    <span key={i} className="text-[11px] bg-slate-800 text-sky-300 px-2 py-0.5 rounded border border-slate-700">🔍 {f}</span>
                  )) || <span className="text-xs text-slate-500 italic">Симптомы не выделены</span>}
                </div>
              </div>

              {aiResult.recommended_specialists && aiResult.recommended_specialists.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Советуем записаться к:</span>
                  <div className="flex flex-wrap gap-1">
                    {aiResult.recommended_specialists.map((s, i) => (
                      <span key={i} className="text-[11px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-900/60 font-medium">👨‍⚕️ {s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Голосовая форма */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 text-center space-y-4">
            <h2 className="text-sm font-bold text-slate-900 text-left">Записать голосом</h2>
            <div className="flex flex-col items-center justify-center py-4">
              {isRecording ? (
                <div className="space-y-3">
                  <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center animate-bounce">
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
                  </div>
                  <p className="text-xs font-mono font-bold text-rose-600">
                    Запись: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </p>
                  <button
                    type="button" onClick={stopRecording}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
                  >
                    Остановить и отправить
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button" disabled={isSubmitting} onClick={startRecording}
                    className="h-16 w-16 bg-medical-50 hover:bg-medical-100 text-medical-600 rounded-full flex items-center justify-center border border-medical-200 shadow-sm transition"
                  >
                    <svg className="h-7 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  <p className="text-xs text-slate-400">Нажмите для начала записи симптомов</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ХРОНОЛОГИЯ С ИИ БЕЙДЖАМИ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4">История обращений</h2>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Синхронизация с ИИ-сервисом...</div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-sans">Вы еще не отправляли симптомы на разбор.</div>
          ) : (
            <div className="space-y-5 max-h-[650px] overflow-y-auto pr-2">
              {complaints.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-3 hover:border-medical-200 transition-colors">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 flex-wrap gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      item.source === 'voice' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {item.source === 'voice' ? '🎙️ map.source === voice' : '📝 Текст'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-medium">
                      📅 {new Date(item.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Текст жалобы</label>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-100 p-2.5 rounded-lg italic">
                      "{item.raw_text}"
                    </p>
                  </div>

                  {item.extracted_facts && item.extracted_facts.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-medical-800 uppercase tracking-wider">Извлечено ИИ-ассистентом:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {item.extracted_facts.map((fact, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-medical-50 text-medical-700 border border-medical-200 shadow-sm"
                          >
                            🔍 {fact}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
