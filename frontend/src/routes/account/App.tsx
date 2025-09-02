import React, { useState } from 'react';
import './App.css';

function App(){
  const [activeTab, setActiveTab] = useState('profile');
  const [tags, setTags] = useState(['italian', 'fast food']);
  const [newTag, setNewTag] = useState('');
  const [bio, setBio] = useState('Welcome to BIG JOE\'S PIZZA! We serve authentic Italian cuisine with a modern twist.');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Booking state
  const [bookings, setBookings] = useState([
    { id: 1, customerName: 'AAA', date: 'XX-XX-XXXX', time: 'XX:XX', guests: 2, status: 'confirmed', phone: '045-XXXX-XXX' }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customerName: '',
    date: '',
    time: '',
    guests: 1,
    phone: ''
  });

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setSaveMessage('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveMessage('✅ Profile saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
    setIsSaving(false);
  };

  const saveBookingSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveMessage('✅ Booking settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
    setIsSaving(false);
  };

  const saveAccountInfo = async () => {
    setIsSaving(true);
    setSaveMessage('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveMessage('✅ Account info saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
    setIsSaving(false);
  };

  // Booking-related functions
  // Add a new booking if required fields are filled
  const handleAddBooking = () => {
    if (newBooking.customerName && newBooking.date && newBooking.time && newBooking.phone) {
      const booking = {
        id: Date.now(),  // use timestamp as a simple ID
        ...newBooking,
        status: 'pending' as const
      };
      setBookings([...bookings, booking]); // add to booking list
      setNewBooking({ customerName: '', date: '', time: '', guests: 1, phone: '' });
      setShowAddModal(false);
    }
  };

  // Confirm a booking by id
  const handleConfirmBooking = async (id: number) => {
    setBookings(bookings.map(booking =>
      booking.id === id ? { ...booking, status: 'confirmed' as const } : booking
    ));
    // Mock API call (pretend to call backend)
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  // Cancel a booking by id
  const handleCancelBooking = async (id: number) => {
    setBookings(bookings.map(booking =>
      booking.id === id ? { ...booking, status: 'cancelled' as const } : booking
    ));

    //Mock API call (pretend to call backend)
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  //Reset the new booking form
  const resetNewBooking = () => {
    setNewBooking({ customerName: '', date: '', time: '', guests: 1, phone: '' });
    setShowAddModal(false);
  };
  
  return(
    <div className="App">
      <div className="header">
        <div className="user-avatar">
          <span className="avatar-icon">👤</span>
        </div>
        <div className="restaurant-title">
          BIG JOE'S PIZZA
          <span className="dropdown-arrow">▼</span>
        </div>
      </div>

      <div className="main-container">
        <div className="sidebar">
          <button
            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Edit Profile
          </button>
          <button
            className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
          <button
            className={`nav-btn ${activeTab === 'booking-settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking-settings')}
          >
            Booking Settings
          </button>
          <button
            className={`nav-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account Settings
          </button>
        </div>
        <div className="content">
          {activeTab === 'profile' && (
            <div className="profile-content">
              <h2>Edit Restaurant Profile</h2>

              <div className="form-section">
                <label>Tags:</label>
                <div className="tags-container">
                  {tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="remove-tag">×</button>
                    </span>
                  ))}
                </div>
                <div className="add-tag-section">
                  <input
                    type="text"
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="tag-input"
                  />
                  <button onClick={addTag} className="add-tag-btn">✓</button>
                </div>
              </div>

              <div className="form-section">
                <label>Restaurant Description</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Enter restaurant description..."
                  className="bio-textarea"
                  rows={6}
                />
              </div>

              <div className="save-section">
                <button
                  className={`save-btn ${isSaving ? 'saving' : ''}`}
                  onClick={saveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                {saveMessage && <div className="save-message">{saveMessage}</div>}
              </div>
            </div>
          )}
        </div>


      </div>
    </div>  
  );
}


export default App;