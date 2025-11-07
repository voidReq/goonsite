"use client";

import { Typewriter } from 'react-simple-typewriter'

export default function NotesIndexPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', padding: '20px' }}>
      <div style={{ backgroundColor: '#1a1b26', borderRadius: '8px', padding: '30px', color: '#a9b1d6', maxWidth: '800px', width: '100%' }}>
        <div style={{ marginBottom: '20px' }}>
          <span style={{ color: '#bb9af7' }}>user@goonsite</span>
          <span style={{ color: '#7dcfff' }}>:</span>
          <span style={{ color: '#c0caf5' }}>~/notes</span>
          <span style={{ color: '#7dcfff' }}>$</span>
          <span style={{ color: '#a9b1d6', marginLeft: '10px' }}>cat README.md</span>
        </div>
        
        <div style={{ marginTop: '20px', lineHeight: '1.8', fontFamily: 'monospace' }}>
          <div style={{ color: '#7aa2f7', marginBottom: '15px' }}># Notes Repository</div>
          
          <div style={{ color: '#9ece6a', marginBottom: '10px' }}>## Status</div>
          <div style={{ marginBottom: '15px' }}>Continuously updated • Mostly handwritten • Self-taught concepts</div>
          
          <div style={{ color: '#9ece6a', marginBottom: '10px' }}>## Planned Additions</div>
          <div style={{ marginBottom: '5px' }}><span style={{ color: '#bb9af7' }}>├──</span> Web vulnerabilities (expanded)</div>
          <div style={{ marginBottom: '5px' }}><span style={{ color: '#bb9af7' }}>├──</span> Computer networking (graduate level)</div>
          <div style={{ marginBottom: '5px' }}><span style={{ color: '#bb9af7' }}>├──</span> Python deep dive</div>
          <div style={{ marginBottom: '15px' }}><span style={{ color: '#bb9af7' }}>└──</span> Developing real-time systems</div>
          
          <div style={{ color: '#f7768e', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #414868' }}>
            → Select a note from the sidebar to begin
          </div>
        </div>
      </div>
    </div>
  );
}
