import React, { useEffect, useState } from 'react';
import { listPatientConsents, signConsent, ConsentResponse } from '../api/patient';

// Имитируем текущие актуальные версии документов на платформе для подписания
const AVAILABLE_DOCUMENTS = [
  { type: 'privacy_policy', title: 'Согласие на обработку персональных данных', version: '2.1.0', text: 'Настоящим Я, как пользователь сервиса, даю свое добровольное согласие на автоматизированную и неавтоматизированную обработку моих персональных и медицинских данных в целях получения клинических рекомендаций...' },
  { type: 'telemedicine_agreement', title: 'Договор на оказание телемедицинских услуг', version: '1.0.4', text: 'Данное соглашение регулирует правила проведения онлайн-консультаций, сбора анамнеза ИИ-помощником и порядок взаимодействия с верифицированным медицинским персоналом платформы...' }
];

export const PatientConsentsPage: React.FC = () => {
  const [history, setHistory] = useState<ConsentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Стейты для процесса подписания
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [isSigning, setIsSigning] = useState<Record<string, boolean>>({});

  const fetchConsentsHistory = async () => {
    setIsLoading(true);
    try {
      const data = await listPatientConsents();
      // Сортируем историю от самых свежих к старым
      const sorted = data.sort((a, b) => new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime());
      setHistory(sorted);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить историю согласий');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsentsHistory();
  }, []);

  const handleCheckboxChange = (type: string) => {
    setCheckedDocs((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSignClick = async (type: string, version: string) => {
    setIsSigning((prev) => ({ ...prev, [type]: true }));
    try {
      // Имитируем получение IP-адреса (в реальной системе это делает бэкенд или сторонний сервис)
      const mockIp = '192.168.1.105';

      await signConsent({
        consent_type: type,
        version: version,
        ip_address: mockIp
      });

      // Перезагружаем историю согласий с бэкенда
      await fetchConsentsHistory();
      // Сбрасываем чекбокс для этого документа
      setCheckedDocs((prev) => ({ ...prev, [type]: false }));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка при подписании документа');
    } finally {
      setIsSigning((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Проверка, подписана ли уже ТЕКУЩАЯ версия документа в истории
  const isAlreadySigned = (type: string, version: string) => {
    return history.some((item) => item.consent_type === type && item.version === version);
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Правовая информация</h1>
        <p className="mt-1 text-sm text-slate-500">Управление юридическими согласиями, цифровые подписи документов и compliance-логи.</p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ЛЕВАЯ КОЛОНКА: АКТУАЛЬНЫЕ ДОКУМЕНТЫ ДЛЯ ПОДПИСАНИЯ */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 px-1">Документы платформы</h2>

          {AVAILABLE_DOCUMENTS.map((doc) => {
            const signed = isAlreadySigned(doc.type, doc.version);
            return (
              <div key={doc.type} className={`bg-white border rounded-xl p-5 shadow-sm space-y-4 transition-colors ${
                signed ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{doc.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                      Версия: {doc.version}
                    </span>
                    {signed && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        Подписано
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 max-h-24 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-sans">
                  {doc.text}
                </div>

                {!signed && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checkedDocs[doc.type] || false}
                        onChange={() => handleCheckboxChange(doc.type)}
                        className="mt-0.5 accent-medical-600 rounded"
                      />
                      <span>Я полностью прочитал документ и принимаю все условия соглашения.</span>
                    </label>

                    <button
                      type="button"
                      disabled={!checkedDocs[doc.type] || isSigning[doc.type]}
                      onClick={() => handleSignClick(doc.type, doc.version)}
                      className="text-xs font-semibold bg-medical-600 hover:bg-medical-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl shadow-sm transition whitespace-nowrap self-end sm:self-center"
                    >
                      {isSigning[doc.type] ? 'Подписание...' : 'Подписать'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ПРАВАЯ КОЛОНКА: ИСТОРИЯ ПОДПИСЕЙ (АРХИВ) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Цифровой архив подписей</h2>

          {isLoading ? (
            <div className="text-center py-10 text-slate-400 text-xs">Загрузка логов...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs italic">Вы еще не подписали ни одного документа.</div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {history.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 font-mono text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between font-sans text-slate-900 font-bold text-xs">
                    <span className="truncate max-w-[70%]">
                      {item.consent_type === 'privacy_policy' ? 'Перс. данные' : 'Телемед. соглашение'}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded shrink-0">
                      v{item.version}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 text-[10px] text-slate-400">
                    <span>Дата подписи:</span>
                    <span className="font-sans text-slate-600">{new Date(item.signed_at).toLocaleString('ru-RU')}</span>
                  </div>
                  {item.ip_address && (
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Аудит IP:</span>
                      <span className="text-slate-500">{item.ip_address}</span>
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
