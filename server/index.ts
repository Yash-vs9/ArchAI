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
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

// Total number of interview questions
const TOTAL_QUESTIONS = 14;

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('start_interview', async (data) => {
        try {
            const { processInterviewStep, clearSession } = await import('./agents/interviewAgent');
            const sessionId = data?.sessionId || socket.id;
            clearSession(sessionId);
            const response = await processInterviewStep(sessionId, null);
            if (response) {
                socket.emit('agent_message', {
                    text: response.text,
                    isComplete: response.isComplete,
                    questionData: response.questionData
                });
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

            restoreSession(sessionId, messages);

            const response = await processInterviewStep(sessionId, null, true);
            if (response) {
                socket.emit('agent_message', {
                    text: response.text,
                    isComplete: response.isComplete,
                    questionData: response.questionData
                });
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

            const isFinalAnswer = data.currentStep >= TOTAL_QUESTIONS;
            if (isFinalAnswer) {
                socket.emit('generate_canvas_start');
                socket.emit('agent_message', {
                    text: "Great, I have everything I need. Generating your architecture now...",
                    isComplete: false
                });
            }

            const response = await processInterviewStep(sessionId, data.text);
            console.log('processInterviewStep response:', {
                isComplete: response?.isComplete,
                hasArchitecture: !!response?.architecture,
                isUpdate: response?.isUpdate,
                text: response?.text?.substring(0, 60)
            });

            if (!response) {
                console.warn("processInterviewStep returned null");
                if (isFinalAnswer) socket.emit('generate_canvas_error');
                return;
            }

            if (response.isComplete && response.architecture) {
                if (response.isUpdate) {
                    socket.emit('generate_canvas_start');
                    socket.emit('agent_message', {
                        text: response.text,
                        isComplete: true,
                        questionData: response.questionData
                    });
                }
                socket.emit('generate_canvas_success', response.architecture);

            } else if (response.isComplete && !response.architecture) {
                console.error("Generation returned isComplete but no architecture");
                socket.emit('generate_canvas_error');
                socket.emit('agent_message', {
                    text: response.text,
                    isComplete: response.isComplete,
                    questionData: response.questionData
                });

            } else {
                socket.emit('agent_message', {
                    text: response.text,
                    isComplete: response.isComplete,
                    questionData: response.questionData
                });
            }

        } catch (error) {
            console.error("Error processing message:", error);
            socket.emit('agent_message', { text: "Error processing your answer." });
            socket.emit('generate_canvas_error');
        }
    });

    // On-demand guide generation
    socket.on('generate_guide', async (data) => {
        console.log('Guide generation requested for session:', data.sessionId);
        try {
            const { generateGuide } = await import('./agents/architectureGenerator');
            const { getSession } = await import('./agents/interviewAgent');

            const sessionId = data.sessionId;
            const session = getSession(sessionId);

            if (!session || !session.currentArchitecture) {
                socket.emit('guide_error', { message: "No architecture found. Please generate an architecture first." });
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