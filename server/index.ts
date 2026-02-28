import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local if running standalone
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const app = express();
const port = process.env.PORT || 3001;

// Next.js will run on port 3000
const FRONTEND_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('start_interview', async () => {
        try {
            const { processInterviewStep, clearSession } = await import('./agents/interviewAgent');
            clearSession(socket.id); // clear any existing session
            const response = await processInterviewStep(socket.id, null);
            if (response) {
                socket.emit('agent_message', { text: response.text, isComplete: response.isComplete, questionData: response.questionData });
            }
        } catch (error) {
            console.error("Error starting interview:", error);
            socket.emit('agent_message', { text: "Failed to start interview. Check API key." });
        }
    });

    socket.on('restore_interview', async (data) => {
        try {
            const { processInterviewStep, restoreSession } = await import('./agents/interviewAgent');
            const sessionId = data.sessionId || socket.id;
            const messages = data.messages || [];

            // Attempt to restore history first
            restoreSession(sessionId, messages);

            // Attempt to restore or start
            const response = await processInterviewStep(sessionId, null, true); // true = isRestore
            if (response) {
                socket.emit('agent_message', { text: response.text, isComplete: response.isComplete, questionData: response.questionData });
            }
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

            // Check if it's the final answer bridging to generation
            const isJustGenerated = data.text.trim() === ''; // not perfectly robust, but we will pass the architecture straight away

            const response = await processInterviewStep(sessionId, data.text);

            if (response) {
                if (response.isComplete && response.architecture) {
                    if (!response.isUpdate) {
                        socket.emit('generate_canvas_start');
                        socket.emit('agent_message', { text: "Great, I have everything I need. Generating your architecture now...", isComplete: true });
                    } else {
                        socket.emit('agent_message', { text: response.text, isComplete: true, questionData: response.questionData });
                    }

                    socket.emit('generate_canvas_success', response.architecture);
                } else {
                    if (response.isComplete && !response.architecture) {
                        socket.emit('generate_canvas_error');
                    }
                    socket.emit('agent_message', { text: response.text, isComplete: response.isComplete, questionData: response.questionData });
                }
            }
        } catch (error) {
            console.error("Error processing message:", error);
            socket.emit('agent_message', { text: "Error processing your answer." });
            socket.emit('generate_canvas_error');
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
