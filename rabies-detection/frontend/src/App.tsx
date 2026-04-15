import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage    from './pages/LandingPage';
import AssessmentPage from './pages/AssessmentPage';
import ResultPage     from './pages/ResultPage';
import Dashboard      from './pages/Dashboard';
import HistoryPage    from './pages/HistoryPage';
import Chatbot        from './components/Chatbot';
import type { PredictResponse } from './types';

// Extract result context from result page location state
const ChatbotWrapper: React.FC = () => {
  const location = useLocation();
  const result = location.state as PredictResponse | null;

  const riskContext = result
    ? {
        riskLevel:       result.risk_level,
        probability:     result.final_probability,
        patientName:     result.patient_name,
        recommendations: result.recommendations,
      }
    : undefined;

  return <Chatbot riskContext={riskContext} />;
};

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/"           element={<LandingPage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
      <Route path="/result/:id" element={<ResultPage />} />
      <Route path="/dashboard"  element={<Dashboard />} />
      <Route path="/history"    element={<HistoryPage />} />
    </Routes>
    <ChatbotWrapper />
  </BrowserRouter>
);

export default App;
