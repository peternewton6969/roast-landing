import { Routes, Route } from 'react-router-dom';
import Nav from './Nav.jsx';
import Home from './Home.jsx';
import Mission from './Mission.jsx';
import Features from './Features.jsx';
import CaptainsLog from './CaptainsLog.jsx';

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mission" element={<Mission />} />
        <Route path="/features" element={<Features />} />
        <Route path="/captains-log" element={<CaptainsLog />} />
      </Routes>
    </>
  );
}
