import { useState } from 'react'
import './App.css'
import AddEvent from './AddEvent'
import JaydenElement from './JaydenElement'
import SissiElement from './SissiElement'

function App() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <h1>Plange</h1>
      <div className="card">
        <button className="create_button" onClick={() => {
          setOpen(open => !open)
        }}>
          Create event
        </button>
        {open && <AddEvent close={() => setOpen(false)}/>}
      </div>
      
      <SissiElement></SissiElement>  

      <JaydenElement></JaydenElement>
    </>
  )
}

export default App
