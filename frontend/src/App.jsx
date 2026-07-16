import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Footer from './components/Footer';

// Pages 
import Home from './pages/Home';
import Submit from './pages/Submit';
import Browse from './pages/Browse';
import About from './pages/About';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

// Gate the admin UI: only reveal it to an authenticated session.
// Unauthenticated visitors are sent to a 404 so the form is hidden.
const AdminGuard = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  // The /admin UI is always rendered; the Admin component itself shows the
  // login form when there is no valid session. The API path stays secret.
  return <Admin />;
};

const App = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
         

        {/* Main Content Area */}
        <main className="grow ">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<AdminGuard />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
        
      </div>
    </Router>
  );
};

export default App;