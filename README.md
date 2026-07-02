# DevBoard // HUD

![Dashboard Preview](https://via.placeholder.com/1200x600?text=DevBoard+HUD+Dashboard+Preview)

A highly polished, premium SaaS developer dashboard designed to track coding metrics, manage projects, and analyze learning progress in one unified workspace.

## 🚀 Features

*   **Unified Developer Metrics:** Seamlessly track your GitHub activity, LeetCode solves, and Codeforces ratings all in one place.
*   **Project Tracker & Session Timer:** Log your active coding hours against specific projects. Start a session timer to track deep work directly to your shipped codebases.
*   **AI Diagnostics:** Generate summarized performance diagnostics and synthesize your weekly coding metrics using AI.
*   **Premium SaaS UI:** A sleek, fully responsive light-theme aesthetic built with Tailwind CSS, featuring micro-animations powered by Framer Motion.
*   **Secure Authentication:** GitHub OAuth integration with Supabase for secure, seamless login.
*   **GDPR Compliant Data Management:** Full control over your data with built-in "Danger Zone" account reset and data purging functionalities.

## 🛠️ Tech Stack

*   **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security)
*   **Icons:** [Lucide React](https://lucide.dev/)

## ⚙️ Getting Started

### Prerequisites

*   Node.js 18+
*   A Supabase project (for database and authentication)
*   GitHub OAuth App credentials

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/rdhruva2006/Dev-Board.git
    cd Dev-Board
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open the application**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/rdhruva2006/Dev-Board/issues).

## 📄 License

This project is licensed under the MIT License.
