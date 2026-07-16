import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Footer from './components/Footer';

// Pages 
import Home from './pages/Home';
import Submit from './pages/Submit';
import Browse from './pages/Browse';
import About from './pages/About';

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
          </Routes>
        </main>

        <Footer />
        
      </div>
    </Router>
  );
};

export default App;