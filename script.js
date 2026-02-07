/**
 * UnitFlow Core Logic
 * Handles conversions, UI updates, and persistence.
 */

// 1. Conversion Data
const unitsData = {
    length: {
        meters: 1,
        kilometers: 0.001,
        centimeters: 100,
        millimeters: 1000,
        miles: 0.000621371,
        yards: 1.09361,
        feet: 3.28084,
        inches: 39.3701
    },
    weight: {
        kilograms: 1,
        grams: 1000,
        milligrams: 1000000,
        pounds: 2.20462,
        ounces: 35.274,
        metric_tons: 0.001
    },
    temperature: {
        units: ['celsius', 'fahrenheit', 'kelvin']
    },
    area: {
        square_meters: 1,
        square_kilometers: 0.000001,
        square_miles: 3.861e-7,
        square_yards: 1.19599,
        square_feet: 10.7639,
        acres: 0.000247105,
        hectares: 0.0001
    },
    volume: {
        liters: 1,
        milliliters: 1000,
        cubic_meters: 0.001,
        gallons: 0.264172,
        quarts: 1.05669,
        pints: 2.11338,
        cups: 4.22675
    },
    speed: {
        meters_per_second: 1,
        kilometers_per_hour: 3.6,
        miles_per_hour: 2.23694,
        knots: 1.94384,
        feet_per_second: 3.28084
    },
    time: {
        seconds: 1,
        milliseconds: 1000,
        minutes: 1/60,
        hours: 1/3600,
        days: 1/86400,
        weeks: 1/604800,
        years: 1/31536000
    },
    data: {
        bits: 8,
        bytes: 1,
        kilobytes: 0.0009765625,
        megabytes: 9.5367e-7,
        gigabytes: 9.3132e-10,
        terabytes: 9.0949e-13
    }
};

// 2. DOM Elements
const categorySelect = document.getElementById('category');
const fromUnitSelect = document.getElementById('from-unit');
const toUnitSelect = document.getElementById('to-unit');
const fromInput = document.getElementById('from-value');
const toInput = document.getElementById('to-value');
const swapBtn = document.getElementById('swap-btn');
const themeToggle = document.getElementById('theme-toggle');
const precisionRange = document.getElementById('precision');
const precisionVal = document.getElementById('precision-val');
const formulaText = document.getElementById('formula-text');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const backToTopBtn = document.getElementById('back-to-top');

// 3. State Management
let currentCategory = 'length';
let history = JSON.parse(localStorage.getItem('unitflow_history')) || [];

// 4. Core Functions

const updateUnits = () => {
    const category = categorySelect.value;
    currentCategory = category;
    
    // Clear existing options
    fromUnitSelect.innerHTML = '';
    toUnitSelect.innerHTML = '';
    
    let units;
    if (category === 'temperature') {
        units = unitsData.temperature.units;
    } else {
        units = Object.keys(unitsData[category]);
    }
    
    units.forEach((unit, index) => {
        const option1 = document.createElement('option');
        const option2 = document.createElement('option');
        
        const formattedUnit = unit.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        option1.value = unit;
        option1.textContent = formattedUnit;
        option2.value = unit;
        option2.textContent = formattedUnit;
        
        fromUnitSelect.appendChild(option1);
        toUnitSelect.appendChild(option2);
    });
    
    // Set default TO unit to second item if available
    if (toUnitSelect.options.length > 1) {
        toUnitSelect.selectedIndex = 1;
    }
    
    convertValue();
};

const convertValue = () => {
    const value = parseFloat(fromInput.value);
    const fromUnit = fromUnitSelect.value;
    const toUnit = toUnitSelect.value;
    const precision = parseInt(precisionRange.value);
    
    if (isNaN(value)) {
        toInput.value = '';
        formulaText.textContent = 'Enter a value to see conversion';
        return;
    }
    
    let result;
    
    // Temperature Logic
    if (currentCategory === 'temperature') {
        result = convertTemperature(value, fromUnit, toUnit);
    } else {
        // Generic Conversion Logic (Base Unit approach)
        const rates = unitsData[currentCategory];
        const baseValue = value / rates[fromUnit];
        result = baseValue * rates[toUnit];
    }
    
    const formattedResult = result.toFixed(precision);
    toInput.value = formattedResult;
    
    updateFormula(fromUnit, toUnit);
    saveToHistory(value, fromUnit, result, toUnit);
};

const convertTemperature = (value, from, to) => {
    if (from === to) return value;
    
    let celsius;
    // To Celsius
    if (from === 'celsius') celsius = value;
    else if (from === 'fahrenheit') celsius = (value - 32) * 5/9;
    else if (from === 'kelvin') celsius = value - 273.15;
    
    // From Celsius to target
    if (to === 'celsius') return celsius;
    else if (to === 'fahrenheit') return (celsius * 9/5) + 32;
    else if (to === 'kelvin') return celsius + 273.15;
    
    return value;
};

const updateFormula = (from, to) => {
    if (currentCategory === 'temperature') {
        formulaText.textContent = `Conversion depends on formula (${from} to ${to})`;
        return;
    }
    
    const rates = unitsData[currentCategory];
    const ratio = (1 / rates[from]) * rates[to];
    const fromName = from.replace(/_/g, ' ');
    const toName = to.replace(/_/g, ' ');
    
    formulaText.textContent = `1 ${fromName} = ${ratio.toFixed(4)} ${toName}`;
};

const swapUnits = () => {
    const temp = fromUnitSelect.value;
    fromUnitSelect.value = toUnitSelect.value;
    toUnitSelect.value = temp;
    
    // If there's a result in TO input, we might want to swap value too? 
    // Usually users swap to see the reverse. Let's just trigger conversion.
    convertValue();
};

// 5. Themes & Persistence

const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme', !isDark);
    localStorage.setItem('unitflow_theme', isDark ? 'dark' : 'light');
};

const loadPreferences = () => {
    const theme = localStorage.getItem('unitflow_theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
    
    const lastCategory = localStorage.getItem('unitflow_last_category');
    if (lastCategory) {
        categorySelect.value = lastCategory;
    }
    
    updateUnits();
    renderHistory();
};

const saveToHistory = (fromVal, fromUnit, toVal, toUnit) => {
    // Only save if it's a significant action (e.g., typing finished or specific trigger)
    // To avoid spamming, we could use a debounced approach or just manual button.
    // However, the prompt asks for real-time. We'll store the object and filter duplicates later.
};

// Simple History Logic (Manual Save or Last Used)
const addToHistoryUI = (fromVal, fromUnit, toVal, toUnit) => {
    const item = {
        id: Date.now(),
        fromVal,
        fromUnit,
        toVal: toVal.toFixed(2),
        toUnit,
        category: currentCategory
    };
    
    history.unshift(item);
    history = history.slice(0, 5); // Keep last 5
    localStorage.setItem('unitflow_history', JSON.stringify(history));
    renderHistory();
};

const renderHistory = () => {
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-msg">No recent conversions</p>';
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item" onclick="reuseHistory(${item.fromVal}, '${item.fromUnit}', '${item.toUnit}', '${item.category}')">
            <span>${item.fromVal} ${item.fromUnit}</span>
            <i data-lucide="arrow-right" style="width: 14px"></i>
            <span>${item.toVal} ${item.toUnit}</span>
        </div>
    `).join('');
    
    lucide.createIcons();
};

window.reuseHistory = (val, from, to, cat) => {
    categorySelect.value = cat;
    currentCategory = cat;
    updateUnits();
    fromUnitSelect.value = from;
    toUnitSelect.value = to;
    fromInput.value = val;
    convertValue();
};

// 6. Event Listeners

categorySelect.addEventListener('change', () => {
    localStorage.setItem('unitflow_last_category', categorySelect.value);
    updateUnits();
});

fromInput.addEventListener('input', convertValue);
fromUnitSelect.addEventListener('change', convertValue);
toUnitSelect.addEventListener('change', convertValue);

swapBtn.addEventListener('click', swapUnits);

themeToggle.addEventListener('click', toggleTheme);

precisionRange.addEventListener('input', (e) => {
    precisionVal.textContent = e.target.value;
    convertValue();
});

clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('unitflow_history');
    renderHistory();
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Debounced history save (optional to avoid spam)
let historyTimeout;
fromInput.addEventListener('input', () => {
    clearTimeout(historyTimeout);
    historyTimeout = setTimeout(() => {
        const val = parseFloat(fromInput.value);
        if (!isNaN(val)) {
            const result = parseFloat(toInput.value);
            addToHistoryUI(val, fromUnitSelect.value, result, toUnitSelect.value);
        }
    }, 1500); // Save after 1.5s of inactivity
});

// Initial Load
document.addEventListener('DOMContentLoaded', loadPreferences);
