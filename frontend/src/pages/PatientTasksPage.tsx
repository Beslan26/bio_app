import React, { useEffect, useState } from 'react';
import { listActivePatientTasks, createTaskEntry, updateTaskEntry, PatientTaskItem, TaskEntryResponse, listTodayPatientEntries} from '../api/patient';

export const PatientTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<PatientTaskItem[]>([]);
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
      // 1. Запускаем параллельно оба запроса
      const [activeTasks, todayEntries] = await Promise.all([
        listActivePatientTasks(),
        listTodayPatientEntries() 
      ]);

      // 2. Раскладываем замеры по задачам
      const tasksWithEntries = activeTasks.map((task) => ({
        ...task,
        entries: Array.isArray(todayEntries) 
          ? todayEntries.filter((entry) => entry.task_id === task.id)
          : []
      }));

      // 3. Сохраняем в стейт списка задач
      setTasks(tasksWithEntries);

      // 4. ИСПРАВЛЕНИЕ: Строго выбираем ОДИН объект задачи, а не массив!
      if (tasksWithEntries.length > 0) {
        let currentSelection = null;
        
        if (selectedTask) {
          currentSelection = tasksWithEntries.find(t => t.id === selectedTask.id);
        }
        
        // Если ничего не было выбрано или не нашлось, берем ПЕРВУЮ задачу [0]
        setSelectedDoctorTask(currentSelection || tasksWithEntries[0]);
      } else {
        setSelectedDoctorTask(null);
      }

    } catch (err: any) {
      console.error("Ошибка загрузки дневника:", err);
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

      // 1. Обновляем массив замеров внутри выбранной задачи для правой колонки
      const updatedEntries = [newEntry, ...(selectedTask.entries || [])];
      const updatedTask = { ...selectedTask, entries: updatedEntries };
      setSelectedDoctorTask(updatedTask);

      // 2. Синхронизируем изменения с общим списком задач
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === selectedTask.id ? updatedTask : t))
      );

      setInputValue('');
      setInputComment('');
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
    if (!selectedTask || !editingEntry || !editValue.trim() || isUpdating) return;

    setIsUpdating(true);
    setModalError(null);
    try {
      const updated = await updateTaskEntry(editingEntry.id, {
        value: editValue.trim(),
        patient_comment: editComment.trim() || null
      });

      // 1. Обновляем измененную запись внутри выбранной задачи
      const updatedEntries = selectedTask.entries.map((item) =>
        item.id === updated.id ? updated : item
      );
      const updatedTask = { ...selectedTask, entries: updatedEntries };
      setSelectedDoctorTask(updatedTask);

      // 2. Синхронизируем изменения с общим списком задач
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === selectedTask.id ? updatedTask : t))
      );

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

      {/* ДВУХКОЛОНОЧНЫЙ СПЛИТ-ИНТЕРФЕЙС */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА (1/3 ширины): СПИСОК ПЛАНОВ НАБЛЮДЕНИЯ */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 px-1">Задачи на сегодня</h2>

          {isLoading ? (
            <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-xl border">Загрузка задач трекера...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-xl border shadow-sm font-sans">
              На сегодня активных задач наблюдения нет.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {tasks.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedDoctorTask(task)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-medical-500 bg-medical-50/40 ring-2 ring-medical-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed truncate">{task.description}</p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-2">
                      📅 до {new Date(task.end_date).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА (2/3 ширины): ДЕТАЛИЗАЦИЯ И РЕЗУЛЬТАТЫ */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedTask ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm font-medium">
              Выберите задачу слева для внесения показателей и просмотра истории
            </div>
          ) : (
            <>
              {/* ФОРМА ВВОДА ПОКАЗАТЕЛЕЙ */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-base font-bold text-slate-900">Внести показатели</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Текущий трекер: <span className="text-medical-600 font-bold">{selectedTask.title}</span></p>
                  <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">{selectedTask.description}</p>
                </div>

                <form onSubmit={handleNewEntrySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Значение *</label>
                      <input
                        type="text" required placeholder="Например: 120/80"
                        value={entryValue} onChange={(e) => setInputValue(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white outline-none focus:border-medical-500 h-10"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Ваш комментарий (Опционально)</label>
                      <input
                        type="text" name="patient_comment" placeholder="Чувствую себя хорошо / Была легкая слабость..."
                        value={entryComment} onChange={(e) => setInputComment(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white outline-none focus:border-medical-500 h-10"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit" disabled={isSaving}
                      className="py-2 px-6 text-xs font-semibold text-white bg-medical-600 hover:bg-medical-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 h-10 shadow-sm"
                    >
                      {isSaving ? 'Отправка...' : 'Отправить запись в дневник'}
                    </button>
                  </div>
                </form>
              </div>
              {/* ЛЕНТА ИЗМЕРЕНИЙ ПО ВЫБРАННОЙ ЗАДАЧЕ ЗА СЕГОДНЯ */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">Внесено сегодня</h2>
                  <span className="text-xs bg-slate-100 font-bold text-slate-500 px-2.5 py-0.5 rounded-full">
                    {selectedTask.entries?.length || 0} зап.
                  </span>
                </div>

                {!selectedTask.entries || selectedTask.entries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-10 bg-slate-50/50 rounded-xl border border-dashed">
                    По этой задаче сегодня записей ещё не было. Внесите показатели выше.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {selectedTask.entries.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-baseline gap-3">
                            <span className="text-base font-bold text-medical-700 font-sans tracking-wide">{item.value}</span>
                            <span className="text-[10px] text-slate-400 font-mono bg-white border px-1.5 py-0.5 rounded">
                              ⏰ {new Date(item.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {item.patient_comment && (
                            <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-100 p-2 rounded-lg italic shadow-2xf">
                              "{item.patient_comment}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4 text-[11px] shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                          <span className="text-slate-400 italic">
                            {item.last_edited_at ? 'Редактировано' : 'Правка: 24ч'}
                          </span>
                          <button
                            type="button" 
                            onClick={() => handleOpenEditModal(item)}
                            className="font-bold py-1 px-3 rounded-md bg-white border border-slate-200 text-medical-600 hover:bg-medical-50 hover:text-medical-800 transition-colors shadow-sm"
                          >
                            Изменить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div> {/* Конец правой колонки */}
      </div> {/* Конец сплит-сетки */}

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
