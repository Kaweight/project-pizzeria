import { select, templates, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,

      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat === 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] === 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {

      if (typeof thisBooking.booked[date][hourBlock] === 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  checkBookingVolume() {
    const thisBooking = this;

    const endHour = parseFloat(thisBooking.hourPicker.dom.input.max);

    const bookedVolume = {
      'yellow': [],
      'red': [],
    };

    for (let hourBlock = 0; hourBlock <= endHour; hourBlock += 0.5) {

      if (typeof thisBooking.booked[thisBooking.date][hourBlock] === 'undefined' || thisBooking.booked[thisBooking.date][hourBlock].length === 1) {
        continue;
      } else if (thisBooking.booked[thisBooking.date][hourBlock].length === 2) {
        bookedVolume['yellow'].push(hourBlock);
      } else {
        bookedVolume['red'].push(hourBlock);
      }
    }

  }

  checkAvailableHours() {
    const thisBooking = this;

    if (!(typeof thisBooking.selectedTableId === 'undefined')) {
      for (let hour in thisBooking.booked[thisBooking.date]) {
        if (hour > thisBooking.hour && thisBooking.booked[thisBooking.date][hour].includes(thisBooking.selectedTableId)) {
          thisBooking.hoursAmount.maxValue = hour - thisBooking.hour;
          break;
        } else {
          thisBooking.hoursAmount.maxValue = Math.round(parseFloat(thisBooking.hourPicker.dom.input.max)) - thisBooking.hour;
        }
      }
    }
  }

  checkAllAvailable() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] === 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] === 'undefined'
    ) {
      allAvailable = true;
    }

    return allAvailable;
  }

  getRangeSelectorGradientColors(tables) {
    return tables === 0 ? 'green' : tables === 1 ? 'green' : tables === 2 ? 'orange' : 'red';
  }

  updateRangeSelector() {
    const thisBooking = this;

    let hourTemplate = {
      12: [],
      12.5: [],
      13: [],
      13.5: [],
      14: [],
      14.5: [],
      15: [],
      15.5: [],
      16: [],
      16.5: [],
      17: [],
      17.5: [],
      18: [],
      18.5: [],
      19: [],
      19.5: [],
      20: [],
      20.5: [],
      21: [],
      21.5: [],
      22: [],
      22.5: [],
      23: [],
      23.5: [],
      0: []
    };

    const tablesArray = [];
    const newHours = Object.assign(hourTemplate, thisBooking.booked[thisBooking.datePicker.correctValue]);
    let hour0 = undefined;

    if (newHours[0]) {
      hour0 = newHours[0];
      delete newHours[0];
    }
    if (newHours[0.5]) delete newHours[0.5];

    Object.keys(newHours).sort((a, b) => a - b).forEach(function (key) {
      tablesArray.push(newHours[key].filter(x => x !== ''));
    });
    if (hour0) tablesArray.push(hour0);
    const displayedValues = tablesArray.slice(0, 25);

    let gradientStyle = 'linear-gradient(to right';
    displayedValues.forEach((value, index) => {
      gradientStyle += `, ${this.getRangeSelectorGradientColors(value.length)} ${index / displayedValues.length * 100}%, ${this.getRangeSelectorGradientColors(value.length)} ${(index + 1) / displayedValues.length * 100}%`;
    });
    gradientStyle += ')';

    document.getElementsByClassName('rangeSlider')[0].style.background = gradientStyle;
  }

  updateDOM() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);

      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !thisBooking.checkAllAvailable()
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
        table.classList.remove(classNames.booking.selected);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
    thisBooking.checkBookingVolume();
    thisBooking.updateRangeSelector();
  }

  render(wrapper) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = wrapper;

    thisBooking.dom.wrapper.appendChild(utils.createDOMFromHTML(generatedHTML));

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);

  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.checkAvailableHours();
      thisBooking.updateDOM();
    });

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function () {
        thisBooking.selectTable(table);
      });
    }

    thisBooking.dom.wrapper.addEventListener('submit', function (event) {
      event.preventDefault();
      if (thisBooking.hour > settings.hours.close - 1) {
        alert('Please pick a time in range 12:00 - 23:00');
      } else {
        thisBooking.sendBooking();
      }
    });
  }

  clearSelected() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      table.classList.remove(classNames.booking.selected);
    }
    thisBooking.selectedTableId = '';

    thisBooking.hoursAmount.value = '1';
  }

  selectTable(table) {
    const thisBooking = this;

    thisBooking.clearSelected();

    let tableId = table.getAttribute(settings.booking.tableIdAttribute);

    if (!isNaN(tableId)) {
      tableId = parseInt(tableId);
    }

    if (thisBooking.checkAllAvailable() || !thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
      table.classList.toggle(classNames.booking.selected);
      thisBooking.selectedTableId = tableId;
    }
    thisBooking.checkAvailableHours();
  }


  sendBooking() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.date,
      hour: thisBooking.hourPicker.correctValue,
      table: thisBooking.selectedTableId,
      duration: thisBooking.hoursAmount.correctValue,
      ppl: thisBooking.peopleAmount.correctValue,
      starters: [],
    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function (parsedResponse) {
        alert('Zapisano');
      });

    thisBooking.makeBooked(thisBooking.date, thisBooking.hourPicker.correctValue, thisBooking.hoursAmount.correctValue, thisBooking.selectedTableId);
    thisBooking.clearSelected();
    thisBooking.updateDOM();
  }
}

export default Booking;