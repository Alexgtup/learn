import { Router } from 'express';
import { getDb, saveDb } from '../db/file-db.js';
import { calculateNextRepetition, getInitialStats } from '../../../shared/src/spaced-repetition.js';
import type { Flashcard, LearningSession, QualityGrade } from '../../../shared/types.js';

export const flashcardsRouter = Router();

// Получить все флешкарты
flashcardsRouter.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const cards = db.flashcards || [];
    res.json(cards);
  } catch (error) {
    console.error('Error getting flashcards:', error);
    res.status(500).json({ message: 'Failed to get flashcards' });
  }
});

// Получить карточки для повторения сегодня
flashcardsRouter.get('/due', async (req, res) => {
  try {
    const db = await getDb();
    const cards = db.flashcards || [];
    const now = new Date();
    
    const dueCards = cards.filter((card: Flashcard) => {
      if (!card.stats.nextReview) return true;
      return new Date(card.stats.nextReview) <= now;
    });
    
    res.json(dueCards);
  } catch (error) {
    console.error('Error getting due flashcards:', error);
    res.status(500).json({ message: 'Failed to get due flashcards' });
  }
});

// Создать новую флешкарту
flashcardsRouter.post('/', async (req, res) => {
  try {
    const { lessonId, question, answer } = req.body;
    
    if (!lessonId || !question || !answer) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const db = await getDb();
    const newCard: Flashcard = {
      id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lessonId,
      question,
      answer,
      stats: getInitialStats(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    db.flashcards = db.flashcards || [];
    db.flashcards.push(newCard);
    await saveDb(db);
    
    res.status(201).json(newCard);
  } catch (error) {
    console.error('Error creating flashcard:', error);
    res.status(500).json({ message: 'Failed to create flashcard' });
  }
});

// Обновить статистику карточки после ответа
flashcardsRouter.patch('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { quality } = req.body as { quality: QualityGrade };
    
    if (quality === undefined) {
      return res.status(400).json({ message: 'Quality grade is required' });
    }
    
    const db = await getDb();
    const cards = db.flashcards || [];
    const cardIndex = cards.findIndex((c: Flashcard) => c.id === id);
    
    if (cardIndex === -1) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }
    
    const card = cards[cardIndex];
    card.stats = calculateNextRepetition(card.stats, quality);
    card.updatedAt = new Date().toISOString();
    
    cards[cardIndex] = card;
    db.flashcards = cards;
    await saveDb(db);
    
    res.json(card);
  } catch (error) {
    console.error('Error updating flashcard stats:', error);
    res.status(500).json({ message: 'Failed to update flashcard' });
  }
});

// Удалить флешкарту
flashcardsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDb();
    const cards = db.flashcards || [];
    const filteredCards = cards.filter((c: Flashcard) => c.id !== id);
    
    if (filteredCards.length === cards.length) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }
    
    db.flashcards = filteredCards;
    await saveDb(db);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    res.status(500).json({ message: 'Failed to delete flashcard' });
  }
});

// Получить статистику сессий
flashcardsRouter.get('/sessions/stats', async (req, res) => {
  try {
    const db = await getDb();
    const sessions = db.learningSessions || [];
    
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s: LearningSession) => s.completedAt !== null);
    
    // Расчет текущей серии (streak)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = completedSessions.length - 1; i >= 0; i--) {
      const session = completedSessions[i];
      if (!session.completedAt) continue;
      
      const sessionDate = new Date(session.completedAt);
      sessionDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        today.setDate(today.getDate() - 1);
      } else {
        break;
      }
    }
    
    res.json({ totalSessions, streak });
  } catch (error) {
    console.error('Error getting session stats:', error);
    res.status(500).json({ message: 'Failed to get session stats' });
  }
});

// Начать новую сессию
flashcardsRouter.post('/sessions', async (req, res) => {
  try {
    const db = await getDb();
    
    const newSession: LearningSession = {
      id: `session_${Date.now()}`,
      startedAt: new Date().toISOString(),
      completedAt: null,
      cardsReviewed: 0,
      correctAnswers: 0,
      streak: 0,
    };
    
    db.learningSessions = db.learningSessions || [];
    db.learningSessions.push(newSession);
    await saveDb(db);
    
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Failed to start session' });
  }
});

// Завершить сессию
flashcardsRouter.patch('/sessions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { cardsReviewed, correctAnswers } = req.body;
    
    const db = await getDb();
    const sessions = db.learningSessions || [];
    const sessionIndex = sessions.findIndex((s: LearningSession) => s.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const session = sessions[sessionIndex];
    session.completedAt = new Date().toISOString();
    session.cardsReviewed = cardsReviewed;
    session.correctAnswers = correctAnswers;
    
    sessions[sessionIndex] = session;
    db.learningSessions = sessions;
    await saveDb(db);
    
    res.json(session);
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ message: 'Failed to complete session' });
  }
});
