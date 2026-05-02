import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation, matchPath } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AssessmentPage from './pages/AssessmentPage';
import ResultPage from './pages/ResultPage';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/HistoryPage';
import Chatbot from './components/Chatbot';
import type { PredictResponse } from './types';

type ChatbotRiskContext = {
  riskLevel?: string;
  probability?: number;
  patientName?: string;
  recommendations?: string[];
};

const isPredictResponse = (value: unknown): value is PredictResponse => {
  if (!value || typeof value !== 'object') return false;

  const data = value as Record<string, unknown>;

  return (
    typeof data.id === 'number' &&
    typeof data.patient_name === 'string' &&
    typeof data.risk_level === 'string' &&
    typeof data.final_probability === 'number' &&
    Array.isArray(data.recommendations)
  );
};

const ChatbotWrapper: React.FC = () => {
  const location = useLocation();

  const riskContext = useMemo<ChatbotRiskContext | undefined>(() => {
    const state = location.state;

    if (isPredictResponse(state)) {
      return {
        riskLevel: state.risk_level,
        probability: state.final_probability,
        patientName: state.patient_name,
        recommendations: state.recommendations,
      };
    }

    return undefined;
  }, [location.state]);

  const hideChatbot = false;

  const pageAwareContext = useMemo(() => {
    if (matchPath('/result/:id', location.pathname)) {
      return riskContext;
    }

    if (matchPath('/assessment', location.pathname)) {
      return {
        ...riskContext,
      };
    }

    if (matchPath('/dashboard', location.pathname)) {
      return riskContext;
    }

    if (matchPath('/history', location.pathname)) {
      return riskContext;
    }

    return riskContext;
  }, [location.pathname, riskContext]);

  if (hideChatbot) return null;

  return <Chatbot riskContext={pageAwareContext} />;
};

const AppRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/result/:id" element={<ResultPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
      <ChatbotWrapper />
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;