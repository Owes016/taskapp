import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Video,
  Plus,
  Trash2,
  ExternalLink,
  Clock,
  MapPin,
  RefreshCw,
  Send,
  Users,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import {
  CalendarEventItem,
  TaskListItem,
  TaskItem,
  ChatSpaceItem,
  ChatMessageItem,
  MeetSpaceItem,
  fetchCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  fetchTaskLists,
  fetchTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  fetchChatSpaces,
  createChatSpace,
  fetchChatMessages,
  sendChatMessage,
  createMeetSpace
} from '../services/workspaceApi';
import { ConfirmationModal } from './ConfirmationModal';
import { GeoFenceZone, ChatWebhookConfig } from '../types';

interface WorkspaceHubProps {
  accessToken: string | null;
  activeGeofence?: GeoFenceZone;
  geofences?: GeoFenceZone[];
  chatWebhookConfig?: ChatWebhookConfig;
  onOpenChatWebhookModal?: () => void;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  accessToken,
  activeGeofence,
  geofences = [],
  chatWebhookConfig,
  onOpenChatWebhookModal
}) => {
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'TASKS' | 'CHAT' | 'MEET'>('CALENDAR');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary' | 'warning';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {}
  });
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ---------------- CALENDAR STATE ----------------
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventSummary, setNewEventSummary] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventLocation, setNewEventLocation] = useState(activeGeofence?.name || 'Tech Center HQ');
  const [newEventStart, setNewEventStart] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [newEventEnd, setNewEventEnd] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 2);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [newEventAddMeet, setNewEventAddMeet] = useState(true);

  // ---------------- TASKS STATE ----------------
  const [taskLists, setTaskLists] = useState<TaskListItem[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  // ---------------- CHAT STATE ----------------
  const [chatSpaces, setChatSpaces] = useState<ChatSpaceItem[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ChatSpaceItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  // ---------------- MEET STATE ----------------
  const [generatedMeetSpaces, setGeneratedMeetSpaces] = useState<MeetSpaceItem[]>([]);
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Load Initial Data when token is available
  useEffect(() => {
    if (!accessToken) return;
    if (activeTab === 'CALENDAR') {
      loadEvents();
    } else if (activeTab === 'TASKS') {
      loadTaskLists();
    } else if (activeTab === 'CHAT') {
      loadChatSpaces();
    }
  }, [accessToken, activeTab]);

  // When task list changes, load its tasks
  useEffect(() => {
    if (!accessToken || !selectedTaskListId) return;
    loadTasks(selectedTaskListId);
  }, [accessToken, selectedTaskListId]);

  // When selected space changes, load its messages
  useEffect(() => {
    if (!accessToken || !selectedSpace) return;
    loadMessages(selectedSpace.name);
  }, [accessToken, selectedSpace]);

  // ---------------- Calendar Handlers ----------------
  const loadEvents = async () => {
    if (!accessToken) return;
    setIsLoadingEvents(true);
    setErrorMsg(null);
    try {
      const items = await fetchCalendarEvents(accessToken);
      setEvents(items);
    } catch (e: any) {
      showError(e.message || 'Failed to load Google Calendar events.');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newEventSummary.trim()) return;

    try {
      setIsLoadingEvents(true);
      const created = await createCalendarEvent(accessToken, {
        summary: newEventSummary,
        description: newEventDesc,
        location: newEventLocation,
        startTime: new Date(newEventStart).toISOString(),
        endTime: new Date(newEventEnd).toISOString(),
        addMeetLink: newEventAddMeet
      });

      setEvents((prev) => [created, ...prev]);
      setShowAddEventModal(false);
      setNewEventSummary('');
      setNewEventDesc('');
      showSuccess(`Created calendar event "${created.summary}" successfully!`);
    } catch (e: any) {
      showError(e.message || 'Failed to create calendar event.');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const confirmDeleteEvent = (event: CalendarEventItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Google Calendar Event?',
      message: `Are you sure you want to remove "${event.summary}" from your Google Calendar? This cannot be undone.`,
      confirmLabel: 'Delete Event',
      confirmVariant: 'danger',
      onConfirm: async () => {
        if (!accessToken) return;
        setIsConfirmLoading(true);
        try {
          await deleteCalendarEvent(accessToken, event.id);
          setEvents((prev) => prev.filter((ev) => ev.id !== event.id));
          showSuccess(`Event "${event.summary}" deleted from Google Calendar.`);
          setConfirmModal((m) => ({ ...m, isOpen: false }));
        } catch (e: any) {
          showError(e.message || 'Failed to delete event.');
        } finally {
          setIsConfirmLoading(false);
        }
      }
    });
  };

  // ---------------- Tasks Handlers ----------------
  const loadTaskLists = async () => {
    if (!accessToken) return;
    setIsLoadingTasks(true);
    try {
      const lists = await fetchTaskLists(accessToken);
      setTaskLists(lists);
      if (lists.length > 0 && !selectedTaskListId) {
        setSelectedTaskListId(lists[0].id);
      }
    } catch (e: any) {
      showError(e.message || 'Failed to fetch task lists.');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const loadTasks = async (listId: string) => {
    if (!accessToken) return;
    setIsLoadingTasks(true);
    try {
      const t = await fetchTasks(accessToken, listId);
      setTasks(t);
    } catch (e: any) {
      showError(e.message || 'Failed to fetch tasks.');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedTaskListId || !newTaskTitle.trim()) return;

    try {
      setIsLoadingTasks(true);
      const created = await createTask(accessToken, selectedTaskListId, {
        title: newTaskTitle,
        notes: newTaskNotes,
        due: newTaskDue ? new Date(newTaskDue).toISOString() : undefined
      });
      setTasks((prev) => [created, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
      showSuccess(`Task "${created.title}" added to Google Tasks!`);
    } catch (e: any) {
      showError(e.message || 'Failed to create task.');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleToggleTaskStatus = async (task: TaskItem) => {
    if (!accessToken || !selectedTaskListId) return;
    const newStatus = task.status !== 'completed';
    try {
      const updated = await updateTaskStatus(accessToken, selectedTaskListId, task.id, newStatus);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (e: any) {
      showError(e.message || 'Failed to update task status.');
    }
  };

  const confirmDeleteTask = (task: TaskItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Google Task?',
      message: `Are you sure you want to permanently delete task "${task.title}"?`,
      confirmLabel: 'Delete Task',
      confirmVariant: 'danger',
      onConfirm: async () => {
        if (!accessToken || !selectedTaskListId) return;
        setIsConfirmLoading(true);
        try {
          await deleteTask(accessToken, selectedTaskListId, task.id);
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          showSuccess(`Task "${task.title}" removed.`);
          setConfirmModal((m) => ({ ...m, isOpen: false }));
        } catch (e: any) {
          showError(e.message || 'Failed to delete task.');
        } finally {
          setIsConfirmLoading(false);
        }
      }
    });
  };

  // ---------------- Chat Handlers ----------------
  const loadChatSpaces = async () => {
    if (!accessToken) return;
    setIsLoadingChat(true);
    try {
      const spaces = await fetchChatSpaces(accessToken);
      setChatSpaces(spaces);
      if (spaces.length > 0 && !selectedSpace) {
        setSelectedSpace(spaces[0]);
      }
    } catch (e: any) {
      showError(e.message || 'Failed to fetch Google Chat spaces.');
    } finally {
      setIsLoadingChat(false);
    }
  };

  const loadMessages = async (spaceName: string) => {
    if (!accessToken) return;
    setIsLoadingChat(true);
    try {
      const msgs = await fetchChatMessages(accessToken, spaceName);
      setChatMessages(msgs);
    } catch (e: any) {
      showError(e.message || 'Failed to fetch chat messages.');
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedSpace || !chatInputText.trim()) return;

    const textToSend = chatInputText;
    setConfirmModal({
      isOpen: true,
      title: 'Send Google Chat Message?',
      message: `Post message to space "${selectedSpace.displayName || selectedSpace.name}":\n"${textToSend}"`,
      confirmLabel: 'Send Message',
      confirmVariant: 'primary',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          const sent = await sendChatMessage(accessToken, selectedSpace.name, textToSend);
          setChatMessages((prev) => [...prev, sent]);
          setChatInputText('');
          showSuccess('Message posted to Google Chat!');
          setConfirmModal((m) => ({ ...m, isOpen: false }));
        } catch (e: any) {
          showError(e.message || 'Failed to post message to Google Chat.');
        } finally {
          setIsConfirmLoading(false);
        }
      }
    });
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newSpaceName.trim()) return;

    try {
      setIsLoadingChat(true);
      const created = await createChatSpace(accessToken, newSpaceName.trim());
      setChatSpaces((prev) => [created, ...prev]);
      setSelectedSpace(created);
      setShowCreateSpaceModal(false);
      setNewSpaceName('');
      showSuccess(`Created Google Chat space "${created.displayName}"!`);
    } catch (e: any) {
      showError(e.message || 'Failed to create Chat space.');
    } finally {
      setIsLoadingChat(false);
    }
  };

  // ---------------- Meet Handlers ----------------
  const handleGenerateMeet = async () => {
    if (!accessToken) return;
    setIsCreatingMeet(true);
    try {
      const meet = await createMeetSpace(accessToken);
      setGeneratedMeetSpaces((prev) => [meet, ...prev]);
      showSuccess(`Generated Google Meet space: ${meet.meetingCode || meet.name}`);
    } catch (e: any) {
      showError(e.message || 'Failed to create Google Meet space.');
    } finally {
      setIsCreatingMeet(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            id="workspace-tab-calendar"
            onClick={() => setActiveTab('CALENDAR')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CALENDAR'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-300" />
            <span>Google Calendar</span>
          </button>

          <button
            id="workspace-tab-tasks"
            onClick={() => setActiveTab('TASKS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'TASKS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-300" />
            <span>Google Tasks</span>
          </button>

          <button
            id="workspace-tab-chat"
            onClick={() => setActiveTab('CHAT')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CHAT'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-cyan-300" />
            <span>Google Chat</span>
          </button>

          <button
            id="workspace-tab-meet"
            onClick={() => setActiveTab('MEET')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MEET'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Video className="w-4 h-4 text-amber-300" />
            <span>Google Meet</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'CALENDAR' && (
            <button
              onClick={loadEvents}
              disabled={isLoadingEvents || !accessToken}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              title="Refresh events"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
            </button>
          )}
          {activeTab === 'TASKS' && (
            <button
              onClick={() => selectedTaskListId && loadTasks(selectedTaskListId)}
              disabled={isLoadingTasks || !accessToken}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              title="Refresh tasks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTasks ? 'animate-spin' : ''}`} />
            </button>
          )}
          {activeTab === 'CHAT' && (
            <button
              onClick={loadChatSpaces}
              disabled={isLoadingChat || !accessToken}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              title="Refresh chat"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChat ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ---------------- 1. CALENDAR VIEW ---------------- */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Google Calendar Events</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {events.length} Scheduled
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                View upcoming field appointments, shifts, and team meetings synced directly with your primary calendar.
              </p>
            </div>

            <button
              id="open-add-event-modal-btn"
              onClick={() => setShowAddEventModal(true)}
              disabled={!accessToken}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Event</span>
            </button>
          </div>

          {isLoadingEvents ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
              <span className="text-xs">Fetching Google Calendar events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="py-10 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No events found in this period</p>
              <p className="text-slate-500 mt-1">Click "Schedule Event" to create a new field shift or meeting.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {events.map((ev) => {
                const startTime = ev.start?.dateTime
                  ? new Date(ev.start.dateTime).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })
                  : ev.start?.date || 'All Day';

                const meetUri =
                  ev.hangoutLink ||
                  ev.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri;

                return (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                          {ev.summary || '(No Title)'}
                        </h4>
                        <button
                          onClick={() => confirmDeleteEvent(ev)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {ev.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          <span>{startTime}</span>
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            <span className="truncate max-w-[150px]">{ev.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                      {meetUri ? (
                        <a
                          href={meetUri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors font-semibold"
                        >
                          <Video className="w-3 h-3" />
                          <span>Join Meet Call</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">In-Person Shift</span>
                      )}

                      {ev.htmlLink && (
                        <a
                          href={ev.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <span>Open in Google</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Event Modal */}
          {showAddEventModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>Create Google Calendar Event</span>
                  </h3>
                  <button
                    onClick={() => setShowAddEventModal(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Event Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Field Inspection & Attendance Audit"
                      value={newEventSummary}
                      onChange={(e) => setNewEventSummary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={newEventStart}
                        onChange={(e) => setNewEventStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={newEventEnd}
                        onChange={(e) => setNewEventEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Location / Geofence Zone</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Location or site name"
                        value={newEventLocation}
                        onChange={(e) => setNewEventLocation(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                      {geofences.length > 0 && (
                        <select
                          onChange={(e) => setNewEventLocation(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
                        >
                          <option value="">Select Zone...</option>
                          {geofences.map((g) => (
                            <option key={g.id} value={g.name}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Description / Shift Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Notes, agenda, or attendance instructions..."
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="meet-checkbox"
                      checked={newEventAddMeet}
                      onChange={(e) => setNewEventAddMeet(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="meet-checkbox" className="text-slate-300 font-medium">
                      Attach Google Meet video conference link automatically
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddEventModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoadingEvents}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2"
                    >
                      {isLoadingEvents && (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      )}
                      <span>Add to Google Calendar</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- 2. TASKS VIEW ---------------- */}
      {activeTab === 'TASKS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Google Tasks Checklist</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {tasks.filter((t) => t.status === 'completed').length}/{tasks.length} Completed
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Track and complete field engineering actions, geofence validations, and daily site checklists.
              </p>
            </div>

            {taskLists.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">List:</span>
                <select
                  value={selectedTaskListId}
                  onChange={(e) => setSelectedTaskListId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {taskLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* New Task Inline Form */}
          <form onSubmit={handleCreateTask} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Add a new Google Task (e.g. Inspect boundary beacons)..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isLoadingTasks || !newTaskTitle.trim() || !accessToken}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="Optional notes or details"
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 focus:outline-none"
              />
              <input
                type="date"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 focus:outline-none"
              />
            </div>
          </form>

          {isLoadingTasks ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
              <span className="text-xs">Loading tasks from Google Tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
              <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No tasks in this list</p>
              <p className="text-slate-500 mt-1">Use the field above to add your first task.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isDone
                        ? 'bg-slate-950/40 border-slate-900 opacity-60'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => handleToggleTaskStatus(task)}
                        className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            isDone ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.notes && (
                          <p className="text-[11px] text-slate-400 mt-0.5 whitespace-pre-line">{task.notes}</p>
                        )}
                        {task.due && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>Due: {new Date(task.due).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => confirmDeleteTask(task)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- 3. CHAT VIEW ---------------- */}
      {activeTab === 'CHAT' && (
        <div className="space-y-4">
          {/* Automated Webhook Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-100">Automated Attendance Webhook</h4>
                  {chatWebhookConfig?.enabled && chatWebhookConfig.webhookUrl ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Live Trigger Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                      Webhook Unconfigured
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {chatWebhookConfig?.webhookUrl
                    ? `Dispatching real-time Card V2 attendance verifications to ${chatWebhookConfig.spaceName || 'Google Chat space'}.`
                    : 'Configure an Incoming Webhook URL to automatically push check-ins to Google Chat.'}
                </p>
              </div>
            </div>

            {onOpenChatWebhookModal && (
              <button
                type="button"
                onClick={onOpenChatWebhookModal}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{chatWebhookConfig?.webhookUrl ? 'Manage Webhook' : 'Setup Webhook'}</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Google Chat Spaces</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {chatSpaces.length} Spaces
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Collaborate with on-site staff and broadcast automated attendance or geofence updates.
              </p>
            </div>

            <button
              onClick={() => setShowCreateSpaceModal(true)}
              disabled={!accessToken}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>New Space</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 4 Cols: Spaces list */}
            <div className="lg:col-span-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 px-1">Your Spaces & Rooms</h4>
              {chatSpaces.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 text-center">
                  No spaces found. Click "New Space" to create a team room.
                </div>
              ) : (
                chatSpaces.map((sp) => (
                  <button
                    key={sp.name}
                    onClick={() => setSelectedSpace(sp)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedSpace?.name === sp.name
                        ? 'bg-cyan-950/60 border-cyan-500/50 text-white shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Users className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="text-xs font-bold truncate">
                        {sp.displayName || sp.name.replace('spaces/', 'Room ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{sp.spaceType || 'SPACE'}</span>
                  </button>
                ))
              )}
            </div>

            {/* Right 8 Cols: Message thread & composer */}
            <div className="lg:col-span-8 flex flex-col h-[450px] rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">
                    {selectedSpace?.displayName || selectedSpace?.name || 'Select a Space'}
                  </span>
                </div>
                {selectedSpace && (
                  <span className="text-[10px] text-slate-400">{chatMessages.length} messages</span>
                )}
              </div>

              {/* Messages scroll area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {!selectedSpace ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Select a Google Chat space on the left to start viewing messages.
                  </div>
                ) : isLoadingChat ? (
                  <div className="h-full flex items-center justify-center gap-2 text-xs text-slate-400">
                    <span className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
                    <span>Loading messages...</span>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-1">
                    <MessageSquare className="w-6 h-6 text-slate-600 mb-1" />
                    <span>No messages in this space yet.</span>
                    <span className="text-[11px] text-slate-600">Send an update below!</span>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={msg.name || idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-cyan-300">
                          {msg.sender?.displayName || msg.sender?.name || 'Workspace User'}
                        </span>
                        {msg.createTime && (
                          <span className="text-[10px] text-slate-500">
                            {new Date(msg.createTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Template chips */}
              <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                <span className="text-slate-500 flex-shrink-0">Quick Broadcast:</span>
                <button
                  type="button"
                  onClick={() => setChatInputText(`📢 Attendance shift verified at ${activeGeofence?.name || 'Tech Center HQ'}. All personnel present.`)}
                  className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex-shrink-0 transition-colors"
                >
                  Shift Verified
                </button>
                <button
                  type="button"
                  onClick={() => setChatInputText(`🚨 Geofence perimeter check completed for ${activeGeofence?.name || 'Site Alpha'}. Status: Normal.`)}
                  className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex-shrink-0 transition-colors"
                >
                  Perimeter Clear
                </button>
                <button
                  type="button"
                  onClick={() => setChatInputText('📹 Quick video sync requested via Google Meet. Please join link in Meet tab.')}
                  className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex-shrink-0 transition-colors"
                >
                  Meet Request
                </button>
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder={
                    selectedSpace
                      ? `Message ${selectedSpace.displayName || 'space'}...`
                      : 'Select a space first...'
                  }
                  disabled={!selectedSpace || !accessToken}
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!selectedSpace || !chatInputText.trim() || !accessToken}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Create Space Modal */}
          {showCreateSpaceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Create Google Chat Space</span>
                  </h3>
                  <button
                    onClick={() => setShowCreateSpaceModal(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateSpace} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Space Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Field Operations SF"
                      value={newSpaceName}
                      onChange={(e) => setNewSpaceName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateSpaceModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoadingChat}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-2"
                    >
                      {isLoadingChat && (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      )}
                      <span>Create Space</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- 4. MEET VIEW ---------------- */}
      {activeTab === 'MEET' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Google Meet Video Spaces</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Instant HD Video
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Launch instant video rooms for field crew briefings, site manager audits, and remote diagnostics.
              </p>
            </div>

            <button
              id="generate-meet-btn"
              onClick={handleGenerateMeet}
              disabled={isCreatingMeet || !accessToken}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isCreatingMeet ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Create New Meet Space</span>
            </button>
          </div>

          {generatedMeetSpaces.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">No active Meet spaces generated yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Click "Create New Meet Space" above to provision a secure, direct Google Meet video call for your team.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedMeetSpaces.map((meet, idx) => (
                <div
                  key={meet.name || idx}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-xl shadow-amber-500/5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">Live Meeting Space</h4>
                        <p className="text-[11px] font-mono text-amber-300">
                          {meet.meetingCode || meet.name.replace('spaces/', '')}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ready to Join
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="truncate text-slate-300 font-mono text-[11px]">
                      {meet.meetingUri || `https://meet.google.com/${meet.meetingCode}`}
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          meet.meetingUri || `https://meet.google.com/${meet.meetingCode}`,
                          meet.name
                        )
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
                      title="Copy link"
                    >
                      {copiedCode === meet.name ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={meet.meetingUri || `https://meet.google.com/${meet.meetingCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Meeting Room</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explicit Confirmation Dialog (Mandatory per Workspace Skill) */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        isLoading={isConfirmLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
};
