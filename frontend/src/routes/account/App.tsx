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

  
}


export default App;