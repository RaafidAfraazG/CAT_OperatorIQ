const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function fetchAPI(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Dashboard
  getDashboardSummary: () => fetchAPI('/api/dashboard/summary'),
  getOperatorDashboard: (operatorId: string) => fetchAPI(`/api/operator/${operatorId}/dashboard`),

  // Machines
  getMachines: () => fetchAPI('/api/machines'),
  getMachine: (machineId: string) => fetchAPI(`/api/machines/${machineId}`),

  // Operators
  getOperators: () => fetchAPI('/api/operators'),
  getOperator: (operatorId: string) => fetchAPI(`/api/operators/${operatorId}`),

  // Tasks
  getTasks: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/api/tasks${qs}`);
  },
  getTask: (taskId: string) => fetchAPI(`/api/tasks/${taskId}`),
  getDailyTasks: () => fetchAPI('/api/daily-tasks'),

  // Safety & Events
  getSafetyEvents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/api/safety/events${qs}`);
  },
  
  // Telemetry & Fuel
  getTelemetry: (machineId: string, limit: number = 100) => fetchAPI(`/api/telemetry/${machineId}?limit=${limit}`),
  getFuel: (machineId: string, limit: number = 100) => fetchAPI(`/api/fuel/${machineId}?limit=${limit}`),

  // Alerts
  getAlerts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/api/alerts${qs}`);
  },

  // Training
  getTrainingModules: () => fetchAPI('/api/training/modules'),
  getTrainingProgress: (operatorId: string) => fetchAPI(`/api/training/progress/${operatorId}`),
  // Intelligence Endpoints
  getTaskEta: (taskId: string) => fetchAPI('/api/intelligence/task-eta', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId })
  }),
  getFuelAnomaly: (machineId: string) => fetchAPI(`/api/intelligence/fuel/${machineId}`),
  getSafetyRisk: (operatorId: string) => fetchAPI(`/api/intelligence/safety/${operatorId}`),
  getOperatorIntelligence: (operatorId: string) => fetchAPI(`/api/intelligence/operator/${operatorId}`),
  
  // Assistant
  chatWithAssistant: (message: string, operatorId: string, telemetry?: Record<string, any>) => fetchAPI('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      operator_id: operatorId,
      ...(telemetry || {})
    })
  }),

  // Incidents
  getIncidents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/api/incidents${qs}`);
  },
  reportIncident: (body: {
    incident_type: string;
    severity: string;
    location_zone: string;
    description?: string;
    operator_id?: string;
    machine_id?: string;
  }) => fetchAPI('/api/incidents', {
    method: 'POST',
    body: JSON.stringify(body),
  }),

  // Alert resolution
  resolveAlert: (alertId: string) => fetchAPI(`/api/alerts/${alertId}/resolve`, { method: 'PATCH' }),
  getOperatorAlerts: (operatorId: string, resolved?: boolean) => {
    const qs = resolved !== undefined ? `?resolved=${resolved}` : '';
    return fetchAPI(`/api/alerts/operator/${operatorId}${qs}`);
  },
};
