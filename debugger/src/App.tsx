import { useState } from 'react'
import { FileUp, Play, Info } from 'lucide-react'

function App() {
  const [schemaFile, setSchemaFile] = useState<File | null>(null)
  const [binaryFile, setBinaryFile] = useState<File | null>(null)

  const handleSchemaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSchemaFile(file)
  }

  const handleBinaryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setBinaryFile(file)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold">K</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Kaitai Struct Debugger</h1>
              <p className="text-sm text-muted-foreground">
                Visual binary format debugger v0.1.0
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm border border-border rounded hover:bg-accent">
              <Info className="w-4 h-4 inline mr-2" />
              Help
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Welcome to Kaitai Struct Debugger</h2>
            <p className="text-muted-foreground">
              Upload a .ksy schema file and a binary file to start debugging
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Schema File Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <label htmlFor="schema-upload" className="cursor-pointer block">
                <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-2">Upload Schema (.ksy)</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {schemaFile ? schemaFile.name : 'Click to browse'}
                </p>
                <input
                  id="schema-upload"
                  type="file"
                  accept=".ksy,.yaml,.yml"
                  className="hidden"
                  onChange={handleSchemaUpload}
                />
                <span className="text-xs text-muted-foreground">
                  Kaitai Struct definition file
                </span>
              </label>
            </div>

            {/* Binary File Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <label htmlFor="binary-upload" className="cursor-pointer block">
                <FileUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-2">Upload Binary File</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {binaryFile ? binaryFile.name : 'Click to browse'}
                </p>
                <input
                  id="binary-upload"
                  type="file"
                  className="hidden"
                  onChange={handleBinaryUpload}
                />
                <span className="text-xs text-muted-foreground">Any binary file format</span>
              </label>
            </div>
          </div>

          {/* Parse Button */}
          {schemaFile && binaryFile && (
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium">
                <Play className="w-5 h-5" />
                Start Debugging
              </button>
            </div>
          )}

          {/* Quick Start */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-3">Quick Start</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Upload a Kaitai Struct schema file (.ksy)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Upload a binary file to parse</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Click "Start Debugging" to visualize the parsing process</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
        <p>
          Powered by{' '}
          <a
            href="https://github.com/fabianopinto/kaitai-struct-ts"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            kaitai-struct-ts
          </a>{' '}
          | Built with React + TypeScript + Vite
        </p>
      </footer>
    </div>
  )
}

export default App
