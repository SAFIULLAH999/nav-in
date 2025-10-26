'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Trophy, Users, Play, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  skill: {
    id: string;
    name: string;
    category?: string;
  };
  difficulty: string;
  timeLimit?: number;
  passingScore: number;
  creator: {
    id: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  questions: Array<{
    id: string;
    question: string;
    type: string;
    points: number;
    order: number;
  }>;
  _count: {
    attempts: number;
  };
}

interface QuizAttempt {
  id: string;
  score: number;
  passed: boolean;
  completedAt: string;
}

const DIFFICULTY_COLORS = {
  BEGINNER: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
  ADVANCED: 'bg-red-100 text-red-800',
};

export function SkillsQuiz() {
  const { data: session, status } = useSession();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<Record<string, QuizAttempt>>({});
  const [loading, setLoading] = useState(true);
  const [takingQuiz, setTakingQuiz] = useState(false);

  // Handle session loading state
  const isAuthenticated = status === 'authenticated' && session?.user?.id;

  useEffect(() => {
    fetchQuizzes(); // Always fetch quizzes, even without authentication
    if (isAuthenticated) {
      fetchUserAttempts();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [isAuthenticated, status]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes');
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAttempts = async () => {
    try {
      const response = await fetch('/api/user/quiz-attempts');
      if (response.ok) {
        const data = await response.json();
        const attemptsMap: Record<string, QuizAttempt> = {};
        data.forEach((attempt: QuizAttempt & { quizId: string }) => {
          attemptsMap[attempt.quizId] = attempt;
        });
        setAttempts(attemptsMap);
      }
    } catch (error) {
      console.error('Error fetching user attempts:', error);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setTakingQuiz(true);
  };

  const finishQuiz = () => {
    setTakingQuiz(false);
    setSelectedQuiz(null);
    fetchQuizzes();
    fetchUserAttempts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (takingQuiz && selectedQuiz) {
    return (
      <QuizTaker
        quiz={selectedQuiz}
        onComplete={finishQuiz}
        existingAttempt={attempts[selectedQuiz.id]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Skills Assessment</h2>
          <p className="text-text-muted">Take quizzes to verify your skills and earn badges</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => {
          const attempt = attempts[quiz.id];
          const isCompleted = !!attempt;
          const passed = attempt?.passed;

          return (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{quiz.title}</CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={DIFFICULTY_COLORS[quiz.difficulty as keyof typeof DIFFICULTY_COLORS]}>
                        {quiz.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {quiz.skill.name}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {quiz.description && (
                  <p className="text-text-muted text-sm mb-4">{quiz.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-text-muted mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.questions.length} questions</span>
                    </div>
                    {quiz.timeLimit && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{quiz.timeLimit} min</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{quiz._count.attempts} taken</span>
                  </div>
                </div>

                {isCompleted && (
                  <div className="mb-4 p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Your Score:</span>
                      <div className="flex items-center space-x-2">
                        {passed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Trophy className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={`text-sm font-semibold ${passed ? 'text-green-600' : 'text-gray-600'}`}>
                          {attempt.score}%
                        </span>
                      </div>
                    </div>
                    <Progress value={attempt.score} className="h-2" />
                    <p className="text-xs text-text-muted mt-1">
                      Completed on {new Date(attempt.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => startQuiz(quiz)}
                  disabled={isCompleted}
                  className="w-full"
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Quiz
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">No Quizzes Available</h3>
          <p className="text-text-muted">Check back later for new skill assessments.</p>
        </div>
      )}
    </div>
  );
}

// Quiz taking component
function QuizTaker({
  quiz,
  onComplete,
  existingAttempt
}: {
  quiz: Quiz;
  onComplete: () => void;
  existingAttempt?: QuizAttempt;
}) {
  const { data: session, status } = useSession();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(quiz.timeLimit ? quiz.timeLimit * 60 : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      toast.error('Please sign in to submit quiz');
      return;
    }

    if (Object.keys(answers).length !== quiz.questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quizzes/${quiz.id}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          timeSpent: quiz.timeLimit ? quiz.timeLimit * 60 - (timeLeft || 0) : 0,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Quiz completed! Score: ${result.score}%`);
        onComplete();
      } else {
        toast.error('Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{quiz.title}</CardTitle>
          {timeLeft !== null && (
            <div className={`text-lg font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-text'}`}>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-text-muted">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>

          {/* For now, just show a simple text input for all question types */}
          <input
            type="text"
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="Enter your answer..."
          />
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
