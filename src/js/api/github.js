/**
 * GitHub API Integration
 * @version 1.0.0
 */

export class GitHubAPI {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.token = localStorage.getItem('github_token') || import.meta.env?.VITE_GITHUB_TOKEN || '';
        this.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-RPG-Character/1.0'
        };

        if (this.token) {
            this.headers['Authorization'] = `token ${this.token}`;
        }
    }

    async fetchUserProfile(username) {
        try {
            // Rate limit check
            const rateLimit = await this.checkRateLimit();
            if (rateLimit.remaining === 0) {
                throw new Error(`API rate limit exceeded. Reset at ${new Date(rateLimit.reset * 1000).toLocaleTimeString()}`);
            }

            // Fetch user data
            const user = await this.fetchUser(username);
            const repos = await this.fetchRepos(username);
            const events = await this.fetchEvents(username);
            const languages = this.calculateLanguages(repos);
            
            // Calculate stats from events and repos
            const commits = this.countCommits(events);
            const prs = this.countPullRequests(events);
            const issues = this.countIssues(events);
            const stars = this.countStars(repos);

            // Get contribution calendar data
            const contributions = await this.fetchContributions(username);

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
                repos: repos.slice(0, 10), // Top 10 repos
                stats: {
                    commits,
                    prs,
                    issues,
                    stars,
                    totalRepos: repos.length
                },
                contributions,
                events
            };
        } catch (error) {
            if (error.status === 404) {
                throw new Error(`User "${username}" not found on GitHub`);
            }
            if (error.status === 403) {
                throw new Error('API rate limit exceeded. Please try again later.');
            }
            throw new Error(`Failed to fetch GitHub data: ${error.message}`);
        }
    }

    async fetchUser(username) {
        const response = await fetch(`${this.baseURL}/users/${username}`, {
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
        const response = await fetch(
            `${this.baseURL}/users/${username}/repos?per_page=100&sort=updated`,
            { headers: this.headers }
        );
        
        if (!response.ok) {
            throw new Error(`Failed to fetch repositories: ${response.status}`);
        }
        
        return response.json();
    }

    async fetchEvents(username) {
        const response = await fetch(
            `${this.baseURL}/users/${username}/events?per_page=100`,
            { headers: this.headers }
        );
        
        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        return response.json();
    }

    async fetchContributions(username) {
        // Using GitHub GraphQL API for contribution calendar
        try {
            const query = `
                query {
                    user(login: "${username}") {
                        contributionsCollection {
                            contributionCalendar {
                                totalContributions
                                weeks {
                                    contributionDays {
                                        date
                                        contributionCount
                                        color
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const response = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error(`GraphQL request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.data.user.contributionsCollection.contributionCalendar;
        } catch (error) {
            console.warn('Failed to fetch contribution data:', error);
            // Fallback to simulated data
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

        const languages = Object.entries(langMap)
            .map(([name, count]) => ({
                name,
                count,
                percentage: (count / total) * 100
            }))
            .sort((a, b) => b.count - a.count);

        return languages;
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

    async checkRateLimit() {
        const response = await fetch(`${this.baseURL}/rate_limit`, {
            headers: this.headers
        });
        
        if (!response.ok) {
            throw new Error('Failed to check rate limit');
        }
        
        const data = await response.json();
        return data.resources.core;
    }

    generateFallbackContributions() {
        const weeks = [];
        const today = new Date();
        
        for (let w = 0; w < 12; w++) {
            const days = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (w * 7 + d));
                days.push({
                    date: date.toISOString().split('T')[0],
                    contributionCount: Math.floor(Math.random() * 10),
                    color: '#2ea043'
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