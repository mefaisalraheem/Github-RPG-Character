/**
 * Character Class System
 * @version 1.0.0
 */

export class CharacterClass {
    constructor() {
        this.classes = {
            'full_stack_knight': {
                id: 'full_stack_knight',
                name: 'Full-Stack Knight',
                icon: '⚔️',
                description: 'Master of both frontend and backend',
                requirements: {
                    minCommits: 1000,
                    minLanguages: 3,
                    minRepos: 20
                },
                color: '#ff6b6b'
            },
            'typescript_wizard': {
                id: 'typescript_wizard',
                name: 'TypeScript Wizard',
                icon: '🧙',
                description: 'Casts spells with type safety',
                requirements: {
                    languagePercentage: 70,
                    language: 'TypeScript'
                },
                color: '#3178c6'
            },
            'open_source_defender': {
                id: 'open_source_defender',
                name: 'Open Source Defender',
                icon: '🛡️',
                description: 'Protects and improves open source projects',
                requirements: {
                    minPRs: 50,
                    externalRepos: 5
                },
                color: '#2ea043'
            },
            'hackathon_hero': {
                id: 'hackathon_hero',
                name: 'Hackathon Hero',
                icon: '⚡',
                description: 'Thrives in coding competitions',
                requirements: {
                    minHackathonProjects: 5
                },
                color: '#f7d44a'
            },
            'python_alchemist': {
                id: 'python_alchemist',
                name: 'Python Alchemist',
                icon: '🐍',
                description: 'Transforms data with Python',
                requirements: {
                    languagePercentage: 80,
                    language: 'Python'
                },
                color: '#3776ab'
            },
            'javascript_ninja': {
                id: 'javascript_ninja',
                name: 'JavaScript Ninja',
                icon: '🥷',
                description: 'Stealthy and precise with JS',
                requirements: {
                    languagePercentage: 70,
                    language: 'JavaScript'
                },
                color: '#f7df1e'
            },
            'rust_engineer': {
                id: 'rust_engineer',
                name: 'Rust Engineer',
                icon: '🦀',
                description: 'Builds memory-safe systems',
                requirements: {
                    languagePercentage: 60,
                    language: 'Rust'
                },
                color: '#dea584'
            },
            'devops_architect': {
                id: 'devops_architect',
                name: 'DevOps Architect',
                icon: '🏗️',
                description: 'Designs robust CI/CD pipelines',
                requirements: {
                    hasDockerfile: true,
                    hasWorkflow: true
                },
                color: '#2496ed'
            },
            'data_scientist': {
                id: 'data_scientist',
                name: 'Data Scientist',
                icon: '📊',
                description: 'Extracts insights from data',
                requirements: {
                    languagePercentage: 50,
                    language: 'Python',
                    hasJupyter: true
                },
                color: '#f37626'
            },
            'beginner_adventurer': {
                id: 'beginner_adventurer',
                name: 'Beginner Adventurer',
                icon: '🌱',
                description: 'Starting the coding journey',
                requirements: {},
                color: '#58a6ff'
            }
        };
    }

    determineClass(data) {
        const scores = {};
        let highestScore = 0;
        let bestClass = this.classes.beginner_adventurer;

        for (const [id, classDef] of Object.entries(this.classes)) {
            const score = this.calculateClassScore(data, classDef);
            scores[id] = score;
            
            if (score > highestScore) {
                highestScore = score;
                bestClass = classDef;
            }
        }

        // If score is too low, default to beginner
        if (highestScore < 0.3) {
            bestClass = this.classes.beginner_adventurer;
        }

        return {
            ...bestClass,
            score: highestScore,
            scores
        };
    }

    calculateClassScore(data, classDef) {
        let score = 0;
        const totalRequirements = Object.keys(classDef.requirements).length;

        for (const [req, value] of Object.entries(classDef.requirements)) {
            const met = this.checkRequirement(data, req, value);
            if (met) {
                score += 1 / totalRequirements;
            }
        }

        // Bonus for multiple languages
        if (data.languages && data.languages.length >= 3) {
            score += 0.2;
        }

        // Bonus for activity
        if (data.stats && data.stats.commits > 500) {
            score += 0.2;
        }

        return Math.min(score, 1);
    }

    checkRequirement(data, requirement, value) {
        switch (requirement) {
            case 'minCommits':
                return (data.stats?.commits || 0) >= value;
            case 'minLanguages':
                return (data.languages?.length || 0) >= value;
            case 'minRepos':
                return (data.stats?.totalRepos || 0) >= value;
            case 'minPRs':
                return (data.stats?.prs || 0) >= value;
            case 'minHackathonProjects':
                return this.countHackathonProjects(data) >= value;
            case 'languagePercentage':
                const lang = data.languages?.find(l => l.name === classDef.requirements.language);
                return (lang?.percentage || 0) >= value;
            case 'externalRepos':
                return this.countExternalRepos(data) >= value;
            case 'hasDockerfile':
                return this.hasFile(data, 'Dockerfile');
            case 'hasWorkflow':
                return this.hasFile(data, '.github/workflows');
            case 'hasJupyter':
                return this.hasFile(data, '.ipynb');
            default:
                return false;
        }
    }

    countHackathonProjects(data) {
        // Heuristic: look for repos with "hackathon" in name/description
        return data.repos?.filter(repo => {
            const text = (repo.name + repo.description || '').toLowerCase();
            return text.includes('hackathon');
        }).length || 0;
    }

    countExternalRepos(data) {
        // Assume repos not owned by user are external
        return data.repos?.filter(repo => 
            !repo.fork && repo.owner.login !== data.login
        ).length || 0;
    }

    hasFile(data, filename) {
        // Check if any repo contains the file
        return data.repos?.some(repo => 
            repo.name.includes(filename) || 
            (repo.description && repo.description.includes(filename))
        ) || false;
    }

    getClassIcon(classId) {
        return this.classes[classId]?.icon || '🎮';
    }

    getClassColor(classId) {
        return this.classes[classId]?.color || '#58a6ff';
    }
}