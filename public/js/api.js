const API_BASE = 'http://localhost:3000/api';

class FestivalAPI {
    // Events
    static async getEvents() {
        const response = await fetch(`${API_BASE}/events`);
        return await response.json();
    }

    static async createEvent(eventData) {
        const response = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });
        return await response.json();
    }

    // Schedules
    static async getSchedules() {
        const response = await fetch(`${API_BASE}/schedules`);
        return await response.json();
    }

    static async createSchedule(scheduleData) {
        const response = await fetch(`${API_BASE}/schedules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scheduleData)
        });
        return await response.json();
    }

    static async getSchedule(id) {
        const response = await fetch(`${API_BASE}/schedules/${id}`);
        return await response.json();
    }

    static async updateSchedule(id, scheduleData) {
        const response = await fetch(`${API_BASE}/schedules/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scheduleData)
        });
        return await response.json();
    }

    static async deleteSchedule(id) {
        await fetch(`${API_BASE}/schedules/${id}`, {
            method: 'DELETE'
        });
    }
}