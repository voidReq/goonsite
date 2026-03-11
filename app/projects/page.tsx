"use client";

export default function ProjectsIndexPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', padding: '20px' }}>
      <div style={{ backgroundColor: '#1a1b26', borderRadius: '8px', padding: '30px', color: '#a9b1d6', maxWidth: '800px', width: '100%' }}>
        <div style={{ marginBottom: '20px' }}>
          <span style={{ color: '#bb9af7' }}>user@goonsite</span>
          <span style={{ color: '#7dcfff' }}>:</span>
          <span style={{ color: '#c0caf5' }}>~/projects</span>
          <span style={{ color: '#7dcfff' }}>$</span>
          <span style={{ color: '#a9b1d6', marginLeft: '10px' }}>cat README.md</span>
        </div>
        
        <div style={{ marginTop: '20px', lineHeight: '1.8', fontFamily: 'monospace' }}>
          <div style={{ color: '#7aa2f7', marginBottom: '15px' }}># Personal Projects</div>
          
          <div style={{ color: '#9ece6a', marginBottom: '10px' }}>## Overview</div>
          <div style={{ marginBottom: '15px' }}>A collection of personal and collaborative projects spanning cybersecurity, IoT, math visualization, and robotics.</div>
          
          <div style={{ color: '#9ece6a', marginBottom: '10px' }}>## security/</div>
          <div style={{ marginBottom: '5px' }}><span style={{ color: '#bb9af7' }}>├──</span> <span style={{ color: '#7dcfff' }}>discord-remote-access</span> — Discord-based remote access tool (C)</div>
          <div style={{ marginBottom: '15px' }}><span style={{ color: '#bb9af7' }}>└──</span> <span style={{ color: '#7dcfff' }}>t-watch-evil-portal</span> — Evil portal for LILYGO T-Watch S3 (HTML/C++)</div>
          
          <div style={{ color: '#9ece6a', marginBottom: '10px' }}>## other/</div>
          <div style={{ marginBottom: '5px' }}><span style={{ color: '#bb9af7' }}>├──</span> <span style={{ color: '#7dcfff' }}>revolutions</span> — 3D revolution surface visualizer (Python)</div>
          <div style={{ marginBottom: '15px' }}><span style={{ color: '#bb9af7' }}>└──</span> <span style={{ color: '#7dcfff' }}>smartgrid-iot</span> — Smart grid cybersecurity testbed (C++)</div>
          
          <div style={{ color: '#f7768e', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #414868' }}>
            → Select a project from the sidebar to begin
          </div>
        </div>
      </div>
    </div>
  );
}
