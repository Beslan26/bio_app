import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { listMessages, sendMessage, MessageResponse } from '../api/doctor';

export const DoctorChatPage: React.FC = () => {
  const location = useLocation();

  // Если пришли со страницы списка пациентов, подхватываем patient_id
  const initialPatientId = location.state?.patient_id || '';

  const [activePatientId, setActivePatientId] = useState<string>(String(initialPatientId));
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Стейт ввода текста
  const [inputContent, setInputContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Реф для автопрокрутки чата вниз при новых сообщениях
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Загрузка сообщений при выборе пациента
  const loadChatHistory = async (patientId: number) => {
    setChatLoading(true);
    setChatError(null);
    try {
      const data = await listMessages(patientId);
      setMessages(data);
      if (data.length > 0) {
        setCurrentChatId(data[0].thread_id);
      }
    } catch (err: any) {
      setChatError(err.response?.data?.detail || 'Не удалось загрузить историю чата');
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activePatientId && Number(activePatientId) > 0) {
      loadChatHistory(Number(activePatientId));
    }
  }, [activePatientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Хэндлер отправки сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activePatientId || isSending) return;

    setIsSending(true);
    try {
      const newMsg = await sendMessage({
        patient_id: Number(activePatientId),
        content: inputContent.trim(),
      });

      // Добавляем новое сообщение в ленту
      setMessages((prev) => [...prev, newMsg]);
      setInputContent('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Не удалось отправить сообщение');
    } finally {
      setIsSending(false);
    }
  };
  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-950">Защищенные телемедицинские чаты</h1>
        <p className="mt-1 text-sm text-slate-500">Прямая конфиденциальная связь врач-пациент с логированием в медкарту.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 items-stretch">

        {/* ЛЕВАЯ ПАНЕЛЬ: ВЫБОР ПАЦИЕНТА */}
        <div className="md:col-span-1 border-r border-slate-200 bg-slate-50/50 p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">ID Пациента</label>
            <input
              type="number"
              placeholder="Введите ID (например: 1)"
              value={activePatientId}
              onChange={(e) => {
                setActivePatientId(e.target.value);
                if(!e.target.value) setMessages([]);
              }}
              className="w-full text-sm rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-teal-500"
            />
          </div>

          {activePatientId && Number(activePatientId) > 0 && currentChatId && (
            <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl text-xs text-teal-800">
              <p className="font-semibold">Активная сессия</p>
              <p className="mt-1 text-slate-500 font-mono">Тред чата: #{currentChatId}</p>
            </div>
          )}
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ: ОКНО ЧАТА */}
        <div className="md:col-span-3 flex flex-col h-[550px] lg:h-auto justify-between bg-slate-50/20">

          {/* 1. Лента сообщений */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {!activePatientId || Number(activePatientId) <= 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">
                Укажите ID пациента слева для открытия диалога
              </div>
            ) : chatLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                Синхронизация сообщений...
              </div>
            ) : chatError ? (
              <div className="text-center text-xs text-rose-600 p-4">{chatError}</div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">
                История сообщений пуста. Начните диалог первым.
              </div>
            ) : (
              messages.map((msg) => {
                const isDoctor = msg.role === 'doctor';
                return (
                  <div key={msg.id} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isDoctor
                        ? 'bg-teal-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}>
                      <p className="leading-relaxed break-words">{msg.content}</p>
                      <div className={`text-[9px] mt-1 text-right font-medium ${isDoctor ? 'text-teal-200' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        {!isDoctor && msg.is_read && <span className="ml-1">✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 2. Поле ввода сообщения внизу */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
            <input
              type="text"
              placeholder={!activePatientId || Number(activePatientId) <= 0 ? "Сначала выберите пациента..." : "Напишите клинический ответ или рекомендацию..."}
              disabled={!activePatientId || Number(activePatientId) <= 0 || isSending}
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              className="flex-1 text-sm rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-teal-500 bg-slate-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!inputContent.trim() || isSending}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
            >
              {isSending ? '...' : 'Отправить'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
