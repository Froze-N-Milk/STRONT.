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
          {activeTab === 'bookings' && (
            <div className="bookings-content">
              <div className="bookings-header">
                <h2>Bookings</h2>
                <button
                  className="add-booking-btn"
                  onClick={() => setShowAddModal(true)}
                >
                  + Add Booking
                </button>
              </div>

              <div className="bookings-list">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <h3>{booking.customerName}</h3>
                      <span className={`status ${booking.status}`}>
                        {booking.status === 'confirmed' ? 'confirmed' :
                          booking.status === 'pending' ? 'pending' : 'cancelled'}
                      </span>
                    </div>
                    <div className="booking-details">
                      <p><strong>Date: </strong> {booking.date}</p>
                      <p><strong>Time: </strong> {booking.time}</p>
                      <p><strong>Guests: </strong> {booking.guests}人</p>
                      <p><strong>Phone: </strong> {booking.phone}</p>
                    </div>
                    <div className="booking-actions">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            className="action-btn confirm"
                            onClick={() => handleConfirmBooking(booking.id)}
                          >
                            Confirm
                          </button>
                          <button
                            className="action-btn cancel"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <span className="status-message">✅ Booking Confirmed</span>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="status-message">❌ Booking Cancelled</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Booking Modal */}
              {showAddModal && (
                <div className="modal-overlay">
                  <div className="modal">
                    <div className="modal-header">
                      <h3>Add New Booking</h3>
                      <button className="close-btn" onClick={resetNewBooking}>×</button>
                    </div>
                    <div className="modal-body">
                      <div className="form-section">
                        <label>Customer Name:</label>
                        <input
                          type="text"
                          value={newBooking.customerName}
                          onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                          placeholder="Enter customer name"
                          className="text-input"
                        />
                      </div>
                      <div className="form-section">
                        <label>Booking Date:</label>
                        <input
                          type="date"
                          value={newBooking.date}
                          onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                          className="text-input"
                        />
                      </div>
                      <div className="form-section">
                        <label>Booking Time:</label>
                        <input
                          type="time"
                          value={newBooking.time}
                          onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                          className="text-input"
                        />
                      </div>
                      <div className="form-section">
                        <label>Guests:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={newBooking.guests}
                          onChange={(e) => setNewBooking({ ...newBooking, guests: parseInt(e.target.value) })}
                          className="number-input"
                        />
                      </div>
                      <div className="form-section">
                        <label>Phone Number:</label>
                        <input
                          type="tel"
                          value={newBooking.phone}
                          onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                          placeholder="Enter phone number"
                          className="text-input"
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button className="btn-secondary" onClick={resetNewBooking}>
                        Cancel
                      </button>
                      <button className="btn-primary" onClick={handleAddBooking}>
                        Add Booking
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'booking-settings' && (
            <div className="settings-content">
              <h2>Booking Setting</h2>

              <div className="form-section">
                <label>Business Hours:</label>
                <div className="time-settings">
                  <div className="time-input">
                    <span>Start Time:</span>
                    <input type="time" defaultValue="09:00" />
                  </div>
                  <div className="time-input">
                    <span>End Time:</span>
                    <input type="time" defaultValue="22:00" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <label>Booking Rules:</label>
                <div className="rules-settings">
                  <div className="rule-item">
                    <input type="checkbox" id="advance-booking" defaultChecked />
                    <label htmlFor="advance-booking">Allow advance booking</label>
                  </div>
                  <div className="rule-item">
                    <input type="checkbox" id="same-day" defaultChecked />
                    <label htmlFor="same-day">Allow same-day booking</label>
                  </div>
                  <div className="rule-item">
                    <input type="checkbox" id="cancellation" />
                    <label htmlFor="cancellation">Allow cancellations</label>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <label>Maximum Guests Per Booking:</label>
                <input type="number" min="1" max="20" defaultValue="10" className="number-input" />
              </div>

              <div className="save-section">
                <button
                  className={`save-btn ${isSaving ? 'saving' : ''}`}
                  onClick={saveBookingSettings}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Booking Settings'}
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