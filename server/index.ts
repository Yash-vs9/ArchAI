import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const app = express();
const port = process.env.PORT || 3001;
const FRONTEND_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] }
});

const TOTAL_QUESTIONS = 14;

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('start_interview', async (data) => {
        try {
            const { processInterviewStep, clearSession } = await import('./agents/interviewAgent');
            const sessionId = data?.sessionId || socket.id;
            clearSession(sessionId);
            const response = await processInterviewStep(sessionId, null);
            if (response) socket.emit('agent_message', { text: response.text, isComplete: response.isComplete, questionData: response.questionData });
        } catch (error) {
            console.error("Error starting interview:", error);
            socket.emit('agent_message', { text: "Failed to start interview. Check API key." });
        }
    });

    socket.on('restore_interview', async (data) => {
        try {
            const { processInterviewStep, restoreSession } = await import('./agents/interviewAgent');
            const sessionId = data.sessionId || socket.id;
            restoreSession(sessionId, data.messages || []);
            const response = await processInterviewStep(sessionId, null, true);
            if (response) socket.emit('agent_message', { text: response.text, isComplete: response.isComplete, questionData: response.questionData });
        } catch (error) {
            console.error("Error restoring interview:", error);
            socket.emit('agent_message', { text: "Session error. Please check your API key." });
        }
    });

    socket.on('user_message', async (data) => {
        console.log('User message received:', data.text);
        try {
            const { processInterviewStep } = await import('./agents/interviewAgent');
            const sessionId = data.sessionId || socket.id;

            const isFinalAnswer = data.currentStep >= TOTAL_QUESTIONS;
            if (isFinalAnswer) {
                socket.emit('generate_canvas_start');
                socket.emit('agent_message', { text: "Great, I have everything I need. Generating your architecture now...", isComplete: false });
            }

            const response = await processInterviewStep(sessionId, data.text);
            console.log('Response:', { isComplete: response?.isComplete, hasArch: !!response?.architecture, isUpdate: response?.isUpdate });

            if (!response) {
                if (isFinalAnswer) socket.emit('generate_canvas_error');
                return;
            }

            if (response.isComplete && response.architecture) {
                if (response.isUpdate) {
                    socket.emit('generate_canvas_start');
                    socket.emit('agent_message', { text: response.text, isComplete: true, questionData: response.questionData });
                }
                socket.emit('generate_canvas_success', response.architecture);
            } else if (response.isComplete && !response.architecture) {
                socket.emit('generate_canvas_error');
                socket.emit('agent_message', { text: response.text, isComplete: response.isComplete, questionData: response.questionData });
            } else {
                socket.emit('agent_message', { text: response.text, isComplete: response.isComplete, questionData: response.questionData });
            }
        } catch (error) {
            console.error("Error processing message:", error);
            socket.emit('agent_message', { text: "Error processing your answer." });
            socket.emit('generate_canvas_error');
        }
    });

    socket.on('generate_guide', async (data) => {
        console.log('Guide generation requested:', data.sessionId);
        try {
            const { generateGuide } = await import('./agents/architectureGenerator');
            const { getSession } = await import('./agents/interviewAgent');
            const session = getSession(data.sessionId);
            if (!session?.currentArchitecture) {
                socket.emit('guide_error', { message: "No architecture found. Generate an architecture first." });
                return;
            }
            socket.emit('guide_start');
            const guide = await generateGuide(session.answers, session.currentArchitecture);
            socket.emit('guide_success', { guide });
        } catch (error) {
            console.error("Guide generation failed:", error);
            socket.emit('guide_error', { message: "Failed to generate guide. Please try again." });
        }
    });

    socket.on('scaffold_github', async (data: { sessionId: string; token: string; repoName: string; isPrivate: boolean }) => {
        console.log('GitHub scaffold requested:', data.repoName);
        try {
            const { getSession } = await import('./agents/interviewAgent');
            const session = getSession(data.sessionId);
    
            if (!session?.currentArchitecture) {
                socket.emit('scaffold_error', { message: "No architecture found. Generate an architecture first." });
                return;
            }
    
            // Step 1: Get folder structure directly from architecture summary — no LLM needed
            socket.emit('scaffold_status', { step: 'generating' });
    
            const folderStructure: string[] = session.currentArchitecture.summary?.folderStructure || [];
    
            // Build file list: for each folder create a .gitkeep, for each file create an empty file
            const files: { path: string; content: string }[] = [];
    
            for (const entry of folderStructure) {
                const trimmed = entry.trim();
                if (!trimmed) continue;
    
                if (trimmed.endsWith('/')) {
                    // It's a folder — add .gitkeep so GitHub shows it
                    files.push({ path: `${trimmed}.gitkeep`, content: '' });
                } else {
                    // It's a file — create it empty
                    files.push({ path: trimmed, content: `# ${trimmed}\n` });
                }
            }
    
            // Always add a basic README and .gitignore
            files.push({
                path: 'README.md',
                content: `# ${data.repoName}\n\nGenerated by [DevArchitect AI](https://github.com)\n\n## Folder Structure\n\n\`\`\`\n${folderStructure.join('\n')}\n\`\`\`\n`
            });
            files.push({
                path: '.gitignore',
                content: 'node_modules/\n.env\n.env.local\ndist/\n.next/\ntarget/\n*.class\n'
            });
            files.push({
                path: '.env.example',
                content: '# Copy this file to .env and fill in your values\nPORT=3000\nDB_URL=\nJWT_SECRET=\n'
            });
    
            // Step 2: Create GitHub repo
            socket.emit('scaffold_status', { step: 'creating_repo' });
    
            const createRepoRes = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.repoName,
                    private: data.isPrivate,
                    description: `Generated by DevArchitect AI`,
                    auto_init: false,
                })
            });
    
            if (!createRepoRes.ok) {
                const err = await createRepoRes.json() as any;
                throw new Error(err.message || "Failed to create GitHub repository.");
            }
    
            const repo = await createRepoRes.json() as any;
    
            // Step 3: Push files
            socket.emit('scaffold_status', { step: 'pushing_files' });
    
            for (const file of files) {
                const encoded = Buffer.from(file.content, 'utf-8').toString('base64');
                await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${file.path}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${data.token}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: `scaffold: add ${file.path}`,
                        content: encoded,
                    })
                });
            }
    
            socket.emit('scaffold_success', { repoUrl: repo.html_url });
    
        } catch (error: any) {
            console.error("GitHub scaffold failed:", error);
            socket.emit('scaffold_error', { message: error?.message || "Failed to scaffold repository." });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        import('./agents/interviewAgent').then(m => m.clearSession(socket.id)).catch(() => { });
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

httpServer.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});