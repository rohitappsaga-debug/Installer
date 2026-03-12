
import InstallerWizard from './components/installer/InstallerWizard';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        <InstallerWizard />
      </div>
    </div>
  );
}

export default App;
