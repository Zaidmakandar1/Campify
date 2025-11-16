# Ollama Setup for Campify AI Analytics

## What is Ollama?

Ollama is a tool that lets you run large language models locally on your machine. Campify uses it to provide AI-powered insights, club rankings, and personalized recommendations.

## Installation Steps

### 1. Install Ollama

**Windows:**
- Download from: https://ollama.ai/download/windows
- Run the installer
- Ollama will start automatically

**macOS:**
- Download from: https://ollama.ai/download/mac
- Drag to Applications folder
- Run Ollama from Applications

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Install a Model

After installing Ollama, open a terminal/command prompt and run:

```bash
# Install the recommended model (3B parameters - good balance of speed/quality)
ollama pull llama3.2:3b

# Alternative: Smaller, faster model
ollama pull llama3.2:1b

# Alternative: Larger, more capable model (requires more RAM)
ollama pull llama3.2:7b
```

### 3. Verify Installation

Check if Ollama is running:
```bash
ollama list
```

You should see your installed model listed.

### 4. Configure Campify

The app is already configured to use:
- **URL**: `http://localhost:11434` (Ollama's default)
- **Model**: `llama3.2:3b`

If you want to use a different model, update your `.env` file:
```env
VITE_OLLAMA_MODEL="llama3.2:1b"  # or your preferred model
```

## Features Powered by AI

When Ollama is running, Campify will use AI for:

### 🏆 Club Rankings
- Analyzes event attendance, member engagement, and feedback mentions
- Provides intelligent insights and recommendations for each club
- Calculates dynamic performance scores

### 👤 Personal Insights
- Analyzes your activity patterns
- Provides personalized recommendations
- Suggests clubs and events based on your interests

### 📊 Feedback Analysis
- Sentiment analysis of student feedback
- Identifies trends and priority issues
- Generates actionable insights for administrators

### 🎯 Smart Recommendations
- Event suggestions based on your preferences
- Club recommendations for students
- Engagement strategies for club organizers

## Troubleshooting

### Ollama Not Starting
1. Check if the service is running: `ollama serve`
2. Restart Ollama application
3. Check firewall settings (allow port 11434)

### Model Not Found
```bash
# List available models
ollama list

# Pull the model if missing
ollama pull llama3.2:3b
```

### Performance Issues
- Use a smaller model: `llama3.2:1b`
- Ensure you have enough RAM (4GB+ recommended)
- Close other applications to free up memory

### Connection Issues
- Verify Ollama is running on `http://localhost:11434`
- Check if port 11434 is available
- Try restarting Ollama

## Fallback Mode

If Ollama is not available, Campify will automatically fall back to rule-based analytics. You'll still get:
- Basic club rankings
- Simple user insights
- Standard feedback analysis

The AI features will be restored once Ollama is running again.

## System Requirements

- **RAM**: 4GB minimum, 8GB+ recommended
- **Storage**: 2-4GB for models
- **CPU**: Modern processor (2019+)
- **OS**: Windows 10+, macOS 11+, or Linux

## Model Comparison

| Model | Size | RAM Usage | Speed | Quality |
|-------|------|-----------|-------|---------|
| llama3.2:1b | 1.3GB | 2-3GB | Fast | Good |
| llama3.2:3b | 2.0GB | 4-5GB | Medium | Better |
| llama3.2:7b | 4.1GB | 8-10GB | Slow | Best |

Choose based on your system capabilities and performance needs.