import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{
        backgroundColor: '#fdfbf7',
        backgroundImage: `
          linear-gradient(90deg, transparent 40px, #ab161520 41px, transparent 41px),
          repeating-linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 28px)
        `,
        backgroundAttachment: 'local',
      }}
    >
      <h1 className="text-7xl font-cursive font-bold text-primary mb-2">404</h1>
      <p className="text-xl text-primary/60 mb-6 font-cursive">This page got lost in the mail.</p>
      <p className="text-xl text-primary/60 mb-6 font-cursive">Mali po ata link hehehe</p>
      <Link
        to="/"
        className="px-6 py-3 bg-primary text-white font-sans font-semibold rounded-lg shadow-md hover:bg-primary/90 transition-all"
      >
        Back Home
      </Link>
    </div>
  );
};

export default NotFound;
