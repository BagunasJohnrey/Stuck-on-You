import bgImage from '../assets/bg.png';
import aboutPageImg from '../assets/about-page.png'; 
import Navbar from '../components/Navbar';     

const About = () => {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden py-24 px-4 sm:px-6">
      <Navbar />
      {/* 1. Background Layer */}
      <div className="absolute inset-0 -z-10">
        <img 
          src={bgImage} 
          alt="Background Texture" 
          className="w-full h-full object-cover opacity-95" 
        />
      </div>

      {/* 2. Main Content Container */}
      {/* Changed: Adjusted gap for different breakpoints */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-10 md:gap-12 lg:gap-20">
        
        {/* Left Side: About Page Content */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
          {/* Changed: Width set to percentage for fluidity on mobile */}
          <img 
            src={aboutPageImg} 
            alt="About Stuck on You" 
            className="w-10/12 sm:w-8/12 md:w-full max-w-md lg:max-w-lg object-contain drop-shadow-xl hover:scale-[1.02] transition-transform duration-500 ease-in-out"
          />
        </div>



      </div>
    </div>
  );
};

export default About;