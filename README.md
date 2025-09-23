# 🧠 WhatsApp Second Brain - AI-Powered Knowledge Management System

A comprehensive **Second Brain** knowledge management system with **WhatsApp Bot Integration**, designed to help you capture, organize, and interact with your thoughts, tasks, and projects through an intelligent WhatsApp interface.

## 🌟 What is this project?

This is an advanced **Personal Knowledge Management System** (Second Brain) that combines:
- **📱 WhatsApp Bot Integration** - Manage your knowledge through WhatsApp messages
- **🧠 AI-Powered Assistance** - Smart content generation and insights
- **📊 Interactive Dashboard** - Beautiful Bento-style dashboard for data visualization
- **🌐 Knowledge Graph** - Visual representation of connections between your ideas
- **⚡ Real-time Sync** - Instant updates via WebSocket connections
- **🎯 Spaced Repetition Learning** - Built-in learning system for knowledge retention

## ✨ Core Features

### 📱 WhatsApp Bot Integration
- **QR Code Optimization** - Fast WhatsApp connection with optimized QR generation
- **Natural Language Commands** - Control your knowledge base through WhatsApp messages
- **Bilingual Support** - Commands in English and Bahasa Malaysia
- **Smart Notifications** - Get reminders and updates directly on WhatsApp
- **Real-time Sync** - Instant synchronization between web app and WhatsApp

### 🧠 Knowledge Management
- **📝 Notes System** - Capture ideas, references, and insights
- **✅ Task Management** - Create and track tasks with priorities and due dates
- **🚀 Project Organization** - Manage projects with linked notes and tasks
- **🏷️ Smart Tagging** - AI-powered tag suggestions and organization
- **🔗 Bi-directional Links** - Connect related notes and ideas
- **📈 Spaced Repetition** - Learn and retain information effectively

### 🤖 AI Integration
- **💬 AI Chat Assistant** - Intelligent conversation about your knowledge base
- **📊 Content Generation** - AI-powered content creation and summarization
- **🏷️ Auto-tagging** - Automatic tag generation for content
- **🔍 Smart Search** - AI-enhanced search across all your content
- **💡 Insights** - AI-generated insights and connections

### 📊 Dashboard & Visualization
- **🎨 Bento Dashboard** - Modern, card-based interface
- **🌐 Knowledge Graph** - Interactive network visualization of your knowledge
- **📈 Analytics** - Track your productivity and learning progress
- **🔔 Notifications** - Stay updated with important events

## 🛠️ Technology Stack

### 🏗️ Frontend & Framework
- **⚡ Next.js 15** - React framework with App Router
- **🔷 TypeScript** - Full type safety
- **🎨 Tailwind CSS** - Utility-first CSS framework
- **🎭 shadcn/ui** - Modern, accessible UI components
- **🎬 Framer Motion** - Smooth animations and transitions

### 🗄️ Backend & Database
- **🗄️ Prisma** - Type-safe ORM with SQLite database
- **📡 Socket.IO** - Real-time WebSocket communication
- **🔌 Custom Server** - Node.js server with Next.js integration
- **🌐 RESTful APIs** - Comprehensive API endpoints

### 📱 WhatsApp Integration
- **📱 @whiskeysockets/baileys** - WhatsApp Web API
- **📱 QR Code Generation** - Optimized connection process
- **🔔 Real-time Notifications** - Instant message delivery
- **💾 Session Management** - Persistent WhatsApp sessions

### 🤖 AI & Intelligence
- **🧠 Z.ai SDK** - AI-powered development and content generation
- **🔍 Semantic Search** - Intelligent content discovery
- **📊 Content Analysis** - AI-driven insights and summarization
- **🏷️ Auto-categorization** - Smart content organization

### 🎨 UI & UX Libraries
- **📊 Recharts** - Data visualization and charts
- **🖱️ DND Kit** - Drag and drop functionality
- **📋 TanStack Table** - Advanced data tables
- **📋 React Hook Form** - Form management with Zod validation
- **🎯 Lucide React** - Beautiful icons
- **🍞 Sonner** - Toast notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cornmankl/whatsapp-qr-optimizer.git
   cd whatsapp-qr-optimizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 WhatsApp Bot Setup

### Quick Setup
1. Open the application dashboard
2. Navigate to the "WhatsApp Bot" tab
3. Click "Generate QR Code"
4. Scan the QR code with WhatsApp (Settings → Linked Devices → Link a Device)
5. Start sending commands to your bot!

### Available WhatsApp Commands

#### 📝 Note Commands
- `note create [title] - [content]` - Create a new note
- `catatan create [title] - [content]` - Create note (Bahasa Malaysia)
- `note list` - List all notes
- `catatan list` - List notes (Bahasa Malaysia)

#### ✅ Task Commands
- `task create [title] - [description]` - Create a new task
- `tugas create [title] - [description]` - Create task (Bahasa Malaysia)
- `task list` - List all tasks
- `task complete [id]` - Mark task as complete

#### 🚀 Project Commands
- `project create [name] - [description]` - Create a new project
- `projek create [name] - [description]` - Create project (Bahasa Malaysia)
- `project list` - List active projects

#### 🔍 Search Commands
- `search [keywords]` - Search across all content
- `cari [keywords]` - Search (Bahasa Malaysia)

#### 🤖 AI Commands
- `ai [question]` - Ask AI about your knowledge base
- `help` - Show all available commands

## 📊 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   │   ├── ai/                   # AI-related endpoints
│   │   ├── notes/                # Notes CRUD operations
│   │   ├── tasks/                # Task management
│   │   ├── projects/             # Project management
│   │   ├── whatsapp/             # WhatsApp bot endpoints
│   │   └── whatsapp-qr/          # QR code generation
│   ├── page.tsx                  # Main application page
│   └── layout.tsx                # App layout and metadata
├── components/                   # React components
│   ├── ai/                       # AI assistant components
│   ├── dashboard/                # Dashboard components
│   ├── knowledge-graph/          # Graph visualization
│   ├── whatsapp/                 # WhatsApp bot UI
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utility libraries
│   ├── whatsapp/                 # WhatsApp bot logic
│   ├── db.ts                     # Database configuration
│   ├── socket.ts                 # WebSocket setup
│   └── notifications.ts          # Notification service
└── hooks/                        # Custom React hooks

prisma/
└── schema.prisma                 # Database schema

server.ts                         # Custom Next.js server with Socket.IO
```

## 🗄️ Database Schema

The application uses **Prisma** with **SQLite** for data persistence:

- **Users** - User management and authentication
- **Notes** - Knowledge base entries with types (IDEA, NOTE, REFERENCE, INSIGHT, QUESTION)
- **Tasks** - Task management with status tracking
- **Projects** - Project organization with linked notes and tasks
- **Tags** - Content categorization and organization
- **SpacedRep** - Spaced repetition learning system
- **Links** - Bi-directional note connections

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
```

### WhatsApp Bot Configuration
- Session data stored in `whatsapp-sessions/` directory
- QR codes automatically generated and cached
- Support for multiple concurrent sessions
- Real-time connection status via WebSocket

## 🤖 AI Features

### Content Generation
- **Smart Summaries** - AI-generated content summaries
- **Tag Suggestions** - Intelligent tag recommendations
- **Content Enhancement** - AI-powered content improvement

### Chat Assistant
- **Context-Aware** - Understands your knowledge base
- **Multi-turn Conversations** - Maintains conversation context
- **Knowledge Integration** - Answers based on your personal data

## 📈 Performance Optimizations

### WhatsApp QR Code Optimization
- **Instant QR Generation** - Optimized for speed (< 3 seconds)
- **Automatic Retry Logic** - Smart error handling and recovery
- **Connection Caching** - Persistent session management
- **Real-time Updates** - WebSocket-based status updates

### Application Performance
- **Server-Side Rendering** - Fast initial page loads
- **Real-time Sync** - WebSocket integration for instant updates
- **Optimized Queries** - Efficient database operations with Prisma
- **Component Lazy Loading** - Reduced bundle sizes

## 🔮 Future Enhancements

- **📱 Mobile App** - Native mobile applications
- **🔄 Multi-platform Sync** - Telegram, Discord bot integration
- **📊 Advanced Analytics** - Detailed productivity insights
- **🌍 Cloud Sync** - Multi-device synchronization
- **🎙️ Voice Notes** - Audio note support
- **📸 Image Recognition** - OCR and image analysis
- **🔗 External Integrations** - Notion, Obsidian import/export

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ for knowledge workers and lifelong learners.**
*Powered by WhatsApp Bot Integration and AI Intelligence* 🤖📱
