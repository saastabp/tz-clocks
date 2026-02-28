// Clock class
class TimeZoneClock {
    constructor(id, name, hourInputId, minuteInputId, tz, app) {
        this.id = id;
        this.name = name;
        this.hourInput = document.getElementById(hourInputId);
        this.minuteInput = document.getElementById(minuteInputId);
        this.tz = tz; // Timezone string (e.g., 'US/Pacific')
        this.date = new Date(); // Store time in UTC
        this.app = app; // Reference to ClockApp for synchronization

        // Remove the up/down arrows from number inputs
        this.hourInput.classList.add('no-spinner');
        this.minuteInput.classList.add('no-spinner');

        // Add event listeners for manual time entry
        this.hourInput.addEventListener('input', () => this.handleManualInput());
        this.minuteInput.addEventListener('input', () => this.handleManualInput());
        this.hourInput.addEventListener('blur', () => this.validateAndSync());
        this.minuteInput.addEventListener('blur', () => this.validateAndSync());

        // Add Enter key support to blur the input
        this.hourInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.hourInput.blur();
            }
        });
        this.minuteInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.minuteInput.blur();
            }
        });
    }

    // Set to current time
    setCurrentTime() {
        this.date = new Date();
        this.updateDisplay();
    }

    // Adjust time by adding minutes (positive or negative)
    adjustTime(minutesToAdd) {
        // Create a new date by adding minutes to the current time
        this.date = new Date(this.date.getTime() + (minutesToAdd * 60000));
        this.updateDisplay();
    }

    // Get timezone offset in minutes for the current date
    getTimezoneOffset() {
        const utcDate = new Date(this.date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(this.date.toLocaleString('en-US', { timeZone: this.tz }));
        return (utcDate.getTime() - tzDate.getTime()) / (60 * 1000);
    }

    // Get the AM/PM indicator
    getAmPmIndicator() {
        // Create a date formatter that includes all time components
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: this.tz,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false
        });

        // Get the date parts in the specified timezone
        const dateParts = formatter.formatToParts(this.date);
        const timezoneDateObj = {};

        // Extract the parts into an object for easier access
        dateParts.forEach(part => {
            if (part.type !== 'literal') {
                timezoneDateObj[part.type] = parseInt(part.value, 10);
            }
        });

        // Get the hour in the specified timezone
        const hour = timezoneDateObj.hour;

        // If the hour is less than 12, return 'AM', otherwise return 'PM'
        return hour < 12 ? ' AM' : ' PM';
    }

    // Get localized time for display based on timezone
    getLocalizedTime() {
        // Format the date in the specified timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: this.tz,
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });

        // Get the date parts in the specified timezone
        const dateParts = formatter.formatToParts(this.date);
        const localTime = {};

        // Extract the parts into an object for easier access
        dateParts.forEach(part => {
            if (part.type !== 'literal') {
                localTime[part.type] = parseInt(part.value, 10);
            }
        });

        return {
            hours24: localTime.hour,
            minutes: localTime.minute
        };
    }

    // Update the display based on the current time adjusted for timezone
    updateDisplay() {
        // Get the localized time for this timezone
        const localTime = this.getLocalizedTime();
        const hours24 = localTime.hours24;
        const minutes = localTime.minutes;

        if (use24Hour) {
            // 24-hour format
            this.hourInput.value = hours24;
            // Remove any AM/PM indicator if present
            const amPmSpan = this.hourInput.parentElement.querySelector('.ampm');
            if (amPmSpan) amPmSpan.remove();
        } else {
            // 12-hour format
            const hour12 = hours24 % 12 || 12; // Convert 0 to 12 for midnight

            this.hourInput.value = hour12;

            // Update or add AM/PM indicator
            let amPmSpan = this.hourInput.parentElement.querySelector('.ampm');
            if (!amPmSpan) {
                amPmSpan = document.createElement('span');
                amPmSpan.className = 'ampm';
                this.hourInput.parentElement.appendChild(amPmSpan);
            }

            amPmSpan.textContent = this.getAmPmIndicator();
        }

        // Always format minutes with leading zero
        this.minuteInput.value = String(minutes).padStart(2, '0');
    }

    // Handle manual input - stop auto-update when user starts typing
    handleManualInput() {
        this.app.stopAutoUpdate();
    }

    // Validate and synchronize all clocks when user finishes editing
    validateAndSync() {
        const hourValue = parseInt(this.hourInput.value, 10);
        const minuteValue = parseInt(this.minuteInput.value, 10);

        // Validate input
        if (isNaN(hourValue) || isNaN(minuteValue)) {
            // If invalid, restore current time
            this.updateDisplay();
            return;
        }

        // Validate ranges based on format
        if (use24Hour) {
            if (hourValue < 0 || hourValue > 23 || minuteValue < 0 || minuteValue > 59) {
                this.updateDisplay();
                return;
            }
        } else {
            if (hourValue < 1 || hourValue > 12 || minuteValue < 0 || minuteValue > 59) {
                this.updateDisplay();
                return;
            }
        }

        // Set the time from the input values
        this.setTimeFromInput(hourValue, minuteValue);

        // Synchronize all other clocks
        this.app.syncFromClock(this);
    }

    // Set this clock's time from input values
    setTimeFromInput(hourInput, minuteInput) {
        // Get the current local time in this timezone
        const currentLocalTime = this.getLocalizedTime();
        const currentHours24 = currentLocalTime.hours24;
        const currentMinutes = currentLocalTime.minutes;

        // Convert input to 24-hour format
        let newHours24 = hourInput;
        if (!use24Hour) {
            const currentIsAM = currentHours24 < 12;
            const isPM = !currentIsAM;

            // Convert to 24-hour format keeping the current AM/PM period
            if (hourInput === 12) {
                newHours24 = isPM ? 12 : 0;
            } else {
                newHours24 = isPM ? hourInput + 12 : hourInput;
            }
        }

        // Calculate the time difference in minutes
        const currentTotalMinutes = currentHours24 * 60 + currentMinutes;
        const newTotalMinutes = newHours24 * 60 + minuteInput;
        let minutesDiff = newTotalMinutes - currentTotalMinutes;

        // Handle day boundary: if difference is more than 12 hours in either direction,
        // assume we crossed midnight
        if (minutesDiff > 12 * 60) {
            minutesDiff -= 24 * 60;  // Went back a day
        } else if (minutesDiff < -12 * 60) {
            minutesDiff += 24 * 60;  // Went forward a day
        }

        // Adjust the time by the calculated difference
        this.adjustTime(minutesDiff);
    }
}

// Cookie helpers for base timezone persistence
function setBaseClockCookie(timezoneId) {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = 'baseTimezoneId=' + timezoneId + ';expires=' + expires.toUTCString() + ';path=/;SameSite=Lax';
}

function getBaseClockCookie() {
    const match = document.cookie.match(/(?:^|;\s*)baseTimezoneId=([^;]*)/);
    return match ? match[1] : null;
}

// Global app controller
const ClockApp = {
    clocks: {},
    updateInterval: null,
    baseTimezoneId: 'hawaii',

    init: function() {
        this.loadBaseTimezone();
        this.createClocks();
        this.setupButtons();
        this.toggleArizonaClock();
        this.populateOffsetTables();
        this.resetClocks();
        this.addStyles();
    },

    loadBaseTimezone: function() {
        const saved = getBaseClockCookie();
        if (saved) {
            const configs = this.getTimeZoneConfigs();
            if (configs.some(c => c.id === saved)) {
                this.baseTimezoneId = saved;
            }
        }
        this.applyBaseClockHighlight();
    },

    setBaseTimezone: function(id) {
        this.baseTimezoneId = id;
        setBaseClockCookie(id);
        this.applyBaseClockHighlight();
        this.populateOffsetTables();
    },

    applyBaseClockHighlight: function() {
        document.querySelectorAll('.clock-header').forEach(header => {
            header.classList.remove('highlight');
        });
        const baseColumn = document.querySelector(`[data-tz-id="${this.baseTimezoneId}"]`);
        if (baseColumn) {
            baseColumn.querySelector('.clock-header').classList.add('highlight');
        }
    },

    // Add CSS for the no-spinner class
    addStyles: function() {
        const style = document.createElement('style');
        style.textContent = `
            .no-spinner::-webkit-inner-spin-button,
            .no-spinner::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            .no-spinner {
                -moz-appearance: textfield;
            }
        `;
        document.head.appendChild(style);
    },

    createClocks: function() {
        const configs = this.getTimeZoneConfigs();

        configs.forEach(config => {
            console.log("Adding clock: " + config.id);
            this.clocks[config.id] = new TimeZoneClock(
                config.id,
                config.name,
                config.hourInput,
                config.minuteInput,
                config.tz,
                this  // Pass reference to ClockApp
            );
        });
    },

    getTimeZoneConfigs: function() {
        // Base configurations with GMT offsets
        const zones = [
            { id: 'hawaii', name: 'HST', hourInput: 'hawaii-hour', minuteInput: 'hawaii-minute', tz: 'US/Hawaii' },
            { id: 'alaska', name: 'AKST', hourInput: 'alaska-hour', minuteInput: 'alaska-minute', tz: 'US/Alaska' },
            { id: 'us-pacific', name: 'PST', hourInput: 'us-pacific-hour', minuteInput: 'us-pacific-minute', tz: 'US/Pacific' },
            { id: 'arizona', name: 'MST', hourInput: 'arizona-hour', minuteInput: 'arizona-minute', tz: 'US/Arizona' },
            { id: 'us-mountain', name: 'MST', hourInput: 'us-mountain-hour', minuteInput: 'us-mountain-minute', tz: 'US/Mountain' },
            { id: 'us-central', name: 'CST', hourInput: 'us-central-hour', minuteInput: 'us-central-minute', tz: 'US/Central' },
            { id: 'us-eastern', name: 'EST', hourInput: 'us-eastern-hour', minuteInput: 'us-eastern-minute', tz: 'US/Eastern' },
            { id: 'united-kingdom', name: 'GMT', hourInput: 'united-kingdom-hour', minuteInput: 'united-kingdom-minute', tz: 'Greenwich'},
            { id: 'philippines', name: 'PHT', hourInput: 'philippines-hour', minuteInput: 'philippines-minute', tz: 'Asia/Manila' },
            { id: 'new-zealand', name: 'NZDT', hourInput: 'new-zealand-hour', minuteInput: 'new-zealand-minute', tz: 'Pacific/Auckland'},
            { id: 'south-africa', name: 'SAST', hourInput: 'south-africa-hour', minuteInput: 'south-africa-minute', tz: 'Africa/Johannesburg'}
        ];

        return zones;
    },

    isDST: function() {
        const today = new Date();
        const year = today.getFullYear();

        // DST starts second Sunday in March at 2:00 AM
        const marchSecondSunday = new Date(year, 2, 1);
        marchSecondSunday.setDate(1 + (14 - marchSecondSunday.getDay()) % 7);
        const dstStart = new Date(year, 2, marchSecondSunday.getDate(), 2, 0, 0);

        // DST ends first Sunday in November at 2:00 AM
        const novFirstSunday = new Date(year, 10, 1);
        novFirstSunday.setDate(1 + (7 - novFirstSunday.getDay()) % 7);
        const dstEnd = new Date(year, 10, novFirstSunday.getDate(), 2, 0, 0);

        // Check if current date is within DST period
        return today >= dstStart && today < dstEnd;
    },

    toggleArizonaClock: function() {
        document.getElementById('arizona-clock').style.display = '';
    },

    populateOffsetTables: function() {
        const configs = this.getTimeZoneConfigs();
        const baseConfig = configs.find(c => c.id === this.baseTimezoneId);
        const baseTimezone = baseConfig ? baseConfig.tz : 'US/Hawaii';
        const baseName = baseConfig ? baseConfig.name : 'HST';

        // Update heading with base timezone abbreviation
        document.getElementById('offset-table-heading').textContent = baseName + ' Offsets';

        // Use current date so offsets reflect actual DST state of all zones
        const now = new Date();
        const baseOffset = this.getTimezoneOffsetForDate(baseTimezone, now);

        const tableBody = document.getElementById('offset-table-body');
        tableBody.innerHTML = '';

        configs.forEach(config => {
            const offset = this.getTimezoneOffsetForDate(config.tz, now);
            const hourDiff = Math.round((baseOffset - offset) / 60);

            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const offsetCell = document.createElement('td');

            const clockHeader = document.querySelector(`#${config.hourInput}`).closest('.clock-column').querySelector('.clock-header');
            nameCell.textContent = clockHeader ? clockHeader.textContent : `${config.name}`;
            offsetCell.textContent = hourDiff >= 0 ? `+${hourDiff}` : `${hourDiff}`;

            row.appendChild(nameCell);
            row.appendChild(offsetCell);
            tableBody.appendChild(row);
        });
    },

    getTimezoneOffsetForDate: function(timezone, date) {
        // Get UTC time
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        // Get time in the target timezone
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
        // Return offset in minutes
        return (utcDate.getTime() - tzDate.getTime()) / (60 * 1000);
    },

    setupButtons: function() {
        // Store a reference to 'this' that will be accessible in the event handlers
        const self = this;

        document.getElementById('reset-button').addEventListener('click', function() {
            self.resetClocks();
        });

        document.getElementById('increment-button-hr').addEventListener('click', function() {
            self.adjustAllClocks(60);
        });

        document.getElementById('decrement-button-hr').addEventListener('click', function() {
            self.adjustAllClocks(-60);
        });

        document.getElementById('toggle-ampm').addEventListener('click', function() {
            self.toggleAMPM();
        });

        document.getElementById('increment-button-min').addEventListener('click', function() {
            self.adjustAllClocks(15); // The adjustAllClocks method now handles snapping to intervals
        });

        document.getElementById('decrement-button-min').addEventListener('click', function() {
            self.adjustAllClocks(-15); // The adjustAllClocks method now handles snapping to intervals
        });

        document.getElementById('format-toggle').addEventListener('click', function() {
            self.toggleFormat();
        });
    },

    resetClocks: function() {
        this.stopAutoUpdate();

        // Set each clock to current time
        Object.values(this.clocks).forEach(clock => {
            clock.setCurrentTime();
        });

        // Start automatic updates
        this.startAutoUpdate();
    },

    adjustAllClocks: function(minutes) {
        console.log("Adjusting all clocks by " + minutes + " minutes.");
        // Important: Stop auto updates first
        this.stopAutoUpdate();

        // For 15-minute increments, snap to the next 15-minute interval
        if (Math.abs(minutes) === 15) {
            this.adjustToNearestInterval(minutes > 0);
        } else {
            // For hour adjustments, first add the specified minutes
            Object.values(this.clocks).forEach(clock => {
                clock.adjustTime(minutes);
            });

            // Then snap the minutes to the nearest 15-minute interval
            this.snapMinutesToInterval();
        }

        // Do NOT restart auto updates after adjustment
    },

    adjustToNearestInterval: function(isIncrement) {
        // Get a reference clock to determine the current minute
        const referenceClock = Object.values(this.clocks)[0];
        const localTime = referenceClock.getLocalizedTime();
        const currentMinute = localTime.minutes;

        // Calculate minutes to the next or previous 15-minute interval
        let minutesToAdjust = 0;

        if (isIncrement) {
            // Calculate minutes to next 15-minute interval (15, 30, 45, 00)
            minutesToAdjust = 15 - (currentMinute % 15);
            if (minutesToAdjust === 0) minutesToAdjust = 15; // If already at an interval, go to the next one
        } else {
            // Calculate minutes to previous 15-minute interval
            minutesToAdjust = -(currentMinute % 15);
            if (minutesToAdjust === 0) minutesToAdjust = -15; // If already at an interval, go to the previous one
        }

        console.log(`Adjusting from ${currentMinute} minutes by ${minutesToAdjust} minutes`);

        // Apply the calculated adjustment to all clocks
        Object.values(this.clocks).forEach(clock => {
            clock.adjustTime(minutesToAdjust);
        });
    },

    snapMinutesToInterval: function() {
        // Get a reference clock to determine the current minute
        const referenceClock = Object.values(this.clocks)[0];
        const localTime = referenceClock.getLocalizedTime();
        const currentMinute = localTime.minutes;

        // Calculate minutes to nearest 15-minute interval (0, 15, 30, 45)
        const mod = currentMinute % 15;
        let minutesToAdjust = 0;

        if (mod < 8) {
            // Round down to previous interval
            minutesToAdjust = -mod;
        } else {
            // Round up to next interval
            minutesToAdjust = 15 - mod;
        }

        if (minutesToAdjust !== 0) {
            console.log(`Snapping from ${currentMinute} minutes by ${minutesToAdjust} minutes`);

            // Apply the calculated adjustment to all clocks
            Object.values(this.clocks).forEach(clock => {
                clock.adjustTime(minutesToAdjust);
            });
        }
    },

    startAutoUpdate: function() {
        this.stopAutoUpdate();
        this.updateInterval = setInterval(() => {
            Object.values(this.clocks).forEach(clock => {
                clock.setCurrentTime();
            });
        }, 1000);
    },

    stopAutoUpdate: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    },

    toggleFormat: function() {
        use24Hour = !use24Hour;
        Object.values(this.clocks).forEach(clock => {
            clock.updateDisplay();
        });
    },

    toggleAMPM: function() {
        // Stop auto updates
        this.stopAutoUpdate();

        // Get a reference clock to check current AM/PM
        const referenceClock = Object.values(this.clocks)[0];
        const localTime = referenceClock.getLocalizedTime();
        const currentHour = localTime.hours24;

        // Toggle between AM and PM (add or subtract 12 hours = 720 minutes)
        const minutesToAdjust = currentHour < 12 ? 720 : -720;

        // Apply the adjustment to all clocks
        Object.values(this.clocks).forEach(clock => {
            clock.adjustTime(minutesToAdjust);
        });
    },

    // Synchronize all clocks from a source clock
    syncFromClock: function(sourceClock) {
        const sourceTime = sourceClock.date.getTime();

        // Update all other clocks to the same UTC time
        Object.values(this.clocks).forEach(clock => {
            if (clock !== sourceClock) {
                clock.date = new Date(sourceTime);
                clock.updateDisplay();
            }
        });
    }
};

// Global setting for 12/24 hour format
let use24Hour = false;

// Parse CHANGELOG.md into structured data
function parseChangelog(markdown) {
    const versions = {};
    const lines = markdown.split('\n');

    let currentVersion = null;
    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Match version headers: ## [1.2.1] - 2025-12-30 or ## [Unreleased]
        const versionMatch = line.match(/^##\s+\[([^\]]+)\]\s*(?:-\s*(.+))?$/);
        if (versionMatch) {
            const versionNum = versionMatch[1];
            const date = versionMatch[2] ? versionMatch[2].trim() : 'TBD';

            // Skip "Unreleased" version
            if (versionNum === 'Unreleased') {
                currentVersion = null;
                continue;
            }

            // Add 'v' prefix if not present
            currentVersion = versionNum.startsWith('v') ? versionNum : 'v' + versionNum;
            versions[currentVersion] = {
                date: date,
                added: [],
                changed: [],
                fixed: []
            };
            currentSection = null;
            continue;
        }

        // Match section headers: ### Added, ### Changed, ### Fixed
        const sectionMatch = line.match(/^###\s+(Added|Changed|Fixed)/i);
        if (sectionMatch && currentVersion) {
            currentSection = sectionMatch[1].toLowerCase();
            continue;
        }

        // Match bullet points: - Item text
        const bulletMatch = line.match(/^[-*]\s+(.+)$/);
        if (bulletMatch && currentVersion && currentSection) {
            const text = bulletMatch[1].replace(/^\*\*(.+?)\*\*:?\s*/, '$1: '); // Handle **bold**: format
            versions[currentVersion][currentSection].push(text);
        }
    }

    return versions;
}

// Changelog modal functionality
function initChangelog() {
    const modal = document.getElementById('changelog-modal');
    const versionLink = document.getElementById('version-link');
    const closeBtn = document.querySelector('.changelog-close');
    const modalVersion = document.getElementById('modal-version');
    const changelogDetails = document.getElementById('changelog-details');

    // Get current version from the page
    const currentVersion = versionLink.textContent.trim();

    // Open modal when version link is clicked
    versionLink.addEventListener('click', async (e) => {
        e.preventDefault();

        // Update modal title
        modalVersion.textContent = 'History';

        // Show loading message
        changelogDetails.innerHTML = '<p>Loading changelog...</p>';
        modal.style.display = 'block';

        try {
            // Fetch CHANGELOG.md from the server
            const response = await fetch('CHANGELOG.md');
            if (!response.ok) {
                throw new Error('Failed to load changelog');
            }

            const markdown = await response.text();
            const versions = parseChangelog(markdown);

            // Build changelog HTML for all versions
            let html = '';

            // Iterate through all versions
            Object.keys(versions).forEach(version => {
                const changelog = versions[version];
                const isCurrent = version === currentVersion;

                // Add version header
                html += `<div class="version-section ${isCurrent ? 'current-version' : ''}">`;
                html += `<h2>${version}${isCurrent ? ' (Current)' : ''}</h2>`;
                html += `<p><strong>Release Date:</strong> ${changelog.date}</p>`;

                // Added section
                if (changelog.added && changelog.added.length > 0) {
                    html += '<h3>Added</h3><ul>';
                    changelog.added.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += '</ul>';
                }

                // Changed section
                if (changelog.changed && changelog.changed.length > 0) {
                    html += '<h3>Changed</h3><ul>';
                    changelog.changed.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += '</ul>';
                }

                // Fixed section
                if (changelog.fixed && changelog.fixed.length > 0) {
                    html += '<h3>Fixed</h3><ul>';
                    changelog.fixed.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += '</ul>';
                }

                html += '</div>'; // Close version-section

                if (!isCurrent) {
                    html += '<hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">';
                }
            });

            changelogDetails.innerHTML = html;
        } catch (error) {
            changelogDetails.innerHTML = `<p>Error loading changelog: ${error.message}</p>`;
        }
    });

    // Close modal when X is clicked
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

// Settings modal functionality
function initSettings() {
    const modal = document.getElementById('settings-modal');
    const gearButton = document.getElementById('settings-gear');
    const closeBtn = document.querySelector('.settings-close');
    const optionsContainer = document.getElementById('base-clock-options');

    const configs = ClockApp.getTimeZoneConfigs();

    configs.forEach(config => {
        const label = document.createElement('label');
        label.className = 'base-clock-option';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'base-clock';
        radio.value = config.id;

        const clockHeader = document.querySelector(`#${config.hourInput}`)
            .closest('.clock-column').querySelector('.clock-header');
        const displayName = clockHeader ? clockHeader.textContent : config.name;

        label.appendChild(radio);
        label.appendChild(document.createTextNode(displayName));
        optionsContainer.appendChild(label);
    });

    gearButton.addEventListener('click', () => {
        const currentRadio = optionsContainer.querySelector(`input[value="${ClockApp.baseTimezoneId}"]`);
        if (currentRadio) currentRadio.checked = true;
        modal.style.display = 'block';
    });

    optionsContainer.addEventListener('change', (e) => {
        if (e.target.name === 'base-clock') {
            ClockApp.setBaseTimezone(e.target.value);
            modal.style.display = 'none';
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ClockApp.init();
    initChangelog();
    initSettings();
});