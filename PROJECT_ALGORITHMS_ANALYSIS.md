# 🧮 Algorithms Used in Campify Project

## 📊 **Performance Scoring Algorithms**

### **1. Club Performance Score Calculation Algorithm**
**Location**: `CLUB_RANKING_DATABASE_SETUP.sql` - `calculate_club_performance_score()`

**Algorithm Type**: Weighted Multi-Criteria Scoring Algorithm

**Formula**:
```sql
Total Score = Registration Score (25) + Feedback Score (25) + 
              Completion Score (15) + Engagement Score (15) + 
              Sentiment Score (10) + Consistency Score (10)
```

**Sub-algorithms**:

#### **A. Registration Rate Algorithm**
```sql
registration_score = MIN(25, ROUND((total_registrations / (total_events × avg_capacity)) × 25))
```
- **Type**: Normalization with ceiling cap
- **Purpose**: Measures event fill rate efficiency

#### **B. Feedback Rating Algorithm**
```sql
feedback_score = ROUND((avg_feedback_rating / 5.0) × 25)
-- Fallback: feedback_score = MIN(15, completed_events × 2)
```
- **Type**: Linear scaling with fallback heuristic
- **Purpose**: Converts 1-5 rating to 0-25 score

#### **C. Completion Rate Algorithm**
```sql
completion_score = ROUND((completed_events / total_events) × 15)
```
- **Type**: Percentage-based scoring
- **Purpose**: Measures reliability

#### **D. Engagement Algorithm**
```sql
engagement_score = MIN(15, ROUND((total_registrations / total_events) / 10 × 15))
```
- **Type**: Average-based scoring with normalization
- **Purpose**: Measures average student interest

#### **E. Sentiment Analysis Algorithm**
```sql
sentiment_score = ROUND((positive_feedback_count / total_feedback_count) × 10)
```
- **Type**: Ratio-based sentiment scoring
- **Purpose**: Measures student satisfaction

#### **F. Activity Consistency Algorithm**
```sql
consistency_score = MIN(10, recent_events_count × 2)
```
- **Type**: Linear scoring with cap
- **Purpose**: Rewards recent activity

---

## 🤖 **AI-Powered Algorithms**

### **2. AI Club Analysis Algorithm**
**Location**: `src/lib/aiOnlyClubRanking.ts`

**Algorithm Type**: Natural Language Processing + Machine Learning Inference

**Process Flow**:
```
Input Data → Prompt Engineering → LLM Processing → Response Parsing → Score Calculation
```

#### **A. Prompt Engineering Algorithm**
```javascript
buildClubAnalysisPrompt(club) {
  // Context-aware prompt construction
  // Includes club metrics, contextual factors, scoring criteria
  // Structured output format specification
}
```
- **Type**: Template-based prompt generation
- **Purpose**: Optimize AI input for consistent analysis

#### **B. AI Response Parsing Algorithm**
```javascript
parseAIAnalysis(aiResponse, club) {
  // JSON extraction from natural language
  // Data validation and sanitization
  // Fallback scoring for invalid responses
}
```
- **Type**: Pattern matching + validation
- **Purpose**: Extract structured data from AI output

#### **C. Fallback Scoring Algorithm**
```javascript
getFallbackAnalysis(club) {
  // Rule-based scoring when AI fails
  // Heuristic-based insight generation
  // Risk assessment based on thresholds
}
```
- **Type**: Rule-based expert system
- **Purpose**: Ensure system reliability

---

## 🔍 **Search and Filtering Algorithms**

### **3. Real-time Search Algorithm**
**Location**: Various components with search functionality

**Algorithm Type**: Client-side filtering with debouncing

```javascript
// Debounced search algorithm
const debouncedSearch = useMemo(
  () => debounce((query) => {
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredItems(filtered);
  }, 300),
  [items]
);
```
- **Type**: String matching with debouncing
- **Purpose**: Efficient real-time search

### **4. Multi-Criteria Filtering Algorithm**
```javascript
const filterClubs = (clubs, filters) => {
  return clubs.filter(club => {
    return (
      (!filters.category || club.category === filters.category) &&
      (!filters.minScore || club.score >= filters.minScore) &&
      (!filters.status || club.status === filters.status)
    );
  });
};
```
- **Type**: Conjunctive filtering (AND logic)
- **Purpose**: Multi-dimensional data filtering

---

## 📈 **Sorting and Ranking Algorithms**

### **5. Dynamic Ranking Algorithm**
**Location**: Club rankings components

```javascript
const sortClubs = (clubs, sortBy, order) => {
  return [...clubs].sort((a, b) => {
    let comparison = 0;
    
    switch(sortBy) {
      case 'score':
        comparison = b.aiScore - a.aiScore;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'events':
        comparison = b.total_events - a.total_events;
        break;
    }
    
    return order === 'desc' ? comparison : -comparison;
  });
};
```
- **Type**: Comparison-based sorting (QuickSort/MergeSort under the hood)
- **Purpose**: Dynamic ranking with multiple criteria

### **6. Rank Position Algorithm**
**Location**: `get_club_ranking_position()` SQL function

```sql
SELECT rank_position FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY performance_score DESC, name ASC) as rank_position
  FROM clubs WHERE performance_score > 0
) ranked_clubs WHERE id = club_id_param;
```
- **Type**: Window function ranking
- **Purpose**: Calculate exact rank position

---

## 📊 **Statistical Algorithms**

### **7. Aggregation Algorithms**
**Location**: `club_performance_analytics` view

#### **A. Average Calculation**
```sql
COALESCE(AVG(e.current_registrations), 0) as avg_registrations_per_event
COALESCE(AVG(ef.rating), 0) as avg_overall_rating
```
- **Type**: Arithmetic mean with null handling
- **Purpose**: Central tendency calculation

#### **B. Percentage Calculation**
```sql
ROUND((COUNT(CASE WHEN e.is_completed = true THEN 1 END)::DECIMAL / COUNT(e.id)) * 100, 1) as completion_rate_percentage
```
- **Type**: Ratio-to-percentage conversion
- **Purpose**: Normalized performance metrics

#### **C. Conditional Aggregation**
```sql
COUNT(CASE WHEN ef.rating >= 4 THEN 1 END) as positive_feedback_count
COUNT(CASE WHEN ef.rating <= 2 THEN 1 END) as negative_feedback_count
```
- **Type**: Conditional counting
- **Purpose**: Sentiment categorization

---

## 🔄 **Real-time Update Algorithms**

### **8. Database Trigger Algorithm**
**Location**: `trigger_update_club_score()` function

```sql
CREATE OR REPLACE FUNCTION trigger_update_club_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine affected club based on table
  -- Recalculate performance score
  -- Update club record
  RETURN COALESCE(NEW, OLD);
END;
```
- **Type**: Event-driven computation
- **Purpose**: Automatic score recalculation

### **9. Real-time Subscription Algorithm**
**Location**: Frontend notification system

```javascript
const subscribeToNotifications = () => {
  return supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, handleNewNotification)
    .subscribe();
};
```
- **Type**: Event-driven real-time updates
- **Purpose**: Live data synchronization

---

## 🎯 **Recommendation Algorithms**

### **10. AI Recommendation Algorithm**
**Location**: AI analysis system

```javascript
generateRecommendations(clubData, insights) {
  const recommendations = [];
  
  // Rule-based recommendations
  if (clubData.completion_rate < 70) {
    recommendations.push("Focus on completing scheduled events");
  }
  
  if (clubData.avg_rating < 3.5) {
    recommendations.push("Improve event quality based on feedback");
  }
  
  // AI-enhanced recommendations from LLM
  return [...recommendations, ...aiRecommendations];
}
```
- **Type**: Hybrid rule-based + AI recommendations
- **Purpose**: Actionable improvement suggestions

---

## 🔐 **Security Algorithms**

### **11. Row Level Security (RLS) Algorithm**
**Location**: Database policies

```sql
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);
```
- **Type**: Access control algorithm
- **Purpose**: Data security and privacy

### **12. Authentication Algorithm**
**Location**: Supabase Auth integration

```javascript
const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  // JWT token validation and session management
};
```
- **Type**: JWT-based authentication
- **Purpose**: Secure user authentication

---

## 📱 **UI/UX Algorithms**

### **13. Pagination Algorithm**
```javascript
const paginate = (items, page, itemsPerPage) => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return {
    items: items.slice(startIndex, endIndex),
    totalPages: Math.ceil(items.length / itemsPerPage),
    currentPage: page
  };
};
```
- **Type**: Array slicing with metadata
- **Purpose**: Efficient large dataset display

### **14. Debouncing Algorithm**
```javascript
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};
```
- **Type**: Time-based function throttling
- **Purpose**: Performance optimization for user input

### **15. Lazy Loading Algorithm**
```javascript
const useLazyLoading = (threshold = 100) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold }
    );
    // Intersection-based loading
  }, []);
};
```
- **Type**: Intersection-based loading
- **Purpose**: Performance optimization

---

## 🔄 **Data Processing Algorithms**

### **16. Data Transformation Algorithm**
```javascript
const transformClubData = (rawData) => {
  return rawData.map(club => ({
    ...club,
    scoreCategory: getScoreCategory(club.score),
    trendDirection: calculateTrend(club.historical_scores),
    riskLevel: assessRisk(club.metrics)
  }));
};
```
- **Type**: ETL (Extract, Transform, Load) pipeline
- **Purpose**: Data enrichment and formatting

### **17. Cache Management Algorithm**
```javascript
const cacheManager = {
  set: (key, data, ttl = 300000) => {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  
  get: (key) => {
    const item = JSON.parse(localStorage.getItem(key));
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data;
  }
};
```
- **Type**: TTL-based caching
- **Purpose**: Performance optimization

---

## 📊 **Summary of Algorithm Categories**

### **Performance & Analytics**:
1. ✅ Multi-criteria scoring algorithm
2. ✅ Statistical aggregation algorithms
3. ✅ Ranking and sorting algorithms
4. ✅ Trend analysis algorithms

### **AI & Machine Learning**:
5. ✅ Natural language processing
6. ✅ Prompt engineering algorithms
7. ✅ Fallback heuristic algorithms
8. ✅ Recommendation algorithms

### **Data Management**:
9. ✅ Real-time synchronization
10. ✅ Database trigger algorithms
11. ✅ Caching algorithms
12. ✅ Data transformation pipelines

### **User Experience**:
13. ✅ Search and filtering algorithms
14. ✅ Pagination algorithms
15. ✅ Debouncing algorithms
16. ✅ Lazy loading algorithms

### **Security**:
17. ✅ Authentication algorithms
18. ✅ Access control algorithms
19. ✅ Data validation algorithms

---

## 🎯 **Algorithm Complexity Analysis**

### **Time Complexity**:
- **Club scoring**: O(n) where n = number of events/feedback
- **Sorting**: O(n log n) for club rankings
- **Search**: O(n) for linear search, O(1) for cached results
- **AI analysis**: O(1) per club (external API call)

### **Space Complexity**:
- **Caching**: O(k) where k = cached items
- **Real-time subscriptions**: O(u) where u = active users
- **Data aggregation**: O(n) for temporary calculations

This comprehensive algorithm analysis shows that Campify uses a sophisticated blend of **traditional algorithms, AI/ML techniques, and modern web development patterns** to create an intelligent campus management system! 🚀