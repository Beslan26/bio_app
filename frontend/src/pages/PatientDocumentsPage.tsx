import React, { useEffect, useState } from 'react';
import { listPatientDocuments, addPatientDocument, PatientDocumentResponse, PatientDocumentCreateRequest } from '../api/patient';
import { uploadMedicalFile } from '../api/infrastructure';

export const PatientDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<PatientDocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояние формы нового документа
  const [formData, setFormData] = useState<PatientDocumentCreateRequest>({
    title: '',
    file_url: '',
    category: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await listPatientDocuments();
      // Сортируем: сначала новые документы
      const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDocuments(sorted);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить медицинский архив');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || null,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormMessage(null);
    try {
      const uploadResult = await uploadMedicalFile(file);
      setFormData((prev) => ({
        ...prev,
        file_url: uploadResult.download_url,
        title: prev.title || file.name.split('.')[0],
      }));
      setFormMessage({ type: 'success', text: `Файл "${file.name}" успешно загружен на сервер!` });
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.response?.data?.detail || 'Не удалось загрузить файл на сервер.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!formData.title.trim() || !formData.file_url.trim()) {
      setFormMessage({ type: 'error', text: 'Название и ссылка на файл обязательны' });
      return;
    }

    setIsSaving(true);
    try {
      await addPatientDocument({
        title: formData.title.trim(),
        file_url: formData.file_url.trim(),
        category: formData.category ? formData.category.trim() : null,
      });

      setFormMessage({ type: 'success', text: 'Документ успешно добавлен в ваш архив!' });
      setFormData({ title: '', file_url: '', category: '' });
      await fetchDocuments(); // Обновляем список файлов на экране
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.response?.data?.detail || 'Не удалось сохранить документ' });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Медицинский архив (PHR)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ваше личное защищенное хранилище медицинских документов, результатов анализов и заключений.
        </p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЛЕВАЯ КОЛОНКА: ФОРМА ДОБАВЛЕНИЯ ДОКУМЕНТА */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Загрузить документ</h2>

          {formMessage && (
            <div className={`p-4 mb-4 rounded-xl text-sm font-medium border ${
              formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Название документа *</label>
              <input
                type="text" name="title" required placeholder="Например: Общий анализ крови"
                value={formData.title} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-medical-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Категория документа</label>
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-medical-500"
              >
                <option value="">Без категории</option>
                <option value="Анализы">Лабораторные анализы</option>
                <option value="Снимки">Снимки / МРТ / КТ</option>
                <option value="Выписки">Выписки и эпикризы</option>
                <option value="Рецепты">Рецепты и назначения</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Медицинский файл *</label>

              {formData.file_url ? (
                // Если файл уже успешно залит, показываем зеленую плашку с возможностью перевыбрать
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-emerald-600">✓</span>
                    <p className="text-slate-700 font-medium truncate">Файл готов к отправке в архив</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, file_url: '' }))}
                    className="text-rose-600 hover:text-rose-800 font-bold ml-2 shrink-0"
                  >
                    Удалить
                  </button>
                </div>
              ) : (
                // Если файл еще не выбран, показываем красивую область для клика
                <label className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  isUploading ? 'border-teal-300 bg-teal-50/10 cursor-not-allowed' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-500'
                }`}>
                  <input
                    type="file"
                    disabled={isUploading}
                    onChange={handleFileChange}
                    className="hidden"
                    required={!formData.file_url}
                  />
                  {isUploading ? (
                    <div className="space-y-1">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mx-auto" />
                      <p className="text-[11px] text-teal-700 font-medium">Шифрование и загрузка в PHR...</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-lg">📎</span>
                      <p className="text-xs font-semibold text-slate-700">Выбрать документ с устройства</p>
                      <p className="text-[10px] text-slate-400">PDF, JPG, PNG, DICOM (допустимого размера)</p>
                    </div>
                  )}
                </label>
              )}
              {/* Невидимый инпут для валидации HTML5 формы */}
              <input type="hidden" name="file_url" value={formData.file_url} required />
            </div>


            <button
              type="submit" disabled={isSaving}
              className="w-full py-2 text-xs font-semibold text-white bg-medical-600 hover:bg-medical-700 disabled:opacity-50 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isSaving && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Добавить в архив
            </button>
          </form>
        </div>

        {/* ПРАВАЯ КОЛОНКА: СПИСОК ДОКУМЕНТОВ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Сохраненные файлы</h2>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Синхронизация с архивом...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-sans">В вашем медицинском архиве пока нет документов.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3 hover:border-medical-200 transition-colors">
                  {/* Иконка файла */}
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-medical-600 shrink-0">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{doc.title}</h4>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {doc.category && (
                        <span className="text-[10px] bg-medical-50 text-medical-700 px-2 py-0.5 rounded-md font-medium border border-medical-100">
                          {doc.category}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(doc.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    <div className="pt-2">
                      <a
                        href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-medical-600 hover:text-medical-800 hover:underline"
                      >
                        Открыть документ ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
