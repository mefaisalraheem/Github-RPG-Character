# 🎮 GitHub RPG Character

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

> Transform any GitHub profile into an epic RPG character! ⚔️

## ✨ Features

- 🎯 **Instant Character Generation** - Paste any GitHub username and get an RPG character
- 📊 **Real GitHub Stats** - Fetches real data from GitHub API
- 🏆 **Dynamic Achievements** - Earn achievements based on your activity
- 🗺️ **Contribution Heatmap** - Visual representation of your coding activity
- 🎨 **Shareable Profile Cards** - Generate and share your RPG character card
- 🌙 **Dark Theme** - Built for the night coders

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/github-rpg-character.git

# Navigate to project directory
cd github-rpg-character

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Add your GitHub token to .env
# GITHUB_TOKEN=your_personal_access_token

# Start development server
npm run dev

Usage
Open http://localhost:3000 in your browser

Enter a GitHub username

Watch your RPG character come to life!

🎯 Character Classes
Your GitHub activity determines your class:

Class	Requirements
🗡️ Full-Stack Knight	1000+ commits, multiple languages
🧙 TypeScript Wizard	70%+ TypeScript code
🛡️ Open Source Defender	50+ PRs to external repos
⚡ Hackathon Hero	5+ hackathon projects
🐍 Python Alchemist	80%+ Python code
📊 Stats & Progression
XP System: Earn XP from commits, PRs, stars, and issues

Level Up: Every 1000 XP = 1 level

Achievements: Unlock special badges for milestones

🛠️ Tech Stack
Frontend: Vanilla JS + HTML5 + CSS3

API: GitHub REST API v3

Deployment: Docker + GitHub Pages

Testing: Jest + Puppeteer

📁 Project Structure



github-rpg-character/
├── src/               # Source code
│   ├── index.html     # Main HTML
│   ├── css/          # Styles
│   ├── js/           # JavaScript
│   └── assets/       # Images & fonts
├── tests/            # Test files
├── docs/             # Documentation
└── config/           # Configuration files



🚢 Deployment
Docker (Recommended)
bash
# Build Docker image
docker build -t github-rpg .

# Run container
docker run -p 3000:3000 github-rpg
GitHub Pages
bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy


🤝 Contributing
We welcome contributions! Please see CONTRIBUTING.md for guidelines.

📝 License
This project is licensed under the MIT License - see LICENSE for details.

🙏 Acknowledgments

GitHub API for making this possible

All open source contributors

RPG game designers for inspiration


