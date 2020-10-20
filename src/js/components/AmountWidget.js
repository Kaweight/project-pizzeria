import {
  select,
  settings
} from '../settings.js';

import {
  BaseWidget
} from './BaseWidget.js';

export class AmountWidget extends BaseWidget {
  constructor(wrapper) {
    super(wrapper, settings.amountWidget.defaultValue);

    const thisWidget = this;

    thisWidget.getElements();
    thisWidget.initActions();
  }

  getElements() {
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }

  isValid(newValue) {
    return !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax;
  }

  initActions() {
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function () {
      thisWidget.value = thisWidget.dom.input.value;
    });

    thisWidget.dom.linkDecrease.addEventListener('click', function (e) {
      e.preventDefault();
      if (thisWidget.dom.input == document.querySelector('.hours-amount input')) {
        thisWidget.value = thisWidget.value - 0.5;
      } else {
        thisWidget.value = thisWidget.value - 1;
      }
    });

    thisWidget.dom.linkIncrease.addEventListener('click', function (e) {
      e.preventDefault();
      if (thisWidget.dom.input == document.querySelector('.hours-amount input')) {
        thisWidget.value = thisWidget.value + 0.5;
      } else {
        thisWidget.value = thisWidget.value + 1;
      }
    });
  }
  parseValue(newValue) {
    return parseFloat(newValue);
  }

  renderValue() {
    const thisWidget = this;

    thisWidget.dom.input.value = thisWidget.value;
  }
}

export default AmountWidget;