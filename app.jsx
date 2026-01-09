const { useState, useEffect, useRef } = React;

// Question generator
const generateQuestion = () => {
    const types = [
        {
            type: 'basic',
            generate: () => {
                const percent = [10, 25, 50, 75][Math.floor(Math.random() * 4)];
                const number = [20, 40, 60, 80, 100][Math.floor(Math.random() * 5)];
                const answer = (percent / 100) * number;
                const wrongAnswers = [
                    answer + 10,
                    answer - 10,
                    answer + 5,
                    Math.floor(number * (percent / 100) + 1)
                ].filter(a => a > 0 && a !== answer);
                
                return {
                    question: `What is ${percent}% of ${number}?`,
                    correctAnswer: answer,
                    options: [answer, ...wrongAnswers.slice(0, 3)].sort(() => Math.random() - 0.5)
                };
            }
        },
        {
            type: 'reverse',
            generate: () => {
                const number = [20, 40, 60, 80, 100][Math.floor(Math.random() * 5)];
                const percent = [10, 25, 50, 75][Math.floor(Math.random() * 4)];
                const half = number / 2;
                const answer = percent;
                
                return {
                    question: `Half of ${number} is the same as what percent?`,
                    correctAnswer: 50,
                    options: [50, 25, 75, 10].sort(() => Math.random() - 0.5)
                };
            }
        },
        {
            type: 'calculation',
            generate: () => {
                const percent = [10, 25, 50, 75][Math.floor(Math.random() * 4)];
                const number = [20, 40, 60, 80, 100][Math.floor(Math.random() * 5)];
                const answer = (percent / 100) * number;
                
                return {
                    question: `${percent}% of ${number} equals?`,
                    correctAnswer: answer,
                    options: [
                        answer,
                        answer + 5,
                        answer - 5,
                        Math.floor(number * 0.3)
                    ].filter(a => a > 0).sort(() => Math.random() - 0.5)
                };
            }
        }
    ];
    
    const selectedType = types[Math.floor(Math.random() * types.length)];
    return selectedType.generate();
};

// Racer Selection Component
const RacerSelection = ({ onStart }) => {
    const [selectedRacer, setSelectedRacer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('MATH');
    
    const racers = [
        { id: 'car', name: 'Car Racer', icon: '🚗' },
        { id: 'animal', name: 'Animal Racer', icon: '🐆' },
        { id: 'robot', name: 'Robot Racer', icon: '🤖' }
    ];
    
    const handleStart = () => {
        if (selectedRacer) {
            onStart(selectedRacer);
        }
    };
    
    return (
        <div className="home-screen">
            <input
                type="text"
                className="search-bar"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="category-tabs">
                <button
                    className={`category-tab ${activeCategory === 'MATH' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('MATH')}
                >
                    MATH
                </button>
                <button
                    className={`category-tab ${activeCategory === 'SCIENCE' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('SCIENCE')}
                >
                    SCIENCE
                </button>
            </div>
            
            <div className="grade-selector">
                {[3, 4, 5].map(grade => (
                    <div key={grade} className="grade-circle active">
                        {grade}
                    </div>
                ))}
            </div>
            
            <div className="racer-grid">
                {racers.map(racer => (
                    <div
                        key={racer.id}
                        className={`racer-card ${selectedRacer?.id === racer.id ? 'selected' : ''}`}
                        onClick={() => setSelectedRacer(racer)}
                    >
                        <div className="racer-icon">{racer.icon}</div>
                        <div className="racer-title">{racer.name}</div>
                    </div>
                ))}
            </div>
            
            <button
                className="start-button"
                onClick={handleStart}
                disabled={!selectedRacer}
            >
                START
            </button>
        </div>
    );
};

// Gameplay Component
const Gameplay = ({ selectedRacer, onGameOver }) => {
    const [timeLeft, setTimeLeft] = useState(90);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionTimeLeft, setQuestionTimeLeft] = useState(10);
    const [racerPosition, setRacerPosition] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showEncouragement, setShowEncouragement] = useState(null);
    const [gameActive, setGameActive] = useState(true);
    const racerRef = useRef(null);
    
    // Initialize first question
    useEffect(() => {
        if (gameActive) {
            setCurrentQuestion(generateQuestion());
        }
    }, [gameActive]);
    
    // Check for win condition (racer reaches finish)
    useEffect(() => {
        if (racerPosition >= 100 && gameActive) {
            setGameActive(false);
            setTimeout(() => {
                onGameOver(score);
            }, 1000);
        }
    }, [racerPosition, gameActive, score, onGameOver]);
    
    // Main game timer
    useEffect(() => {
        if (!gameActive || timeLeft <= 0) {
            if (timeLeft <= 0) {
                onGameOver(score);
            }
            return;
        }
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setGameActive(false);
                    onGameOver(score);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(timer);
    }, [timeLeft, gameActive, score, onGameOver]);
    
    // Question timer
    useEffect(() => {
        if (!gameActive || !currentQuestion || selectedAnswer !== null) return;
        
        const questionTimer = setInterval(() => {
            setQuestionTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up - treat as wrong answer
                    if (currentQuestion) {
                        handleAnswer(-1, false);
                    }
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(questionTimer);
    }, [currentQuestion, selectedAnswer, gameActive]);
    
    const handleAnswer = (answer, isCorrect) => {
        if (selectedAnswer !== null && selectedAnswer !== -1) return;
        
        setSelectedAnswer(answer);
        
        if (isCorrect) {
            setScore(prev => prev + 50);
            setRacerPosition(prev => Math.min(prev + 20, 100));
            setShowEncouragement('Great thinking!');
            
            // Speed boost animation
            if (racerRef.current) {
                racerRef.current.classList.add('speed-boost');
                setTimeout(() => {
                    racerRef.current.classList.remove('speed-boost');
                }, 500);
            }
        } else {
            setShowEncouragement('Try again!');
            setRacerPosition(prev => Math.max(prev - 5, 0));
        }
        
        setTimeout(() => {
            setSelectedAnswer(null);
            setQuestionTimeLeft(10);
            setShowEncouragement(null);
            setCurrentQuestion(generateQuestion());
        }, 2000);
    };
    
    const getPositionText = () => {
        if (racerPosition >= 100) return '1st Place! 🏁';
        if (racerPosition >= 75) return '1st';
        if (racerPosition >= 50) return '2nd';
        return '3rd';
    };
    
    const racerTop = 100 - racerPosition;
    
    return (
        <div className="gameplay-screen">
            <div className="game-header">
                <div className="timer-display">
                    <div className="timer-label">TIME</div>
                    <div className="timer-value">{timeLeft}</div>
                </div>
                <div className="score-display">
                    <div className="score-label">SCORE</div>
                    <div className="score-value">{score}</div>
                </div>
            </div>
            
            <div className="game-content">
                <div className="race-track-container">
                    <div className="race-track">
                        <div className="finish-line"></div>
                        {[0, 1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className="track-lane"
                                style={{ top: `${i * 20}%` }}
                            ></div>
                        ))}
                        <div
                            ref={racerRef}
                            className="racer"
                            style={{
                                top: `${Math.max(0, Math.min(racerTop, 100))}%`,
                                left: '10%'
                            }}
                        >
                            {selectedRacer?.icon || '🚗'}
                        </div>
                    </div>
                    <div className="race-progress">
                        <div className="position-indicator">{getPositionText()}</div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${racerPosition}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                
                <div className="question-board">
                    {currentQuestion && (
                        <>
                            <div className="question-text">
                                {currentQuestion.question}
                            </div>
                            <div className="answer-options">
                                {currentQuestion.options.map((option, index) => {
                                    const isCorrect = option === currentQuestion.correctAnswer;
                                    const isSelected = selectedAnswer === option;
                                    let buttonClass = 'answer-button';
                                    
                                    if (selectedAnswer !== null) {
                                        if (isCorrect) {
                                            buttonClass += ' correct';
                                        } else if (isSelected) {
                                            buttonClass += ' wrong';
                                        }
                                    }
                                    
                                    return (
                                        <button
                                            key={index}
                                            className={buttonClass}
                                            onClick={() => handleAnswer(option, isCorrect)}
                                            disabled={selectedAnswer !== null}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '18px', color: '#0a4d4d' }}>
                                Time: {questionTimeLeft}s
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {showEncouragement && (
                <div className="encouragement-text">{showEncouragement}</div>
            )}
        </div>
    );
};

// Game Over Component
const GameOver = ({ score, onRestart }) => {
    return (
        <div className="game-over-screen">
            <div className="game-over-card">
                <div className="game-over-title">Race Complete! 🏁</div>
                <div style={{ fontSize: '20px', color: '#0a4d4d', marginBottom: '10px' }}>
                    Great job learning about percentages!
                </div>
                <div className="final-score">Score: {score}</div>
                <button className="restart-button" onClick={onRestart}>
                    Play Again
                </button>
            </div>
        </div>
    );
};

// Main App Component
const App = () => {
    const [screen, setScreen] = useState('home'); // 'home', 'gameplay', 'gameover'
    const [selectedRacer, setSelectedRacer] = useState(null);
    const [finalScore, setFinalScore] = useState(0);
    
    const handleStart = (racer) => {
        setSelectedRacer(racer);
        setScreen('gameplay');
    };
    
    const handleGameOver = (score) => {
        setFinalScore(score);
        setScreen('gameover');
    };
    
    const handleRestart = () => {
        setScreen('home');
        setSelectedRacer(null);
        setFinalScore(0);
    };
    
    return (
        <>
            {screen === 'home' && <RacerSelection onStart={handleStart} />}
            {screen === 'gameplay' && (
                <Gameplay
                    selectedRacer={selectedRacer}
                    onGameOver={handleGameOver}
                />
            )}
            {screen === 'gameover' && (
                <GameOver score={finalScore} onRestart={handleRestart} />
            )}
        </>
    );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

