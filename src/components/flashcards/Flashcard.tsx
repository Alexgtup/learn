import { useState, useEffect } from 'react';
import { Flashcard, RepetitionStats, QualityGrade } from '../../../shared/types';
import { calculateNextRepetition, getInitialStats, isDueForReview } from '../../../shared/src/spaced-repetition';

interface FlashcardProps {
  card: Flashcard;
  onAnswer: (cardId: string, quality: QualityGrade) => void;
}

export function FlashcardComponent({ card, onAnswer }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleQualitySelect = (quality: QualityGrade) => {
    onAnswer(card.id, quality);
    setIsFlipped(false);
  };

  return (
    <div className="flashcard-container">
      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="flashcard-front">
          <h3 className="flashcard-question">{card.question}</h3>
          <p className="flashcard-hint">Нажмите, чтобы увидеть ответ</p>
        </div>
        <div className="flashcard-back">
          <div className="flashcard-answer" dangerouslySetInnerHTML={{ __html: card.answer }} />
        </div>
      </div>

      {isFlipped && (
        <div className="flashcard-controls">
          <p className="flashcard-prompt">Насколько хорошо вы запомнили?</p>
          <div className="quality-buttons">
            <button
              className="quality-btn quality-0"
              onClick={() => handleQualitySelect(0)}
              title="Полностью забыл"
            >
              😞 0
            </button>
            <button
              className="quality-btn quality-1"
              onClick={() => handleQualitySelect(1)}
              title="Почти не помню"
            >
              🙁 1
            </button>
            <button
              className="quality-btn quality-2"
              onClick={() => handleQualitySelect(2)}
              title="С большим трудом"
            >
              😐 2
            </button>
            <button
              className="quality-btn quality-3"
              onClick={() => handleQualitySelect(3)}
              title="С трудом вспомнил"
            >
              🙂 3
            </button>
            <button
              className="quality-btn quality-4"
              onClick={() => handleQualitySelect(4)}
              title="Вспомнил правильно"
            >
              😊 4
            </button>
            <button
              className="quality-btn quality-5"
              onClick={() => handleQualitySelect(5)}
              title="Легко вспомнил"
            >
              🤩 5
            </button>
          </div>
        </div>
      )}

      <div className="flashcard-stats">
        <span className="stat-item">
          🔁 Повторений: {card.stats.repetition}
        </span>
        <span className="stat-item">
          📅 Интервал: {card.stats.interval} дн.
        </span>
        <span className="stat-item">
          ⚡ Легкость: {card.stats.easeFactor.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

interface FlashcardSessionProps {
  cards: Flashcard[];
  onComplete: (cardsReviewed: number, correctAnswers: number) => void;
  onExit: () => void;
}

export function FlashcardSession({ cards, onComplete, onExit }: FlashcardSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCards, setReviewedCards] = useState<{ id: string; quality: QualityGrade }[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);

  const currentCard = cards[currentIndex];

  const handleAnswer = (cardId: string, quality: QualityGrade) => {
    setReviewedCards([...reviewedCards, { id: cardId, quality }]);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionComplete(true);
      const correctCount = reviewedCards.filter(r => r.quality >= 3).length + (quality >= 3 ? 1 : 0);
      onComplete(cards.length, correctCount);
    }
  };

  if (sessionComplete || !currentCard) {
    return (
      <div className="session-complete">
        <h2>🎉 Сессия завершена!</h2>
        <p>Вы повторили {cards.length} карточек</p>
        <button className="btn btn-primary" onClick={onExit}>
          Вернуться к обучению
        </button>
      </div>
    );
  }

  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="flashcard-session">
      <div className="session-header">
        <button className="btn btn-secondary" onClick={onExit}>
          ← Выход
        </button>
        <div className="session-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{currentIndex + 1} / {cards.length}</span>
        </div>
      </div>

      <FlashcardComponent card={currentCard} onAnswer={handleAnswer} />
    </div>
  );
}

interface DueCardsPanelProps {
  dueCards: Flashcard[];
  onStartSession: () => void;
}

export function DueCardsPanel({ dueCards, onStartSession }: DueCardsPanelProps) {
  return (
    <div className="due-cards-panel">
      <h3>📚 Карточки для повторения</h3>
      {dueCards.length === 0 ? (
        <p className="no-due-cards">✅ Все карточки повторены! Отличная работа!</p>
      ) : (
        <>
          <p>Доступно карточек: <strong>{dueCards.length}</strong></p>
          <button className="btn btn-primary" onClick={onStartSession}>
            Начать сессию ({dueCards.length} карточек)
          </button>
        </>
      )}
    </div>
  );
}
