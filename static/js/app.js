/* ═══════════════════════════════════════════════════════════
   Universal Study Hub — App JS
   Grade Converter · Pomodoro Timer · Streak Tracker · Theme
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Theme Toggle ──────────────────────────────────────
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    function applyTheme(dark) {
        html.classList.toggle('dark', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }

    // Init theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        applyTheme(true);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            applyTheme(!html.classList.contains('dark'));
        });
    }

    // ── Mobile Menu ───────────────────────────────────────
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
        mobileMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        });
    }

    // ═══════════════════════════════════════════════════════
    // GRADE CONVERTER
    // ═══════════════════════════════════════════════════════
    const convertBtn = document.getElementById('convert-btn');
    if (convertBtn) {
        convertBtn.addEventListener('click', convertGrade);
    }

    function convertGrade() {
        const value = parseFloat(document.getElementById('grade-value').value);
        const fromScale = document.getElementById('from-scale').value;
        const toScale = document.getElementById('to-scale').value;
        const multInput = document.getElementById('multiplier').value;
        const multiplier = multInput ? parseFloat(multInput) : null;

        if (isNaN(value) || value < 0) {
            shakeElement(document.getElementById('grade-value'));
            return;
        }

        // Client-side calculation for speed
        let result, label, letterGrade;

        if (fromScale === '10-point' && toScale === 'percentage') {
            const m = multiplier || 9.5;
            result = (value * m).toFixed(2);
            label = `${value} × ${m} = ${result}%`;
            letterGrade = percentToLetter(parseFloat(result));
        } else if (fromScale === 'percentage' && toScale === '4.0-gpa') {
            result = percentToGPA(value).toFixed(2);
            label = `${value}% ≈ ${result} GPA (4.0 scale)`;
            letterGrade = gpaToLetter(parseFloat(result));
        } else if (fromScale === '10-point' && toScale === '4.0-gpa') {
            const m = multiplier || 9.5;
            const pct = value * m;
            result = percentToGPA(pct).toFixed(2);
            label = `${value} CGPA → ${pct.toFixed(2)}% → ${result} GPA`;
            letterGrade = gpaToLetter(parseFloat(result));
        } else if (fromScale === '4.0-gpa' && toScale === 'percentage') {
            result = (value * 25).toFixed(2);
            label = `${value} GPA ≈ ${result}%`;
            letterGrade = percentToLetter(parseFloat(result));
        } else {
            const m = multiplier || 1;
            result = (value * m).toFixed(2);
            label = `${value} × ${m} = ${result}`;
            letterGrade = '—';
        }

        showResult(result, label, letterGrade);
        saveLastGrade(result, label, letterGrade);
    }

    function percentToGPA(pct) {
        if (pct >= 90)  return 4.0;
        if (pct >= 80)  return 3.5 + (pct - 80) * 0.05;
        if (pct >= 70)  return 3.0 + (pct - 70) * 0.05;
        if (pct >= 60)  return 2.5 + (pct - 60) * 0.05;
        if (pct >= 50)  return 2.0 + (pct - 50) * 0.05;
        if (pct >= 40)  return 1.0 + (pct - 40) * 0.10;
        return 0;
    }

    function percentToLetter(pct) {
        if (pct >= 90) return 'A+';
        if (pct >= 80) return 'A';
        if (pct >= 70) return 'B+';
        if (pct >= 60) return 'B';
        if (pct >= 50) return 'C';
        if (pct >= 40) return 'D';
        return 'F';
    }

    function gpaToLetter(gpa) {
        if (gpa >= 3.7) return 'A';
        if (gpa >= 3.3) return 'A-';
        if (gpa >= 3.0) return 'B+';
        if (gpa >= 2.7) return 'B';
        if (gpa >= 2.3) return 'B-';
        if (gpa >= 2.0) return 'C+';
        if (gpa >= 1.7) return 'C';
        if (gpa >= 1.0) return 'D';
        return 'F';
    }

    function showResult(result, label, letterGrade) {
        const container = document.getElementById('converter-result');
        const badge = document.getElementById('result-badge');
        const labelEl = document.getElementById('result-label');
        const letterEl = document.getElementById('result-letter');
        if (!container) return;
        badge.textContent = result;
        labelEl.textContent = label;
        letterEl.textContent = `Letter Grade: ${letterGrade}`;
        container.classList.remove('hidden');
        // Re-trigger animation
        badge.style.animation = 'none';
        badge.offsetHeight; // reflow
        badge.style.animation = '';
    }

    function saveLastGrade(result, label, letterGrade) {
        localStorage.setItem('lastGrade', JSON.stringify({ result, label, letterGrade, date: new Date().toISOString() }));
        updateStats();
    }

    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => el.style.animation = '', 400);
    }

    // ═══════════════════════════════════════════════════════
    // POMODORO TIMER
    // ═══════════════════════════════════════════════════════
    const CIRCUMFERENCE = 2 * Math.PI * 115; // ~722.57
    let timerDuration = 25 * 60; // seconds
    let timerRemaining = timerDuration;
    let timerInterval = null;
    let timerRunning = false;

    const timeDisplay = document.getElementById('timer-time');
    const statusDisplay = document.getElementById('timer-status');
    const progressCircle = document.getElementById('timer-progress');
    const timerRing = document.getElementById('timer-ring');
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resumeBtn = document.getElementById('timer-resume');
    const resetBtn = document.getElementById('timer-reset');
    const customWrap = document.getElementById('custom-input-wrap');
    const customInput = document.getElementById('custom-minutes');

    // Preset chips
    document.querySelectorAll('.preset-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('preset-chip--active'));
            chip.classList.add('preset-chip--active');

            const mins = chip.dataset.minutes;
            if (mins === 'custom') {
                customWrap && customWrap.classList.remove('hidden');
            } else {
                customWrap && customWrap.classList.add('hidden');
                setTimerDuration(parseInt(mins));
            }
        });
    });

    if (customInput) {
        customInput.addEventListener('change', () => {
            const v = parseInt(customInput.value);
            if (v > 0 && v <= 180) setTimerDuration(v);
        });
    }

    function setTimerDuration(mins) {
        if (timerRunning) return;
        timerDuration = mins * 60;
        timerRemaining = timerDuration;
        updateTimerDisplay();
        updateProgress();
    }

    function updateTimerDisplay() {
        if (!timeDisplay) return;
        const m = Math.floor(timerRemaining / 60);
        const s = timerRemaining % 60;
        timeDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function updateProgress() {
        if (!progressCircle) return;
        const fraction = 1 - (timerRemaining / timerDuration);
        progressCircle.style.strokeDashoffset = CIRCUMFERENCE * (1 - fraction);
    }

    function startTimer() {
        if (timerRunning) return;
        timerRunning = true;
        if (statusDisplay) statusDisplay.textContent = 'Focusing…';
        if (startBtn) startBtn.classList.add('hidden');
        if (pauseBtn) pauseBtn.classList.remove('hidden');
        if (resumeBtn) resumeBtn.classList.add('hidden');
        if (timerRing) timerRing.querySelector('svg').classList.add('pulse-glow');

        timerInterval = setInterval(() => {
            timerRemaining--;
            updateTimerDisplay();
            updateProgress();
            if (timerRemaining <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                onTimerComplete();
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        if (statusDisplay) statusDisplay.textContent = 'Paused';
        if (pauseBtn) pauseBtn.classList.add('hidden');
        if (resumeBtn) resumeBtn.classList.remove('hidden');
        if (timerRing) timerRing.querySelector('svg').classList.remove('pulse-glow');
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        timerRemaining = timerDuration;
        updateTimerDisplay();
        updateProgress();
        if (statusDisplay) statusDisplay.textContent = 'Ready';
        if (startBtn) startBtn.classList.remove('hidden');
        if (pauseBtn) pauseBtn.classList.add('hidden');
        if (resumeBtn) resumeBtn.classList.add('hidden');
        if (timerRing) timerRing.querySelector('svg').classList.remove('pulse-glow');
    }

    function onTimerComplete() {
        if (statusDisplay) statusDisplay.textContent = '🎉 Done!';
        if (startBtn) startBtn.classList.remove('hidden');
        if (pauseBtn) pauseBtn.classList.add('hidden');
        if (resumeBtn) resumeBtn.classList.add('hidden');
        if (timerRing) timerRing.querySelector('svg').classList.remove('pulse-glow');

        // Record session in localStorage
        recordStudySession(timerDuration / 60);

        // Notification sound (Web Audio)
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.5);
                osc.connect(gain).connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.2);
                osc.stop(ctx.currentTime + i * 0.2 + 0.5);
            });
        } catch (e) { /* silent fail */ }
    }

    if (startBtn) startBtn.addEventListener('click', startTimer);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
    if (resumeBtn) resumeBtn.addEventListener('click', startTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);

    // Init display
    updateTimerDisplay();
    updateProgress();

    // ═══════════════════════════════════════════════════════
    // STUDY STREAK & STATS (localStorage)
    // ═══════════════════════════════════════════════════════
    function getStudySessions() {
        try {
            return JSON.parse(localStorage.getItem('studySessions') || '[]');
        } catch { return []; }
    }

    function recordStudySession(minutes) {
        const sessions = getStudySessions();
        sessions.push({
            date: new Date().toISOString().slice(0, 10),
            minutes: minutes,
            timestamp: Date.now()
        });
        localStorage.setItem('studySessions', JSON.stringify(sessions));
        updateStreakGrid();
        updateStats();
    }

    function updateStreakGrid() {
        const grid = document.getElementById('streak-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const sessions = getStudySessions();
        const today = new Date();
        const dateMap = {};

        sessions.forEach(s => {
            dateMap[s.date] = (dateMap[s.date] || 0) + (s.minutes || 25);
        });

        // Compute streak
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            if (dateMap[key]) { streak++; } else if (i > 0) { break; }
        }
        const streakEl = document.getElementById('streak-count');
        if (streakEl) streakEl.textContent = streak;

        // Build 28-day grid
        for (let i = 27; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const mins = dateMap[key] || 0;

            const cell = document.createElement('div');
            cell.className = 'streak-cell';
            if (i === 0) cell.classList.add('streak-cell--today');

            if (mins > 0) {
                cell.classList.add('streak-cell--active');
                if (mins >= 120) cell.classList.add('streak-cell--level-4');
                else if (mins >= 75) cell.classList.add('streak-cell--level-3');
                else if (mins >= 40) cell.classList.add('streak-cell--level-2');
                else cell.classList.add('streak-cell--level-1');
            }

            cell.title = `${key}: ${mins} min`;
            grid.appendChild(cell);
        }
    }

    function updateStats() {
        const sessions = getStudySessions();
        const today = new Date().toISOString().slice(0, 10);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const todayCount = sessions.filter(s => s.date === today).length;
        const weekCount = sessions.filter(s => new Date(s.date) >= weekStart).length;
        const totalMin = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);

        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        el('stat-today', `${todayCount} session${todayCount !== 1 ? 's' : ''}`);
        el('stat-week', `${weekCount} session${weekCount !== 1 ? 's' : ''}`);
        el('stat-total', `${totalMin} min`);

        // Last grade
        try {
            const lg = JSON.parse(localStorage.getItem('lastGrade'));
            if (lg) el('stat-last-grade', `${lg.result} (${lg.letterGrade})`);
        } catch { /* ignore */ }
    }

    // Init on page load
    updateStreakGrid();
    updateStats();

})();
