import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'; 
import Navbar from '../components/Navbar';

const Browse = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const NOTES_PER_PAGE = 10; 

  // Popup State
  const [selectedNote, setSelectedNote] = useState(null);

  // Full Screen State
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Fetch real notes from the database (Memoized for polling)
  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/notes`);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Initial Fetch + Polling (Every 10 seconds)
  useEffect(() => {
    fetchNotes(); // Initial load

    const pollInterval = setInterval(fetchNotes, 5000); // Poll for new notes
    return () => clearInterval(pollInterval);
  }, [fetchNotes]);

  // Automatic Pagination Timer (Retained - 20 Seconds)
  useEffect(() => {
    if (notes.length <= NOTES_PER_PAGE) return;

    const interval = setInterval(() => {
      setCurrentPage((prev) => {
        const totalPages = Math.ceil(notes.length / NOTES_PER_PAGE);
        return (prev + 1) % totalPages;
      });
    }, 60000); 

    return () => clearInterval(interval);
  }, [notes.length]);

  // Manual Pagination Helpers
  const totalPages = Math.ceil(notes.length / NOTES_PER_PAGE);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  // Calculate notes to display for current page
  const currentNotes = useMemo(() => {
    const start = currentPage * NOTES_PER_PAGE;
    return notes.slice(start, start + NOTES_PER_PAGE);
  }, [currentPage, notes]);

  // Add random rotation/offsets
  const stickyNotes = useMemo(() => {
    return currentNotes.map((note) => ({
      ...note,
      rotation: Math.floor(Math.random() * 10) - 5,
      offsetX: Math.floor(Math.random() * 10) - 5,
      offsetY: Math.floor(Math.random() * 10) - 5,
    }));
  }, [currentNotes]);

  // Helper to determine font size based on message length
  const getNoteFontSize = (text) => {
    if (!text) return 'text-3xl sm:text-4xl';
    if (text.length > 200) return 'text-xl sm:text-2xl'; // Very long: smallest font
    if (text.length > 100) return 'text-2xl sm:text-3xl'; // Medium long: medium font
    return 'text-3xl sm:text-4xl'; // Short: default large font
  };

  return (
    // MAIN CONTAINER
    <div 
      className={`relative w-full flex justify-center items-start transition-all duration-500 ease-in-out
        ${isFullScreen ? 'h-screen overflow-hidden p-0' : 'min-h-screen py-20 px-2 sm:px-4'}`}
      style={{
        backgroundColor: '#f3f4f6', // Light gray base
        // CSS Pattern for Brick Wall (Only visible when not full screen)
        backgroundImage: isFullScreen ? 'none' : `
          linear-gradient(335deg, rgba(0,0,0,0.03) 23px, transparent 23px),
          linear-gradient(155deg, rgba(0,0,0,0.03) 23px, transparent 23px),
          linear-gradient(335deg, rgba(0,0,0,0.03) 23px, transparent 23px),
          linear-gradient(155deg, rgba(0,0,0,0.03) 23px, transparent 23px)
        `,
        backgroundSize: '58px 58px',
        backgroundPosition: '0px 2px, 4px 35px, 29px 31px, 34px 6px'
      }}
    >
      {/* Conditionally Render Navbar */}
      {!isFullScreen && <Navbar />}
      
      {/* Corkboard Container */}
      <div 
        className={`relative bg-[#d7a876] shadow-2xl p-2 sm:p-8 pb-20 overflow-hidden transition-all duration-500
          ${isFullScreen 
            ? 'w-full h-full max-w-none rounded-none border-none' 
            : 'w-full max-w-7xl min-h-[85vh] border-8 md:border-[16px] border-[#8b5a2b] rounded-lg'
          }`}
        style={{
          boxShadow: isFullScreen ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 80px rgba(0,0,0,0.3)',
          backgroundImage: `
            radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px),
            radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }}
      >
        {/* TOP CONTROLS: Page Indicator + Full Screen Toggle */}
        <div className="absolute top-2 right-2 flex items-center gap-2 z-30">

          {/* Full Screen Toggle Button */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 bg-white/40 hover:bg-white/80 text-[#5c3a1b] rounded-md transition-all shadow-sm backdrop-blur-sm"
            title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-white font-sans">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-cursive">Loading notes...</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center content-start gap-4 sm:gap-8 pt-6 animate-fadeIn">
            {stickyNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="relative w-40 h-40 sm:w-48 sm:h-48 p-3 sm:p-4 shadow-lg hover:z-20 hover:scale-105 transition-all duration-300 flex flex-col cursor-pointer group"
                style={{
                  backgroundColor: note.color,
                  transform: `rotate(${note.rotation}deg) translate(${note.offsetX}px, ${note.offsetY}px)`,
                  fontFamily: '"Caveat", cursive', 
                }}
              >
                {/* Visual Tape */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-white/30 backdrop-blur-md rotate-[-2deg] shadow-sm border border-white/20 z-20"></div>

                <div className="grow flex flex-col justify-between items-center text-center h-full overflow-hidden">
                  {note.to_name && (
                    <span className="text-xs font-bold opacity-60 mb-1 block border-b border-black/10 pb-1 w-full text-center truncate px-1">
                      To: {note.to_name}
                    </span>
                  )}
                  
                  <p className="text-lg sm:text-xl leading-tight text-black my-auto line-clamp-4 break-words w-full">
                    {note.message}
                  </p>

                  {note.alias && (
                    <span className="text-xs font-bold opacity-60 mt-1 block pt-1 w-full text-right truncate px-3">
                      - {note.alias}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-black/5 rounded-tl-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Manual Pagination Controls (Bottom Center) */}
        {!loading && notes.length > NOTES_PER_PAGE && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 z-30">
            <button 
              onClick={handlePrevPage}
              className="p-1.5 sm:p-2 bg-[#fdfbf7] rounded-full shadow-lg border-2 border-[#8b5a2b]/20 text-[#8b5a2b] hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <span className="font-mono text-xs sm:text-sm font-bold text-[#5c3a1b] bg-[#fdfbf7] px-3 sm:px-5 py-1.5 rounded-full shadow-inner border border-[#8b5a2b]/20 min-w-[70px] sm:min-w-[90px] text-center flex justify-center items-center shadow-sm">
              {currentPage + 1} / {totalPages}
            </span>

            <button 
              onClick={handleNextPage}
              className="p-1.5 sm:p-2 bg-[#fdfbf7] rounded-full shadow-lg border-2 border-[#8b5a2b]/20 text-[#8b5a2b] hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label="Next Page"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        )}

      </div>

      {/* Write Button (Always Visible, Higher Z-Index) */}
      <Link 
        to="/submit"
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-[#ab1615] rounded-full shadow-2xl flex items-center justify-center hover:bg-[#8f1312] hover:-translate-y-1 transition-all z-50 group border-4 border-white"
        title="Write a Note"
      >
        <PenLine className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:rotate-12 transition-transform" />
      </Link>

      {/* NOTE POPUP MODAL */}
      {selectedNote && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 animate-fadeIn"
          onClick={() => setSelectedNote(null)}
        >
          <div 
            className="relative w-full max-w-lg aspect-square sm:aspect-[4/3] shadow-2xl p-8 sm:p-12 flex flex-col transform transition-transform scale-100 rotate-1"
            style={{ 
              backgroundColor: selectedNote.color,
              fontFamily: '"Caveat", cursive',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setSelectedNote(null)}
              className="absolute top-2 right-2 p-2 hover:bg-black/10 rounded-full transition-colors text-black/50 hover:text-black"
            >
              <X size={24} />
            </button>

            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-white/30 backdrop-blur-md rotate-[-2deg] shadow-sm border border-white/20"></div>

            <div className="flex-grow flex flex-col justify-center items-center text-center h-full">
              {selectedNote.to_name && (
                <div className="w-full border-b-2 border-black/10 pb-2 mb-4">
                  <span className="text-2xl sm:text-3xl text-black/50 font-bold">To: </span>
                  <span className="text-3xl sm:text-4xl text-black font-bold">{selectedNote.to_name}</span>
                </div>
              )}
              
              <p className={`${getNoteFontSize(selectedNote.message)} leading-relaxed text-black w-full overflow-y-auto max-h-[60vh] [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]`}>
                {selectedNote.message}
              </p>

              {selectedNote.alias && (
                <div className="w-full pt-4 mt-auto text-right">
                  <span className="text-2xl sm:text-3xl text-black/50 font-bold">- </span>
                  <span className="text-2xl sm:text-3xl text-black font-bold pr-2">{selectedNote.alias}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Browse;