import { useState } from 'react'
import './App.css'
import AddEvent from './AddEvent'

function App() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <h1>Plange</h1>
      <div className="card">
        <button className="create_button" onClick={() => {
          console.log("yep you clicked ts (gurt)")
          setOpen(open => !open)
        }}>
          Create event
        </button>
        {open && <AddEvent close={() => setOpen(false)}/>}
      </div>
    </>
  )
}

export default App
