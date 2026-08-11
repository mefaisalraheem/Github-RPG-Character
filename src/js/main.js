/**
 * GitHub RPG Character - Main Application
 * @version 1.0.0
 */

import { GitHubAPI } from './api/github.js';
import { CharacterClass } from './character/class.js';
import { CharacterStats } from './character/stats.js';
import { AchievementSystem } from './character/achievements.js';
import { UIRenderer } from './ui/renderer.js';
import { Animations } from './ui/animations.js';

class GitHubRPGApp {
    constructor() {
        this.api = new GitHubAPI();
        this.classSystem = new CharacterClass();
        this.statsCalculator = new CharacterStats();
        this.achievementSystem = new AchievementSystem();
        this.ui = new UIRenderer();
        this.animations = new Animations();
        
        this.currentUsername = '';
        this.currentData = null;
        
        this.init();
    }

    init() {
        // DOM Elements
        this.usernameInput = document.getElementById('usernameInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.characterCard = document.getElementById('characterCard');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.downloadBtn = document.getElementById('downloadBtn');

        // Event Listeners
        this.generateBtn.addEventListener('click', () => this.generateCharacter());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateCharacter();
        });
        this.refreshBtn.addEventListener('click', () => this.refreshCharacter());
        this.shareBtn.addEventListener('click', () => this.shareCharacter());
        this.downloadBtn.addEventListener('click', () => this.downloadCard());

        // Load from URL parameter
        this.loadFromURL();
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

            // Fetch GitHub data
            const data = await this.api.fetchUserProfile(username);
            this.currentData = data;

            // Calculate character stats
            const stats = this.statsCalculator.calculate(data);
            const characterClass = this.classSystem.determineClass(data);
            const achievements = this.achievementSystem.getAchievements(data);
            const levelInfo = this.statsCalculator.getLevelInfo(stats.xp);

            // Render the character card
            this.ui.renderCharacterCard({
                ...data,
                stats,
                characterClass,
                achievements,
                levelInfo
            });

            this.characterCard.classList.remove('hidden');
            this.animations.playRevealAnimation();

        } catch (error) {
            this.showError(error.message);
            this.characterCard.classList.add('hidden');
        } finally {
            this.showLoading(false);
        }
    }

    async refreshCharacter() {
        if (this.currentUsername) {
            await this.fetchAndRender(this.currentUsername);
        }
    }

    shareCharacter() {
        const card = document.querySelector('.rpg-card');
        if (!card) return;

        // Use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'GitHub RPG Character',
                text: `Check out my GitHub RPG character! I'm a ${this.currentData?.characterClass?.name || 'developer'} on GitHub.`,
                url: window.location.href
            }).catch(() => {});
        } else {
            // Fallback: copy to clipboard
            const text = this.generateShareText();
            navigator.clipboard.writeText(text).then(() => {
                this.showError('Copied to clipboard!', 'success');
            }).catch(() => {
                this.showError('Could not share. Please copy the URL manually.');
            });
        }
    }

    generateShareText() {
        const data = this.currentData;
        if (!data) return '';
        return `🎮 GitHub RPG Character\n` +
               `👤 ${data.name || data.login}\n` +
               `⚔️ Level ${data.levelInfo?.level || 1} ${data.characterClass?.name || 'Developer'}\n` +
               `🔥 ${data.stats?.commits || 0} commits\n` +
               `⭐ ${data.stats?.stars || 0} stars earned\n` +
               `🏆 ${data.achievements?.length || 0} achievements\n` +
               `🔗 ${window.location.href}`;
    }

    downloadCard() {
        const card = document.querySelector('.rpg-card');
        if (!card) return;

        // Use html2canvas or simple screenshot
        // For now, redirect to a print-friendly version
        window.print();
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const username = params.get('user');
        if (username) {
            this.usernameInput.value = username;
            this.generateCharacter();
        }
    }

    showError(message, type = 'error') {
        this.errorMessage.textContent = message;
        this.errorMessage.className = 'error-message';
        if (type === 'success') {
            this.errorMessage.style.background = '#2ecc71';
        } else {
            this.errorMessage.style.background = '#ff4757';
        }
        this.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    showLoading(visible) {
        this.loadingSpinner.classList.toggle('hidden', !visible);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GitHubRPGApp();
});