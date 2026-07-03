import React, { useEffect, useState } from 'react';
import { listActivePatientTasks, createTaskEntry, updateTaskEntry, PatientTaskItem, TaskEntryResponse } from '../api/patient';

export const PatientTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<PatientTaskItem[]>([]);
  const [entries, setEntries] = useState<TaskEntryResponse[]>([]); // Локальный стейт лога отправленных записей
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояния для отправки показателей по выбранной задаче
  const [selectedTask, setSelectedDoctorTask] = useState<PatientTaskItem | null>(null);
  const [entryValue, setInputValue] = useState('');
  const [entryComment, setInputComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Состояния для модального окна редактирования записи (до 24 часов)
  const [editingEntry, setEditingEntry] = useState<TaskEntryResponse | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editComment, setEditComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const initTrackerData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeTasks = await listActivePatientTasks();
      setTasks(activeTasks);
      if (activeTasks.length > 0 && !selectedTask) {
        setSelectedDoctorTask(activeTasks[0]); // По умолчанию выбираем первую задачу
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить дневник здоровья');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initTrackerData();
  }, []);

  const handleNewEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !entryValue.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const newEntry = await createTaskEntry({
        task_id: selectedTask.id,
        value: entryValue.trim(),
        patient_comment: entryComment.trim() || null
      });

      // Добавляем запись в локальный лог на экране
      setEntries((prev) => [newEntry, ...prev]);
      setInputValue('');
      setInputComment('');
      alert('Показатели успешно зафиксированы!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка сохранения показателей');
    } finally {
      setIsSaving(false);
    }
  };


  const handleOpenEditModal = (entry: TaskEntryResponse) => {
    setEditingEntry(entry);
    setEditValue(entry.value);
    setEditComment(entry.patient_comment || '');
    setModalError(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !editValue.trim() || isUpdating) return;

    setIsUpdating(true);
    setModalError(null);
    try {
      const updated = await updateTaskEntry(editingEntry.id, {
        value: editValue.trim(),
        patient_comment: editComment.trim() || null
      });

      // Обновляем запись в логе на экране
      setEntries((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      setEditingEntry(null);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Не удалось отредактировать запись. Возможно, истекло окно 24 часов.');
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Дневник наблюдения</h1>
        <p className="mt-1 text-sm text-slate-500">
          Выполняйте предписания лечащего врача и фиксируйте ежедневные показатели здоровья.
        </p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЛЕВАЯ КОЛОНКА: ЗАДАЧИ ОТ ВРАЧА И ВВОД ДАННЫХ */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 px-1">Задачи на сегодня</h2>

          {isLoading ? (
            <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-xl border">Загрузка задач трекера...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-xl border shadow-sm font-sans">
              На сегодня активных задач наблюдения нет.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Сетка задач */}
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {tasks.map((task) => {
                  const isSelected = selectedTask?.id === task.id;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedDoctorTask(task)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-medical-500 bg-medical-50/30 ring-2 ring-medical-50/50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-2">
                        Срок: до {new Date(task.end_date).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Форма ввода для выбранной задачи */}
              {selectedTask && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Внести показатели</h3>
                  <p className="text-xs text-slate-400 mb-4 truncate">Задача: {selectedTask.title}</p>

                  <form onSubmit={handleNewEntrySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Значение / Показатель *</label>
                      <input
                        type="text" required placeholder="Например: 120/80 или Принял"
                        value={entryValue} onChange={(e) => setInputValue(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-medical-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Ваш комментарий (Опционально)</label>
                      <textarea
                        name="patient_comment" rows={3} placeholder="Чувствую себя хорошо / Была легкая слабость..."
                        value={entryComment} onChange={(e) => setInputComment(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-medical-500"
                      />
                    </div>

                    <button
                      type="submit" disabled={isSaving}
                      className="w-full py-2 text-xs font-semibold text-white bg-medical-600 hover:bg-medical-700 disabled:opacity-50 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      Отправить запись
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: ЛОГ СЕГОДНЯШНИХ ЗАПИСЕЙ С РЕДАКТИРОВАНИЕМ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Внесено сегодня</h2>

          {entries.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-8">Вы еще не отправляли показатели сегодня.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {entries.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-sm font-bold text-medical-700 break-all">{item.value}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {item.patient_comment && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-100/60 p-2 rounded-lg italic">
                      "{item.patient_comment}"
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-[10px]">
                    <span className="text-slate-400 italic">
                      {item.last_edited_at ? 'Изменено' : 'Окно правки: 24ч'}
                    </span>
                    <button
                      type="button" onClick={() => handleOpenEditModal(item)}
                      className="font-bold text-medical-600 hover:text-medical-800 hover:underline"
                    >
                      Изменить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО КОРРЕКТИРОВКИ ЗАПИСИ (24 ЧАСА) */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Редактирование показателей</h3>
            <p className="text-xs text-slate-400 mb-4">Внесено в: {new Date(editingEntry.timestamp).toLocaleTimeString('ru-RU')}</p>

            {modalError && <div className="mb-4 p-3 rounded-lg bg-rose-50 text-xs text-rose-800">{modalError}</div>}

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Новое значение *</label>
                <input
                  type="text" required value={editValue} onChange={(e) => setEditValue(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Корректировка комментария</label>
                <textarea
                  rows={3} value={editComment} onChange={(e) => setEditComment(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button" onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit" disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-medical-600 hover:bg-medical-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isUpdating ? 'Обновление...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
