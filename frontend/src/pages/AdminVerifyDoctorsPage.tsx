import React, { useEffect, useState } from 'react';
import { listPendingDoctors, verifyDoctor, DoctorItemResponse, DoctorVerificationRequest, createLicenseProof, listLicenseProofs, LicenseProofResponse } from '../api/admin';

export const AdminVerifyDoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояния для модального окна верификации
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItemResponse | null>(null);
  const [actionType, setActionType] = useState<'verified' | 'rejected' | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

    // Состояния для прикрепления документа лицензии
  const [proofDoctorId, setProofDoctorId] = useState<number | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofSuccessMap, setProofSuccessMap] = useState<Record<number, string>>({});

    // Хранилище объектов LicenseProofResponse для отображения актуального статуса документа
  const [proofDataMap, setProofDataMap] = useState<Record<number, LicenseProofResponse>>({});
  const [isReviewingProof, setIsReviewingProof] = useState<Record<number, boolean>>({});



  useEffect(() => {
    async function initPageData() {
      setIsLoading(true);
      setError(null);
      try {
        // Параллельно запрашиваем список врачей и список ВСЕХ документов лицензий
        const [pendingDoctors, proofsList] = await Promise.all([
          listPendingDoctors(),
          listLicenseProofs(),
        ]);

        setDoctors(pendingDoctors);

        // Превращаем массив документов в удобный плоский объект (Map) по doctor_id
        const proofsMap: Record<number, LicenseProofResponse> = {};
        proofsList.forEach((proof) => {
          proofsMap[proof.doctor_id] = proof;
        });

        // Сохраняем в наш существующий стейт, и верстка подхватит документы автоматически!
        setProofDataMap(proofsMap);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Не удалось загрузить данные верификации');
      } finally {
        setIsLoading(false);
      }
    }

    initPageData();
  }, []);


  const openDecisionModal = (doctor: DoctorItemResponse, type: 'verified' | 'rejected') => {
    setSelectedDoctor(doctor);
    setActionType(type);
    setReason('');
    setModalError(null);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !actionType) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      await verifyDoctor(selectedDoctor.id, {
        status: actionType,
        reason: reason.trim() || null,
      });

      // Так как это каталог PENDING врачей, после любого решения (одобрен/отклонен)
      // врач должен исчезнуть из этого списка на экране
      setDoctors((prev) => prev.filter((doc) => doc.id !== selectedDoctor.id));

      // Закрываем модалку
      setSelectedDoctor(null);
      setActionType(null);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Не удалось сохранить решение по верификации');
    } finally {
      setIsSubmitting(false);
    }
  };

    // Функция отправки ссылки на документ лицензии
  const handleProofSubmit = async (e: React.FormEvent, doctorId: number) => {
    e.preventDefault();
    if (!fileUrl.trim()) return;

    setIsUploadingProof(true);
    try {
      const response = await createLicenseProof({
        doctor_id: doctorId,
        file_url: fileUrl.trim(),
      });

      // Сохраняем весь объект ответа бэкенда, чтобы знать proof_id
      setProofDataMap((prev) => ({ ...prev, [doctorId]: response }));
      setProofDoctorId(null);
      setFileUrl('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Не удалось прикрепить документ');
    } finally {
      setIsUploadingProof(false);
    }
  };

    // Функция изменения статуса самого документа (valid / invalid)
  const handleReviewProof = async (doctorId: number, proofId: number, status: 'valid' | 'invalid') => {
    setIsReviewingProof((prev) => ({ ...prev, [doctorId]: true }));
    try {
      const updatedProof = await reviewLicenseProof(proofId, { status });
      // Обновляем данные документа в стейте карточки
      setProofDataMap((prev) => ({ ...prev, [doctorId]: updatedProof }));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Не удалось обновить статус документа');
    } finally {
      setIsReviewingProof((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-950">Верификация врачей</h1>
        <p className="mt-1 text-sm text-slate-500">
          Список медицинских специалистов, ожидающих проверку лицензии и активацию аккаунта.
        </p>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center items-center py-20 gap-2 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />
          <span>Загрузка заявок...</span>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
          <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium text-slate-700">Нет активных заявок</p>
          <p className="text-sm text-slate-400 mt-1">Все зарегистрированные врачи успешно верифицированы.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-medical-300 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                    Ожидает проверки
                  </span>
                  <span className="text-xs font-mono text-slate-400">User ID: {doctor.user_id}</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Специализация</label>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{doctor.specialty}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Номер лицензии</label>
                    <p className="text-sm font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-700 mt-1 break-all">
                      {doctor.license_number}
                    </p>
                  </div>
                  {/* Вывод прикрепленного документа и его проверка */}
                  <div className="mt-3 pt-2 border-t border-dashed border-slate-100">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Подтверждающий документ</label>

                    {proofDataMap[doctor.id] ? (
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={proofDataMap[doctor.id].file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-sky-600 hover:text-sky-800 underline break-all"
                          >
                            Открыть документ ↗
                          </a>

                          {/* Бейдж текущего статуса документа */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            proofDataMap[doctor.id].status === 'valid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {proofDataMap[doctor.id].status === 'valid' ? 'Проверен' : 'Невалиден'}
                          </span>
                        </div>

                        {/* Кнопки быстрого переключения статуса документа для админа */}
                        <div className="flex gap-1.5 pt-1">
                          <button
                            type="button"
                            disabled={isReviewingProof[doctor.id]}
                            onClick={() => handleReviewProof(doctor.id, proofDataMap[doctor.id].id, 'valid')}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${
                              proofDataMap[doctor.id].status === 'valid'
                                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            Маркировать как Валидный
                          </button>
                          <button
                            type="button"
                            disabled={isReviewingProof[doctor.id]}
                            onClick={() => handleReviewProof(doctor.id, proofDataMap[doctor.id].id, 'invalid')}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${
                              proofDataMap[doctor.id].status === 'invalid'
                                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                            }`}
                          >
                            Отклонить док
                          </button>
                        </div>
                      </div>
                    ) : proofDoctorId === doctor.id ? (
                      // Мини-форма для ввода URL файла (остается прежней)
                      <form onSubmit={(e) => handleProofSubmit(e, doctor.id)} className="mt-2 flex gap-2">
                        <input
                          type="url" required placeholder="https://example.com" value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          className="flex-1 text-xs rounded-lg border border-slate-300 px-2 py-1 bg-white text-slate-800 outline-none focus:border-medical-500"
                        />
                        <button type="submit" disabled={isUploadingProof} className="bg-medical-600 hover:bg-medical-700 text-white px-2.5 py-1 rounded-lg text-xs font-medium">
                          {isUploadingProof ? '...' : 'ОК'}
                        </button>
                        <button type="button" onClick={() => { setProofDoctorId(null); setFileUrl(''); }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                          ✕
                        </button>
                      </form>
                    ) : (
                      // Кнопка вызова мини-формы (остается прежней)
                      <button
                        type="button" onClick={() => setProofDoctorId(doctor.id)}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-medical-600 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Прикрепить ссылку на файл
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => openDecisionModal(doctor, 'verified')}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  Подтвердить
                </button>
                <button
                  onClick={() => openDecisionModal(doctor, 'rejected')}
                  className="py-1.5 px-3 text-xs font-semibold rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ПРИНЯТИЯ РЕШЕНИЯ */}
      {selectedDoctor && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {actionType === 'verified' ? 'Подтверждение лицензии' : 'Отклонение заявки'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Врач со специализацией: <span className="font-semibold text-slate-700">{selectedDoctor.specialty}</span>
            </p>

            {modalError && <div className="mb-4 p-3 rounded-lg bg-rose-50 text-xs text-rose-800">{modalError}</div>}

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Причина решения (опционально)</label>
                <textarea
                  rows={3}
                  placeholder={actionType === 'verified' ? "Документы проверены, лицензия действительна" : "Неверный номер лицензии / срок действия истек"}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedDoctor(null); setActionType(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    actionType === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmitting ? 'Сохранение...' : actionType === 'verified' ? 'Утвердить' : 'Отклонить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
