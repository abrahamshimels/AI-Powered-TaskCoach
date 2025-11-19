import React from 'react'
import './Home.css'
import ChatBox from '../../components/Chatbox/Chatbox'


export default function Home() {
  return (
    <>
      <h1>Welcome to AI Coach</h1>
      <p>Your personal AI-powered task management assistant.</p>
      <ChatBox />
    </>
  )
}
