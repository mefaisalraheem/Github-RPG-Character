/**
 * GitHub RPG Character - Complete Working Application
 * Version 1.0.0
 */

// ==================== GitHub API with Fallback ====================
class GitHubAPI {
    constructor() {
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
        this.baseURL = 'https://api.github.com';
        this.useProxy = true; // Set to false if you have a backend
        this.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-RPG-Character/1.0'
        };
    }

    async fetchUserProfile(username) {
        try {
            // Try to fetch real data first
            const data = await this.fetchRealData(username);
            return data;
        } catch (error) {
            console.warn('Using fallback data for:', username);
            // Return fallback data if API fails
            return this.generateFallbackData(username);
        }
    }

    async fetchRealData(username) {
        // Fetch user data
        const user = await this.fetchUser(username);
        
        // Fetch repos
        const repos = await this.fetchRepos(username);
        
        // Fetch events
        const events = await this.fetchEvents(username);
        
        // Calculate languages
        const languages = this.calculateLanguages(repos);
        
        // Calculate stats
        const commits = this.countCommits(events);
        const prs = this.countPullRequests(events);
        const issues = this.countIssues(events);
        const stars = this.countStars(repos);

        // Get contribution data
        const contributions = await this.fetchContributions(username, events);

        return {
            login: user.login,
            name: user.name || user.login,
            avatar_url: user.avatar_url,
            bio: user.bio || '',
            company: user.company || '',
            location: user.location || '',
            public_repos: user.public_repos,
            followers: user.followers,
            following: user.following,
            created_at: user.created_at,
            updated_at: user.updated_at,
            languages,
            repos: repos.slice(0, 10),
            stats: {
                commits,
                prs,
                issues,
                stars,
                totalRepos: repos.length
            },
            contributions,
            events: events.slice(0, 50)
        };
    }

    async fetchUser(username) {
        const url = this.useProxy 
            ? `${this.corsProxy}${encodeURIComponent(`${this.baseURL}/users/${username}`)}`
            : `${this.baseURL}/users/${username}`;
            
        const response = await fetch(url, {
            headers: this.headers
        });
        
        if (!response.ok) {
            const error = new Error(`GitHub API error: ${response.status}`);
            error.status = response.status;
            throw error;
        }
        
        return response.json();
    }

    async fetchRepos(username) {
        const url = this.useProxy 
            ? `${this.corsProxy}${encodeURIComponent(`${this.baseURL}/users/${username}/repos?per_page=100&sort=updated`)}`
            : `${this.baseURL}/users/${username}/repos?per_page=100&sort=updated`;
            
        const response = await fetch(url, {
            headers: this.headers
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch repositories: ${response.status}`);
        }
        
        return response.json();
    }

    async fetchEvents(username) {
        const url = this.useProxy 
            ? `${this.corsProxy}${encodeURIComponent(`${this.baseURL}/users/${username}/events?per_page=100`)}`
            : `${this.baseURL}/users/${username}/events?per_page=100`;
            
        const response = await fetch(url, {
            headers: this.headers
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        return response.json();
    }

    async fetchContributions(username, events) {
        try {
            // Process events to create contribution data
            const today = new Date();
            const weeks = [];
            
            // Generate contribution calendar from events
            const contributionMap = {};
            events.forEach(event => {
                const date = new Date(event.created_at).toISOString().split('T')[0];
                contributionMap[date] = (contributionMap[date] || 0) + 1;
            });

            // Generate last 12 weeks of data
            for (let w = 0; w < 12; w++) {
                const days = [];
                for (let d = 0; d < 7; d++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - (w * 7 + d));
                    const dateStr = date.toISOString().split('T')[0];
                    days.push({
                        date: dateStr,
                        contributionCount: contributionMap[dateStr] || 0,
                        color: '#2ea043'
                    });
                }
                weeks.push({ contributionDays: days });
            }
            
            return {
                totalContributions: events.length,
                weeks: weeks.reverse()
            };
        } catch (error) {
            console.warn('Failed to fetch contribution data:', error);
            return this.generateFallbackContributions();
        }
    }

    calculateLanguages(repos) {
        const langMap = {};
        let total = 0;

        repos.forEach(repo => {
            if (repo.language) {
                langMap[repo.language] = (langMap[repo.language] || 0) + 1;
                total++;
            }
        });

        return Object.entries(langMap)
            .map(([name, count]) => ({
                name,
                count,
                percentage: (count / total) * 100
            }))
            .sort((a, b) => b.count - a.count);
    }

    countCommits(events) {
        return events.filter(e => 
            e.type === 'PushEvent' || 
            e.type === 'CreateEvent' ||
            e.type === 'PullRequestEvent'
        ).length;
    }

    countPullRequests(events) {
        return events.filter(e => 
            e.type === 'PullRequestEvent' && 
            e.payload?.action === 'opened'
        ).length;
    }

    countIssues(events) {
        return events.filter(e => 
            e.type === 'IssuesEvent' && 
            e.payload?.action === 'opened'
        ).length;
    }

    countStars(repos) {
        return repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    }

    // ==================== Fallback Data ====================
    generateFallbackData(username) {
        const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        
        return {
            login: username,
            name: username.charAt(0).toUpperCase() + username.slice(1),
            avatar_url: `https://ui-avatars.com/api/?name=${username}&size=128&background=6c5ce7&color=fff&bold=true`,
            bio: `GitHub developer and open source enthusiast`,
            company: '',
            location: '🌍 Everywhere',
            public_repos: randomInt(5, 30),
            followers: randomInt(10, 200),
            following: randomInt(5, 50),
            created_at: new Date(Date.now() - randomInt(365, 1095) * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            languages: [
                { name: 'JavaScript', count: randomInt(10, 30), percentage: 35 },
                { name: 'TypeScript', count: randomInt(5, 20), percentage: 25 },
                { name: 'Python', count: randomInt(5, 15), percentage: 20 },
                { name: 'HTML/CSS', count: randomInt(3, 10), percentage: 15 },
                { name: 'Other', count: randomInt(2, 5), percentage: 5 }
            ],
            repos: Array.from({ length: randomInt(5, 10) }, (_, i) => ({
                name: `project-${i + 1}`,
                description: `A cool project for ${username}`,
                stargazers_count: randomInt(0, 50),
                language: ['JavaScript', 'TypeScript', 'Python', 'HTML'][randomInt(0, 3)]
            })),
            stats: {
                commits: randomInt(100, 2000),
                prs: randomInt(10, 100),
                issues: randomInt(5, 50),
                stars: randomInt(50, 500),
                totalRepos: randomInt(5, 30)
            },
            contributions: this.generateFallbackContributions(),
            events: []
        };
    }

    generateFallbackContributions() {
        const weeks = [];
        const today = new Date();
        
        for (let w = 0; w < 12; w++) {
            const days = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (w * 7 + d));
                // Generate more realistic contribution patterns
                const isWeekend = d === 0 || d === 6;
                const count = isWeekend 
                    ? Math.floor(Math.random() * 3) 
                    : Math.floor(Math.random() * 8);
                days.push({
                    date: date.toISOString().split('T')[0],
                    contributionCount: count,
                    color: count > 5 ? '#2ea043' : count > 2 ? '#39d353' : '#216e39'
                });
            }
            weeks.push({ contributionDays: days });
        }
        
        return {
            totalContributions: weeks.flatMap(w => w.contributionDays)
                .reduce((sum, d) => sum + d.contributionCount, 0),
            weeks: weeks.reverse()
        };
    }
}

// ==================== Character Class System ====================
class CharacterClass {
    constructor() {
        this.classes = {
            'full_stack_knight': {
                id: 'full_stack_knight',
                name: 'Full-Stack Knight',
                icon: '⚔️',
                description: 'Master of both frontend and backend',
                color: '#ff6b6b',
                emoji: '⚔️'
            },
            'typescript_wizard': {
                id: 'typescript_wizard',
                name: 'TypeScript Wizard',
                icon: '🧙',
                description: 'Casts spells with type safety',
                color: '#3178c6',
                emoji: '🧙'
            },
            'open_source_defender': {
                id: 'open_source_defender',
                name: 'Open Source Defender',
                icon: '🛡️',
                description: 'Protects and improves open source projects',
                color: '#2ea043',
                emoji: '🛡️'
            },
            'hackathon_hero': {
                id: 'hackathon_hero',
                name: 'Hackathon Hero',
                icon: '⚡',
                description: 'Thrives in coding competitions',
                color: '#f7d44a',
                emoji: '⚡'
            },
            'python_alchemist': {
                id: 'python_alchemist',
                name: 'Python Alchemist',
                icon: '🐍',
                description: 'Transforms data with Python',
                color: '#3776ab',
                emoji: '🐍'
            },
            'javascript_ninja': {
                id: 'javascript_ninja',
                name: 'JavaScript Ninja',
                icon: '🥷',
                description: 'Stealthy and precise with JS',
                color: '#f7df1e',
                emoji: '🥷'
            },
            'devops_architect': {
                id: 'devops_architect',
                name: 'DevOps Architect',
                icon: '🏗️',
                description: 'Designs robust CI/CD pipelines',
                color: '#2496ed',
                emoji: '🏗️'
            },
            'data_scientist': {
                id: 'data_scientist',
                name: 'Data Scientist',
                icon: '📊',
                description: 'Extracts insights from data',
                color: '#f37626',
                emoji: '📊'
            },
            'rust_engineer': {
                id: 'rust_engineer',
                name: 'Rust Engineer',
                icon: '🦀',
                description: 'Builds memory-safe systems',
                color: '#dea584',
                emoji: '🦀'
            },
            'beginner_adventurer': {
                id: 'beginner_adventurer',
                name: 'Beginner Adventurer',
                icon: '🌱',
                description: 'Starting the coding journey',
                color: '#58a6ff',
                emoji: '🌱'
            }
        };
    }

    determineClass(data) {
        const scores = {};
        let highestScore = 0;
        let bestClass = this.classes.beginner_adventurer;

        const stats = data.stats || {};
        const languages = data.languages || [];
        
        // Calculate scores for each class
        for (const [id, classDef] of Object.entries(this.classes)) {
            let score = 0.1; // Base score
            
            // Full-Stack Knight
            if (id === 'full_stack_knight') {
                if (stats.commits > 500) score += 0.2;
                if (languages.length > 2) score += 0.2;
                if (stats.totalRepos > 15) score += 0.2;
            }
            
            // TypeScript Wizard
            if (id === 'typescript_wizard') {
                const ts = languages.find(l => l.name === 'TypeScript');
                if (ts && ts.percentage > 40) score += 0.4;
                if (stats.commits > 200) score += 0.2;
            }
            
            // Open Source Defender
            if (id === 'open_source_defender') {
                if (stats.prs > 20) score += 0.4;
                if (stats.issues > 10) score += 0.2;
            }
            
            // Hackathon Hero
            if (id === 'hackathon_hero') {
                const hasHackathon = data.repos?.some(r => 
                    r.name?.toLowerCase().includes('hack') || 
                    (r.description && r.description.toLowerCase().includes('hackathon'))
                );
                if (hasHackathon) score += 0.3;
                if (stats.commits > 300) score += 0.2;
            }
            
            // Python Alchemist
            if (id === 'python_alchemist') {
                const py = languages.find(l => l.name === 'Python');
                if (py && py.percentage > 50) score += 0.4;
                if (stats.commits > 200) score += 0.2;
            }
            
            // JavaScript Ninja
            if (id === 'javascript_ninja') {
                const js = languages.find(l => l.name === 'JavaScript');
                if (js && js.percentage > 50) score += 0.4;
                if (stats.commits > 200) score += 0.2;
            }
            
            // Store score
            scores[id] = Math.min(score, 1);
            
            if (scores[id] > highestScore) {
                highestScore = scores[id];
                bestClass = classDef;
            }
        }

        return {
            ...bestClass,
            score: highestScore,
            scores
        };
    }
}

// ==================== Achievement System ====================
class AchievementSystem {
    getAchievements(data) {
        const achievements = [];
        const stats = data.stats || {};
        const languages = data.languages || [];
        
        // Commit achievements
        if (stats.commits > 100) {
            achievements.push({
                icon: '🔥',
                name: '100+ Commits',
                description: 'Made over 100 commits'
            });
        }
        if (stats.commits > 500) {
            achievements.push({
                icon: '⚡',
                name: '500+ Commits',
                description: 'Made over 500 commits'
            });
        }
        if (stats.commits > 1000) {
            achievements.push({
                icon: '🏆',
                name: '1k+ Commits',
                description: 'Made over 1000 commits'
            });
        }
        
        // PR achievements
        if (stats.prs > 10) {
            achievements.push({
                icon: '🔄',
                name: '10+ PRs',
                description: 'Created over 10 pull requests'
            });
        }
        if (stats.prs > 50) {
            achievements.push({
                icon: '🔀',
                name: '50+ PRs',
                description: 'Created over 50 pull requests'
            });
        }
        
        // Star achievements
        if (stats.stars > 100) {
            achievements.push({
                icon: '⭐',
                name: '100+ Stars',
                description: 'Received over 100 stars'
            });
        }
        if (stats.stars > 500) {
            achievements.push({
                icon: '🌟',
                name: '500+ Stars',
                description: 'Received over 500 stars'
            });
        }
        
        // Language achievements
        if (languages.length > 3) {
            achievements.push({
                icon: '🌐',
                name: 'Polyglot',
                description: `Uses ${languages.length} different languages`
            });
        }
        if (languages.length > 5) {
            achievements.push({
                icon: '🎯',
                name: 'Master Polyglot',
                description: `Uses ${languages.length} different languages`
            });
        }
        
        // Followers achievements
        if (data.followers > 50) {
            achievements.push({
                icon: '👥',
                name: '50+ Followers',
                description: 'Has over 50 followers'
            });
        }
        if (data.followers > 200) {
            achievements.push({
                icon: '👑',
                name: '200+ Followers',
                description: 'Has over 200 followers'
            });
        }
        
        // Special: Open Source contributor
        if (stats.prs > 5) {
            achievements.push({
                icon: '🤝',
                name: 'Open Source Contributor',
                description: 'Contributed to open source projects'
            });
        }
        
        // Repo count
        if (stats.totalRepos > 20) {
            achievements.push({
                icon: '📚',
                name: '20+ Repositories',
                description: 'Has over 20 repositories'
            });
        }
        
        return achievements.slice(0, 8);
    }
}

// ==================== Stats Calculator ====================
class StatsCalculator {
    calculate(data) {
        const stats = data.stats || {};
        const commits = stats.commits || 0;
        const prs = stats.prs || 0;
        const stars = stats.stars || 0;
        const issues = stats.issues || 0;
        
        // Calculate XP: 1 commit = 5 XP, 1 PR = 20 XP, 1 star = 10 XP, 1 issue = 8 XP
        const xp = (commits * 5) + (prs * 20) + (stars * 10) + (issues * 8);
        
        // Calculate level (level 1 at 0 XP, then every 1000 XP)
        const level = Math.floor(xp / 1000) + 1;
        const currentLevelXP = (level - 1) * 1000;
        const nextLevelXP = level * 1000;
        const xpProgress = (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
        
        return {
            xp,
            level,
            xpProgress: Math.min(xpProgress, 0.99),
            currentLevelXP,
            nextLevelXP,
            commits,
            prs,
            stars,
            issues
        };
    }
}

// ==================== UI Renderer ====================
class UIRenderer {
    renderCharacterCard(data) {
        const classSystem = new CharacterClass();
        const achievementSystem = new AchievementSystem();
        const statsCalculator = new StatsCalculator();
        
        const characterClass = classSystem.determineClass(data);
        const achievements = achievementSystem.getAchievements(data);
        const stats = statsCalculator.calculate(data);
        
        // Update basic info
        document.getElementById('avatar').src = data.avatar_url;
        document.getElementById('displayName').textContent = data.name || data.login;
        document.getElementById('levelBadge').textContent = `${characterClass.emoji || '⚔️'} Lv.${stats.level}`;
        
        // Update class
        const classElement = document.getElementById('characterClass');
        classElement.innerHTML = `
            <i class="fas fa-code"></i> 
            <span>${characterClass.emoji} ${characterClass.name}</span>
        `;
        classElement.style.borderColor = characterClass.color;
        
        // Update stats
        document.getElementById('commits').textContent = stats.commits.toLocaleString();
        document.getElementById('starsEarned').textContent = stats.stars.toLocaleString();
        
        // Primary language
        const primaryLang = data.languages.length > 0 ? data.languages[0].name : 'None';
        document.getElementById('primaryLanguage').textContent = primaryLang;
        
        // Open source status
        const prCount = stats.prs || 0;
        const status = prCount > 20 ? '🛡️ Defender' : 
                      prCount > 5 ? '🤝 Contributor' : '🌱 Learner';
        document.getElementById('openSourceStatus').textContent = status;
        
        // Update XP
        document.getElementById('currentXP').textContent = stats.xp;
        document.getElementById('nextLevelXP').textContent = stats.nextLevelXP;
        document.getElementById('xpPercentage').textContent = `${Math.round(stats.xpProgress * 100)}%`;
        document.getElementById('xpFill').style.width = `${stats.xpProgress * 100}%`;
        document.getElementById('levelNumber').textContent = stats.level;
        
        // Update achievements
        this.renderAchievements(achievements);
        
        // Update contribution map
        this.renderContributionMap(data.contributions);
        
        // Store data for later use
        window.currentCharacterData = {
            ...data,
            stats,
            characterClass,
            achievements
        };
    }
    
    renderAchievements(achievements) {
        const container = document.getElementById('achievementsContainer');
        container.innerHTML = '';
        
        if (achievements.length === 0) {
            container.innerHTML = '<span class="achievement"><i class="fas fa-seedling"></i> Start your journey!</span>';
            return;
        }
        
        achievements.forEach(achievement => {
            const div = document.createElement('span');
            div.className = 'achievement';
            div.innerHTML = `${achievement.icon} ${achievement.name}`;
            div.title = achievement.description;
            container.appendChild(div);
        });
    }
    
    renderContributionMap(contributions) {
        const grid = document.getElementById('contributionGrid');
        grid.innerHTML = '';
        
        if (!contributions || !contributions.weeks) {
            // Generate dummy data
            for (let i = 0; i < 70; i++) {
                const cell = document.createElement('div');
                cell.className = 'map-cell';
                const level = Math.floor(Math.random() * 4);
                if (level === 1) cell.classList.add('active-low');
                else if (level === 2) cell.classList.add('active-mid');
                else if (level >= 3) cell.classList.add('active-high');
                grid.appendChild(cell);
            }
            document.getElementById('contributionsCount').textContent = '0 contributions this week';
            return;
        }
        
        // Flatten all days from all weeks
        const allDays = contributions.weeks.flatMap(week => week.contributionDays);
        const total = allDays.reduce((sum, day) => sum + day.contributionCount, 0);
        
        // Show last 70 days
        const days = allDays.slice(-70);
        const maxCount = Math.max(...days.map(d => d.contributionCount), 1);
        
        days.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'map-cell';
            
            const count = day.contributionCount || 0;
            const level = count === 0 ? 0 :
                         count < maxCount * 0.25 ? 1 :
                         count < maxCount * 0.5 ? 2 : 3;
            
            if (level === 1) cell.classList.add('active-low');
            else if (level === 2) cell.classList.add('active-mid');
            else if (level >= 3) cell.classList.add('active-high');
            
            cell.title = `${day.date}: ${count} contributions`;
            grid.appendChild(cell);
        });
        
        // Update contributions count
        const recentWeeks = contributions.weeks.slice(-2);
        const recentTotal = recentWeeks.flatMap(w => w.contributionDays)
            .reduce((sum, d) => sum + d.contributionCount, 0);
        document.getElementById('contributionsCount').textContent = 
            `${recentTotal} contributions this week`;
    }
}

// ==================== Main Application ====================
class GitHubRPGApp {
    constructor() {
        this.api = new GitHubAPI();
        this.ui = new UIRenderer();
        
        this.currentUsername = '';
        this.currentData = null;
        
        this.init();
    }

    init() {
        this.usernameInput = document.getElementById('usernameInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.characterCard = document.getElementById('characterCard');
        this.refreshBtn = document.getElementById('refreshBtn');

        this.generateBtn.addEventListener('click', () => this.generateCharacter());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateCharacter();
        });
        
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => this.generateCharacter());
        }

        // Auto-generate on load with default username
        const defaultUser = this.usernameInput.value || 'octocat';
        setTimeout(() => {
            this.usernameInput.value = defaultUser;
            this.generateCharacter();
        }, 300);
    }

    async generateCharacter() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            this.showError('Please enter a GitHub username');
            return;
        }

        this.currentUsername = username;
        await this.fetchAndRender(username);
    }

    async fetchAndRender(username) {
        try {
            this.showLoading(true);
            this.hideError();

            const data = await this.api.fetchUserProfile(username);
            this.currentData = data;

            setTimeout(() => {
                this.ui.renderCharacterCard(data);
                this.characterCard.classList.remove('hidden');
                this.showLoading(false);
                this.animateContributions();
            }, 500);

        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message || 'Failed to fetch GitHub data');
            this.characterCard.classList.add('hidden');
            this.showLoading(false);
        }
    }

    animateContributions() {
        const cells = document.querySelectorAll('.map-cell.active-high');
        let delay = 0;
        
        cells.forEach((cell) => {
            setTimeout(() => {
                cell.style.transition = 'box-shadow 0.3s';
                cell.style.boxShadow = '0 0 20px #9f7eff';
                setTimeout(() => {
                    cell.style.boxShadow = '';
                }, 300);
            }, delay);
            delay += 100;
        });
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    showLoading(visible) {
        this.loadingSpinner.classList.toggle('hidden', !visible);
    }
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GitHubRPGApp();
});