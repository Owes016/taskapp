// Google Workspace API Services: Calendar, Tasks, Chat, Meet

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
  status?: string;
}

export interface TaskListItem {
  id: string;
  title: string;
  updated?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated?: string;
}

export interface ChatSpaceItem {
  name: string; // "spaces/{spaceId}"
  displayName?: string;
  spaceType?: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE';
  type?: string;
  spaceThreadingState?: string;
  spaceHistoryState?: string;
}

export interface ChatMessageItem {
  name: string;
  text?: string;
  formattedText?: string;
  createTime?: string;
  sender?: {
    name?: string;
    displayName?: string;
    avatarUrl?: string;
    type?: string;
  };
}

export interface MeetSpaceItem {
  name: string; // e.g. "spaces/xyz123"
  meetingUri: string; // e.g. "https://meet.google.com/abc-defg-hij"
  meetingCode: string; // e.g. "abc-defg-hij"
  config?: {
    accessType?: string;
    entryPointAccess?: string;
  };
  activeConference?: {
    conferenceRecord?: string;
  };
}

// ---------------- CALENDAR API ----------------
export async function fetchCalendarEvents(accessToken: string): Promise<CalendarEventItem[]> {
  const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&singleEvents=true&orderBy=startTime&maxResults=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Calendar events (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    addMeetLink?: boolean;
  }
): Promise<CalendarEventItem> {
  const body: any = {
    summary: event.summary,
    description: event.description || '',
    location: event.location || '',
    start: {
      dateTime: event.startTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: event.endTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  if (event.addMeetLink) {
    body.conferenceData = {
      createRequest: {
        requestId: `meet_${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    };
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events${
    event.addMeetLink ? '?conferenceDataVersion=1' : ''
  }`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Calendar event (${res.status})`);
  }

  return await res.json();
}

export async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete Calendar event (${res.status})`);
  }
}

// ---------------- TASKS API ----------------
export async function fetchTaskLists(accessToken: string): Promise<TaskListItem[]> {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=20', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Task lists (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function fetchTasks(accessToken: string, taskListId: string): Promise<TaskItem[]> {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
      taskListId
    )}/tasks?showCompleted=true&showHidden=true&maxResults=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch tasks (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createTask(
  accessToken: string,
  taskListId: string,
  task: {
    title: string;
    notes?: string;
    due?: string; // RFC 3339 timestamp
  }
): Promise<TaskItem> {
  const body: any = {
    title: task.title,
    notes: task.notes || ''
  };

  if (task.due) {
    body.due = task.due;
  }

  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create task (${res.status})`);
  }

  return await res.json();
}

export async function updateTaskStatus(
  accessToken: string,
  taskListId: string,
  taskId: string,
  completed: boolean
): Promise<TaskItem> {
  const body = {
    id: taskId,
    status: completed ? 'completed' : 'needsAction'
  };

  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
      taskListId
    )}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update task (${res.status})`);
  }

  return await res.json();
}

export async function deleteTask(
  accessToken: string,
  taskListId: string,
  taskId: string
): Promise<void> {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
      taskListId
    )}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete task (${res.status})`);
  }
}

// ---------------- CHAT API ----------------
export async function fetchChatSpaces(accessToken: string): Promise<ChatSpaceItem[]> {
  const res = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=30', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Chat spaces (${res.status})`);
  }

  const data = await res.json();
  return data.spaces || [];
}

export async function createChatSpace(
  accessToken: string,
  displayName: string,
  spaceType: 'SPACE' | 'GROUP_CHAT' = 'SPACE'
): Promise<ChatSpaceItem> {
  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      spaceType,
      displayName
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Chat space (${res.status})`);
  }

  return await res.json();
}

export async function fetchChatMessages(
  accessToken: string,
  spaceName: string
): Promise<ChatMessageItem[]> {
  // spaceName is like "spaces/AAAAAAAAAAA"
  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=40`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Chat messages (${res.status})`);
  }

  const data = await res.json();
  return data.messages || [];
}

export async function sendChatMessage(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<ChatMessageItem> {
  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send Chat message (${res.status})`);
  }

  return await res.json();
}

// ---------------- MEET API ----------------
export async function createMeetSpace(accessToken: string): Promise<MeetSpaceItem> {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      config: {
        accessType: 'OPEN',
        entryPointAccess: 'ALL'
      }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Meet space (${res.status})`);
  }

  return await res.json();
}
