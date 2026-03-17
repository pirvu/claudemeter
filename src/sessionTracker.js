// Project:   Claudemeter
// File:      sessionTracker.js
// Purpose:   Track token usage across Claude Code sessions
// Language:  JavaScript (CommonJS)
//
// License:   MIT
// Copyright: (c) 2026 HYPERI PTY LIMITED

const fs = require('fs').promises;
const { PATHS, getTokenLimit } = require('./utils');

// Session data stored in OS config dir for persistence across installs
class SessionTracker {
    constructor(sessionFilePath) {
        this.sessionFilePath = sessionFilePath || PATHS.SESSION_DATA_FILE;
        this.currentSession = null;
        this._cachedData = null;
    }

    async loadData() {
        if (this._cachedData) return this._cachedData;

        try {
            const content = await fs.readFile(this.sessionFilePath, 'utf8');
            this._cachedData = JSON.parse(content);
            return this._cachedData;
        } catch (error) {
            this._cachedData = {
                sessions: [],
                totals: {
                    totalSessions: 0,
                    totalTokensUsed: 0,
                    lastSessionDate: null
                }
            };
            return this._cachedData;
        }
    }

    async saveData(data) {
        this._cachedData = data;
        await fs.writeFile(this.sessionFilePath, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
    }

    async startSession(description = 'Development session') {
        const data = await this.loadData();

        const sessionNumber = String(data.sessions.length + 1).padStart(3, '0');
        const date = new Date().toISOString().split('T')[0];

        const tokenLimit = getTokenLimit();
        this.currentSession = {
            sessionId: `session-${date}-${sessionNumber}`,
            startTime: new Date().toISOString(),
            description: description,
            tokenUsage: {
                current: 0,
                limit: tokenLimit,
                remaining: tokenLimit,
                lastUpdate: new Date().toISOString()
            }
        };

        data.sessions.push(this.currentSession);
        data.totals.totalSessions = data.sessions.length;
        data.totals.lastSessionDate = this.currentSession.startTime;

        await this.saveData(data);
        return this.currentSession;
    }

    async updateTokens(tokensUsed, tokenLimit = null) {
        const limit = tokenLimit || getTokenLimit();
        const data = await this.loadData();

        const session = this.currentSession || data.sessions[data.sessions.length - 1];
        if (!session) {
            console.warn('No active session to update');
            return;
        }

        session.tokenUsage.current = tokensUsed;
        session.tokenUsage.limit = limit;
        session.tokenUsage.remaining = limit - tokensUsed;
        session.tokenUsage.lastUpdate = new Date().toISOString();

        data.totals.totalTokensUsed = data.sessions.reduce(
            (sum, s) => sum + (s.tokenUsage.current || 0),
            0
        );

        await this.saveData(data);
    }

    async getCurrentSession() {
        if (this.currentSession) {
            return this.currentSession;
        }

        const data = await this.loadData();
        return data.sessions.length > 0 ? data.sessions[data.sessions.length - 1] : null;
    }
}

module.exports = { SessionTracker };
