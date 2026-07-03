import React, { useEffect, useState, useRef } from 'react';
import { submitTextComplaint, submitVoiceComplaint, listPatientSubmissions, SubmissionResponse } from '../api/patient';

export const PatientSymptomsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Стейты для отправки текстовой жалобы
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Стейты для записи голоса
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await listPatientSubmissions();
      // Сортируем: новые жалобы сверху
      const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSubmissions(sorted);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить историю симптомов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // НАЧАЛО ЗАПИСИ ГОЛОСА
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
        stream.getTracks().forEach(track => track.stop()); // Выключаем микрофон

        // Автоматически отправляем записанный файл на бэкенд
        setIsSubmitting(true);
        try {
          await submitVoiceComplaint(audioBlob);
          await fetchHistory();
        } catch (err: any) {
          alert(err.response?.data?.detail || 'Ошибка обработки аудио');
        } finally {
          setIsSubmitting(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Не удалось получить доступ к микрофону');
    }
  };

  // ОСТАНОВКА ЗАПИСИ
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // ОТПРАВКА ТЕКСТА
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitTextComplaint(textInput.trim());
      setTextInput('');
      await fetchHistory();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка отправки текста');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Симптомы и ИИ-анализ</h1>
        <p className="mt-1 text-sm text-slate-500">Опишите ваше самочувствие текстом или надиктуйте голосом. Наш ИИ-ассистент подготовит первичный разбор для врача.</p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЛЕВАЯ КОЛОНКА: ИНПУТЫ (ТЕКСТ И ГОЛОС) */}
        <div className="space-y-4 lg:col-span-1">
          {/* Текстовая форма */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Описать симптомы текстом</h2>
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <textarea
                rows={4}
                required
                disabled={isSubmitting || isRecording}
                placeholder="Например: Третий день болит голова в области затылка, температура 37.4, сильная слабость..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 p-3 bg-white text-slate-800 outline-none focus:border-medical-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isSubmitting || isRecording}
                className="w-full py-2 text-xs font-semibold text-white bg-medical-600 hover:bg-medical-700 disabled:opacity-50 rounded-xl transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Анализ ИИ...' : 'Отправить на разбор'}
              </button>
            </form>
          </div>

          {/* Голосовая форма */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 text-center space-y-4">
            <h2 className="text-sm font-bold text-slate-900 text-left">Записать голосовое обращение</h2>

            <div className="flex flex-col items-center justify-center py-4">
              {isRecording ? (
                <div className="space-y-3">
                  {/* Пульсирующий индикатор записи */}
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
                    type="button"
                    disabled={isSubmitting}
                    onClick={startRecording}
                    className="h-16 w-16 bg-medical-50 hover:bg-medical-100 text-medical-600 rounded-full flex items-center justify-center border border-medical-200 shadow-sm transition"
                  >
                    <svg className="h-7 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  <p className="text-xs text-slate-400">Нажмите на микрофон, чтобы надиктовать симптомы голосом</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ЖИВАЯ ХРОНОЛОГИЯ С ИИ РАЗБОРОМ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4">История моих обращений</h2>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Синхронизация с ИИ-сервисом...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-sans">Вы еще не отправляли жалоб на разбор.</div>
          ) : (
            <div className="space-y-5 max-h-[650px] overflow-y-auto pr-2">
              {submissions.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-3 hover:border-medical-200 transition-colors">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 flex-wrap gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      item.input_type === 'audio' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {item.input_type === 'audio' ? '🎙️ Голос' : '📝 Текст'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-medium">
                      📅 {new Date(item.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>

                  {/* Вывод изначального контента (или транскрипции) */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Передано пациентом</label>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-100 p-2.5 rounded-lg italic">
                      "{item.raw_content}"
                    </p>
                  </div>

                  {/* Вывод структурированных ИИ результатов из ai_results_json */}
                  {item.ai_results_json && (
                    <div className="bg-medical-50/40 border border-medical-100 p-3 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-medical-800 text-xs font-bold uppercase tracking-wide">
                        <svg className="h-4 w-4 text-medical-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Предварительный анализ ИИ-ассистента
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 pl-5 list-disc font-sans">
                        {/* Выводим ИИ результаты динамически, предполагая стандартную JSON структуру ключей */}
                        {Object.entries(item.ai_results_json).map(([key, val]) => (
                          <div key={key} className="mt-1">
                            <span className="font-semibold text-slate-800 capitalize">{key.replace(/_/g, ' ')}: </span>
                            <span className="text-slate-600">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                          </div>
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
