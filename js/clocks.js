// Clock class
class TimeZoneClock {
    constructor(id, name, hourInputId, minuteInputId, tz) {
        this.id = id;
        this.name = name;
        this.hourInput = document.getElementById(hourInputId);
        this.minuteInput = document.getElementById(minuteInputId);
        this.tz = tz; // Timezone string (e.g., 'US/Pacific')
        this.date = new Date(); // Store time in UTC

        // Make the inputs read-only to prevent direct editing
        this.hourInput.readOnly = true;
        this.minuteInput.readOnly = true;

        // Remove the up/down arrows from number inputs
        this.hourInput.classList.add('no-spinner');
        this.minuteInput.classList.add('no-spinner');
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
}

// Global app controller
const ClockApp = {
    clocks: {},
    updateInterval: null,

    init: function() {
        this.createClocks();
        this.setupButtons();
        this.toggleArizonaClock();
        this.populateOffsetTables();
        this.resetClocks();
        this.addStyles();
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
                config.tz
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
        const arizonaClock = document.getElementById('arizona-clock');
        const standardTable = document.getElementById('standard-table');
        const dstTable = document.getElementById('dst-table');

        if (this.isDST()) {
            arizonaClock.style.display = '';
            standardTable.style.display = 'none';
            dstTable.style.display = 'block';
        } else {
            arizonaClock.style.display = 'none';
            standardTable.style.display = 'block';
            dstTable.style.display = 'none';
        }
    },

    populateOffsetTables: function() {
        // Base timezone is Hawaii
        const baseTimezone = 'US/Hawaii';

        // Create a reference date for US standard time (January 15, 12:00 UTC)
        // This is winter in Northern Hemisphere, summer in Southern Hemisphere
        const standardDate = new Date(Date.UTC(2025, 0, 15, 12, 0, 0));

        // Create a reference date for US DST (July 15, 12:00 UTC)
        // This is summer in Northern Hemisphere, winter in Southern Hemisphere
        const dstDate = new Date(Date.UTC(2025, 6, 15, 12, 0, 0));

        // Get the base timezone offset for both dates
        const baseStandardOffset = this.getTimezoneOffsetForDate(baseTimezone, standardDate);
        const baseDSTOffset = this.getTimezoneOffsetForDate(baseTimezone, dstDate);

        // Get the standard offset table
        const standardTable = document.getElementById('standard-offset-table');
        standardTable.innerHTML = '';

        // Get the DST offset table
        const dstTable = document.getElementById('dst-offset-table');
        dstTable.innerHTML = '';

        // Get all clock configurations
        const configs = this.getTimeZoneConfigs();

        // Populate standard time table (US winter time - Jan 15)
        configs.forEach(config => {
            const offset = this.getTimezoneOffsetForDate(config.tz, standardDate);
            const hourDiff = Math.round((baseStandardOffset - offset) / 60);

            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const offsetCell = document.createElement('td');

            // Get display name from DOM
            const clockHeader = document.querySelector(`#${config.hourInput}`).closest('.clock-column').querySelector('.clock-header');
            nameCell.textContent = clockHeader ? clockHeader.textContent : `${config.name}`;
            offsetCell.textContent = hourDiff >= 0 ? `+${hourDiff}` : `${hourDiff}`;

            row.appendChild(nameCell);
            row.appendChild(offsetCell);
            standardTable.appendChild(row);
        });

        // Populate DST table (US summer time - July 15)
        configs.forEach(config => {
            const offset = this.getTimezoneOffsetForDate(config.tz, dstDate);
            const hourDiff = Math.round((baseDSTOffset - offset) / 60);

            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const offsetCell = document.createElement('td');

            // Get display name from DOM
            const clockHeader = document.querySelector(`#${config.hourInput}`).closest('.clock-column').querySelector('.clock-header');
            nameCell.textContent = clockHeader ? clockHeader.textContent : `${config.name}`;
            offsetCell.textContent = hourDiff >= 0 ? `+${hourDiff}` : `${hourDiff}`;

            row.appendChild(nameCell);
            row.appendChild(offsetCell);
            dstTable.appendChild(row);
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
    }
};

// Global setting for 12/24 hour format
let use24Hour = false;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ClockApp.init();
});