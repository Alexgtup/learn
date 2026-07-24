import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Flashcard, LearningSession } from '../../shared/types';
import { FlashcardSession, DueCardsPanel } from './flashcards/Flashcard';
import './flashcards/Flashcard.css';

export function FlashcardsPage() {
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ totalSessions: number; streak: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [due, all, sessionStats] = await Promise.all([
        api.getDueFlashcards(),
        api.getFlashcards(),
        api.getSessionStats()
      ]);
      setDueCards(due);
      setAllCards(all);
      setStats(sessionStats);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSession() {
    try {
      const session = await api.startSession();
      setCurrentSession(session);
      setSessionActive(true);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  async function handleSessionComplete(cardsReviewed: number, correctAnswers: number) {
    if (currentSession) {
      try {
        await api.completeSession(currentSession.id, cardsReviewed, correctAnswers);
      } catch (error) {
        console.error('Failed to complete session:', error);
      }
    }
    setSessionActive(false);
    setCurrentSession(null);
    loadData();
  }

  async function handleAnswer(cardId: string, quality: number) {
    try {
      await api.updateFlashcardStats(cardId, quality as any);
      // Обновляем локальный список карточек
      setDueCards(prev => prev.filter(c => c.id !== cardId));
    } catch (error) {
      console.error('Failed to update flashcard stats:', error);
    }
  }

  if (loading) {
    return (
      <div className="flashcards-loading">
        <div className="spinner" />
        <p>Загрузка карточек...</p>
      </div>
    );
  }

  if (sessionActive && currentSession) {
    return (
      <FlashcardSession
        cards={dueCards}
        onComplete={handleSessionComplete}
        onExit={() => {
          setSessionActive(false);
          setCurrentSession(null);
        }}
      />
    );
  }

  return (
    <div className="flashcards-page">
      <div className="flashcards-header">
        <h1>🧠 Флешкарты для обучения</h1>
        <p className="flashcards-subtitle">
          Интервальные повторения для эффективного запоминания
        </p>
      </div>

      {stats && (
        <div className="flashcards-stats-overview">
          <div className="stat-card">
            <span className="stat-value">{stats.streak}</span>
            <span className="stat-label">🔥 Дней подряд</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalSessions}</span>
            <span className="stat-label">📚 Всего сессий</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{allCards.length}</span>
            <span className="stat-label">📝 Всего карточек</span>
          </div>
        </div>
      )}

      <DueCardsPanel
        dueCards={dueCards}
        onStartSession={handleStartSession}
      />

      <div className="all-cards-section">
        <h2>Все карточки ({allCards.length})</h2>
        {allCards.length === 0 ? (
          <p className="no-cards-message">
            Пока нет карточек. Они появятся здесь, когда вы начнёте добавлять материалы для обучения.
          </p>
        ) : (
          <div className="cards-grid">
            {allCards.map(card => (
              <div key={card.id} className="card-preview">
                <h4>{card.question}</h4>
                <p className="card-answer-preview">
                  {card.answer.replace(/<[^>]*>/g, '').slice(0, 100)}...
                </p>
                <div className="card-meta">
                  <span>Повторений: {card.stats.repetition}</span>
                  <span>Интервал: {card.stats.interval} дн.</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
