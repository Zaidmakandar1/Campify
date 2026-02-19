# 📝 Basic Frontend Code for Exams

## 🎯 **Simple React Components (Easy to Write)**

### **1. Basic Club Card Component**
```jsx
// ClubCard.jsx
import React from 'react';

function ClubCard({ club }) {
  return (
    <div className="club-card">
      <h3>{club.name}</h3>
      <p>{club.description}</p>
      <div className="score">
        Score: {club.score}/100
      </div>
      <div className="stats">
        <span>Events: {club.events}</span>
        <span>Members: {club.members}</span>
      </div>
    </div>
  );
}

export default ClubCard;
```

### **2. Club Rankings List**
```jsx
// ClubRankings.jsx
import React, { useState, useEffect } from 'react';
import ClubCard from './ClubCard';

function ClubRankings() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs');
      const data = await response.json();
      setClubs(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="rankings">
      <h2>Club Rankings</h2>
      {clubs.map((club, index) => (
        <div key={club.id} className="rank-item">
          <span className="rank">#{index + 1}</span>
          <ClubCard club={club} />
        </div>
      ))}
    </div>
  );
}

export default ClubRankings;
```

### **3. Event Registration Form**
```jsx
// EventForm.jsx
import React, { useState } from 'react';

function EventForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    event: '',
    teamName: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // API call here
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <h3>Event Registration</h3>
      
      <input
        type="text"
        name="name"
        placeholder="Your Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <select
        name="event"
        value={formData.event}
        onChange={handleChange}
        required
      >
        <option value="">Select Event</option>
        <option value="hackathon">Hackathon</option>
        <option value="workshop">Workshop</option>
        <option value="seminar">Seminar</option>
      </select>
      
      <input
        type="text"
        name="teamName"
        placeholder="Team Name (optional)"
        value={formData.teamName}
        onChange={handleChange}
      />
      
      <button type="submit">Register</button>
    </form>
  );
}

export default EventForm;
```

### **4. Feedback Component**
```jsx
// FeedbackForm.jsx
import React, { useState } from 'react';

function FeedbackForm() {
  const [feedback, setFeedback] = useState({
    title: '',
    message: '',
    rating: 5,
    category: 'general'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit feedback
    console.log('Feedback:', feedback);
  };

  return (
    <div className="feedback-form">
      <h3>Submit Feedback</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={feedback.title}
          onChange={(e) => setFeedback({...feedback, title: e.target.value})}
        />
        
        <textarea
          placeholder="Your feedback..."
          value={feedback.message}
          onChange={(e) => setFeedback({...feedback, message: e.target.value})}
        />
        
        <select
          value={feedback.category}
          onChange={(e) => setFeedback({...feedback, category: e.target.value})}
        >
          <option value="general">General</option>
          <option value="facilities">Facilities</option>
          <option value="events">Events</option>
          <option value="academics">Academics</option>
        </select>
        
        <div className="rating">
          <label>Rating: </label>
          {[1,2,3,4,5].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => setFeedback({...feedback, rating: num})}
              className={feedback.rating >= num ? 'active' : ''}
            >
              ⭐
            </button>
          ))}
        </div>
        
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default FeedbackForm;
```

### **5. Main App Component**
```jsx
// App.jsx
import React, { useState } from 'react';
import ClubRankings from './ClubRankings';
import EventForm from './EventForm';
import FeedbackForm from './FeedbackForm';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('rankings');

  return (
    <div className="app">
      <header>
        <h1>Campify - Campus Management</h1>
        <nav>
          <button 
            onClick={() => setActiveTab('rankings')}
            className={activeTab === 'rankings' ? 'active' : ''}
          >
            Rankings
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={activeTab === 'events' ? 'active' : ''}
          >
            Events
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={activeTab === 'feedback' ? 'active' : ''}
          >
            Feedback
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'rankings' && <ClubRankings />}
        {activeTab === 'events' && <EventForm />}
        {activeTab === 'feedback' && <FeedbackForm />}
      </main>
    </div>
  );
}

export default App;
```

---

## 🎨 **Basic CSS (Quick to Write)**

### **App.css**
```css
/* Basic Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
header {
  background: #2563eb;
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

header h1 {
  margin-bottom: 10px;
}

nav button {
  background: transparent;
  color: white;
  border: 2px solid white;
  padding: 8px 16px;
  margin-right: 10px;
  border-radius: 4px;
  cursor: pointer;
}

nav button.active {
  background: white;
  color: #2563eb;
}

/* Club Card */
.club-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 10px 0;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.club-card h3 {
  color: #2563eb;
  margin-bottom: 8px;
}

.score {
  font-size: 18px;
  font-weight: bold;
  color: #059669;
  margin: 10px 0;
}

.stats span {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  margin-right: 8px;
  font-size: 14px;
}

/* Rankings */
.rankings h2 {
  margin-bottom: 20px;
  color: #1f2937;
}

.rank-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.rank {
  background: #2563eb;
  color: white;
  padding: 8px 12px;
  border-radius: 50%;
  font-weight: bold;
  margin-right: 15px;
  min-width: 40px;
  text-align: center;
}

/* Forms */
.event-form, .feedback-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 500px;
}

.event-form input,
.event-form select,
.feedback-form input,
.feedback-form textarea,
.feedback-form select {
  width: 100%;
  padding: 10px;
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.event-form button,
.feedback-form button[type="submit"] {
  background: #2563eb;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
}

.event-form button:hover,
.feedback-form button[type="submit"]:hover {
  background: #1d4ed8;
}

/* Rating */
.rating {
  margin: 10px 0;
}

.rating button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  margin-right: 5px;
}

.rating button.active {
  color: #fbbf24;
}

/* Loading */
.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #6b7280;
}
```

---

## 📱 **Simple HTML Structure**

### **index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Campify - Campus Management</title>
</head>
<body>
    <div id="root"></div>
    <script src="./src/index.js"></script>
</body>
</html>
```

### **index.js**
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

---

## 🔧 **Key React Hooks (Exam Favorites)**

### **useState Examples**
```jsx
// Simple state
const [count, setCount] = useState(0);

// Object state
const [user, setUser] = useState({
  name: '',
  email: '',
  role: 'student'
});

// Array state
const [clubs, setClubs] = useState([]);

// Boolean state
const [loading, setLoading] = useState(true);
```

### **useEffect Examples**
```jsx
// Run once on mount
useEffect(() => {
  fetchData();
}, []);

// Run when dependency changes
useEffect(() => {
  updateScore();
}, [clubs]);

// Cleanup
useEffect(() => {
  const timer = setInterval(() => {
    console.log('Timer');
  }, 1000);
  
  return () => clearInterval(timer);
}, []);
```

### **Event Handlers**
```jsx
// Form submission
const handleSubmit = (e) => {
  e.preventDefault();
  // Handle form
};

// Input change
const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};

// Button click
const handleClick = () => {
  setCount(count + 1);
};
```

---

## 🎯 **Quick Component Patterns**

### **Conditional Rendering**
```jsx
{loading ? <div>Loading...</div> : <ClubList clubs={clubs} />}

{user.role === 'admin' && <AdminPanel />}

{clubs.length > 0 ? (
  <ClubList clubs={clubs} />
) : (
  <div>No clubs found</div>
)}
```

### **List Rendering**
```jsx
{clubs.map((club, index) => (
  <ClubCard 
    key={club.id} 
    club={club} 
    rank={index + 1} 
  />
))}
```

### **Props Passing**
```jsx
// Parent
<ClubCard 
  club={club} 
  onUpdate={handleUpdate}
  isActive={activeClub === club.id}
/>

// Child
function ClubCard({ club, onUpdate, isActive }) {
  return (
    <div className={isActive ? 'active' : ''}>
      <h3>{club.name}</h3>
      <button onClick={() => onUpdate(club.id)}>
        Update
      </button>
    </div>
  );
}
```

---

## ⚡ **Exam Tips**

### **What to Remember:**
1. **useState** for state management
2. **useEffect** for side effects
3. **map()** for rendering lists
4. **Conditional rendering** with && and ternary
5. **Event handlers** (onClick, onChange, onSubmit)
6. **Props** for passing data
7. **Key prop** for list items
8. **preventDefault()** for forms

### **Common Patterns:**
- Form handling with controlled components
- API calls in useEffect
- Loading states
- Error handling
- Conditional rendering

### **Quick Wins:**
- Use functional components (easier)
- Keep components small and focused
- Use descriptive variable names
- Add basic CSS for presentation
- Include loading and error states

This code is **simple, clean, and demonstrates all key React concepts** perfect for exams! 📝✨