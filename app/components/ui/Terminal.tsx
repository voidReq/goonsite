
"use client";
import { Typewriter } from 'react-simple-typewriter'

export function Terminal({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <div style={{ backgroundColor: '#1a1b26', borderRadius: '8px', padding: '20px', color: '#a9b1d6', width: '100%', height: '100%', maxWidth: fullWidth ? 'none' : '600px' }}>
      <div style={{ marginBottom: '10px' }}>
        <span style={{ color: '#bb9af7' }}>goon@goonsite</span>
        <span style={{ color: '#7dcfff' }}>:</span>
        <span style={{ color: '#c0caf5' }}>~</span>
        <span style={{ color: '#7dcfff' }}>$</span>
      </div>
      <div>
        <Typewriter
          words={[
            'npm install goon-package',
            'npm start',
            'Gooning initialized...',
            'Welcome to the Gooniverse.',
            'Accessing goon-hub...',
            'Injecting goon-sploits...',
            'Hacking the goon-frame...',
            'Compiling goon-code...',
            'Running diagnostics...',
            'Establishing secure connection...',
            'Optimizing goon-flow...',
            'Analyzing goon-data...',
            'Preparing for launch...',
            'System check complete.',
            'Initiating goon-protocol...',
            'Synchronizing goon-nodes...',
            'Gooning session active.'
          ]}
          loop={1}
          cursor
          cursorStyle='_'
          typeSpeed={70}
          deleteSpeed={50}
          delaySpeed={1000}
        />
      </div>
    </div>
  )
}
