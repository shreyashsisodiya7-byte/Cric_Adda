import VideoState from '../src/context/VideoState'
import AppContent from './components/AppContent';
import './App.css';


const App = () => {
 
  return (
    <VideoState>
      <div className='w-full h-full' >
        <AppContent />
      </div>
    </VideoState>
  )
}

export default App
