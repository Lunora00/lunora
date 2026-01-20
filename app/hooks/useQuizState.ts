// hooks/useQuizState.ts
import { useState } from 'react';
import { Question, QuizState } from '@/types/quiz.types';

export const useQuizState = () => {
    const initialState: QuizState = {
        currentQuestionIndex: 0,
        userAnswer: null,
        answer: "",
        isAnswered: false,
        isCorrect: false,
        correctAnswers: 0,
        showHint: false,
        showWrongAnswerHelp: false,
        wrongAnswerData: null,
        showAllQuestions: false,
    };

    const [state, setState] = useState<QuizState>(initialState);

    // ⛔ No ghost UI persistence ever.
    const fullyResetUI = () => ({
        userAnswer: null,
        answer: "",
        isAnswered: false,
        isCorrect: false,
        showHint: false,
        showWrongAnswerHelp: false,
        wrongAnswerData: null,
    });

    /** ----------------------------------------------------
     * RESET QUESTION UI (Used when moving to NEW question)
     * ---------------------------------------------------- */
    const resetQuestion = () => {
        setState(prev => ({
            ...prev,
            ...fullyResetUI(),
        }));
    };

    /** ----------------------------------------------------
     * RESTORE STATE WHEN QUESTION ALREADY ANSWERED EARLIER
     * ---------------------------------------------------- */
    const restoreAnswerState = (
        savedAnswer: string,
        isCorrect: boolean,
        currentQuestionData: Question
    ) => {
        const {
            subtopic,
            explanation,
            correctAnswer,
            userAnswerIndex,
        } = currentQuestionData;

        // ❗ NEW IMPORTANT FIX:
        // If user never answered this before → restore NOTHING, give fresh UI
        if (userAnswerIndex === undefined || userAnswerIndex === null) {
            setState(prev => ({
                ...prev,
                ...fullyResetUI(),
            }));
            return;
        }

        // Otherwise restore UI of already-answered question
        setState(prev => ({
            ...prev,
            answer: savedAnswer,
            userAnswer: userAnswerIndex,
            isAnswered: true,
            isCorrect,
            showWrongAnswerHelp: !isCorrect,
            wrongAnswerData: !isCorrect
                ? { subtopic, explanation, correctAnswer }
                : null,
        }));
    };

    /** ----------------------------------------------------
     * USER ANSWERS A QUESTION FOR THE FIRST TIME
     * ---------------------------------------------------- */
    const setAnswer = (
        answer: string,
        answerIndex: number,
        isCorrect: boolean,
        currentQuestionData: Question
    ) => {
        if (!currentQuestionData) return;

        const { subtopic, explanation, correctAnswer } = currentQuestionData;

        setState(prev => ({
            ...prev,
            answer,
            userAnswer: answerIndex,
            isAnswered: true,
            isCorrect,
            correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
            showWrongAnswerHelp: !isCorrect,
            wrongAnswerData: !isCorrect
                ? { subtopic, explanation, correctAnswer }
                : null,
        }));
    };

    /** ----------------------------------------------------
     * WHEN MOVING TO ANOTHER QUESTION
     * ---------------------------------------------------- */
    const setQuestionIndex = (index: number) => {
        setState(prev => ({
            ...prev,
            currentQuestionIndex: index,
            // ❗ ALWAYS CLEAR UI FIRST
            ...fullyResetUI(),
        }));
        // TrainingPage effect will restore if needed
    };

    const toggleHint = () =>
        setState(prev => ({ ...prev, showHint: !prev.showHint }));

    const toggleAllQuestions = () =>
        setState(prev => ({ ...prev, showAllQuestions: !prev.showAllQuestions }));

    return {
        state,
        setAnswer,
        setQuestionIndex,
        restoreAnswerState,
        resetQuestion,
        toggleHint,
        toggleAllQuestions,
    };
};
