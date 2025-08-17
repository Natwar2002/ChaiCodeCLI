const calculatorScreen = document.querySelector('.calculator-screen');
const keys = document.querySelector('.calculator-keys');

let displayValue = '0';
let firstValue = null;
let operator = null;
let waitingForSecondValue = false;

updateDisplay();

function updateDisplay() {
    calculatorScreen.value = displayValue;
}

keys.addEventListener('click', function(e) {
    const element = e.target;

    if (!element.matches('button')) return;

    if (element.classList.contains('operator')) {
        handleOperator(element.value);
        updateDisplay();
        return;
    }

    if (element.classList.contains('decimal')) {
        inputDecimal(element.value);
        updateDisplay();
        return;
    }

    if (element.classList.contains('all-clear')) {
        clear();
        updateDisplay();
        return;
    }

    if (element.classList.contains('equal-sign')) {
        calculate();
        updateDisplay();
        return;
    }

    inputNumber(element.textContent);
    updateDisplay();
});

function inputNumber(num) {
    if (waitingForSecondValue) {
        displayValue = num;
        waitingForSecondValue = false;
    } else {
        displayValue = displayValue === '0' ? num : displayValue + num;
    }
}

function inputDecimal(dot) {
    if (!displayValue.includes(dot)) {
        displayValue += dot;
    }
}

function handleOperator(nextOperator) {
    const value = parseFloat(displayValue);

    if (firstValue === null) {
        firstValue = value;
    } else if (operator) {
        const result = calculateTwoNumbers(firstValue, value, operator);

        displayValue = String(result);
        firstValue = result;
    }

    waitingForSecondValue = true;
    operator = nextOperator;
}

function calculateTwoNumbers(num1, num2, operator) {
    if (operator === '+') {
        return num1 + num2;
    } else if (operator === '-') {
        return num1 - num2;
    } else if (operator === '*') {
        return num1 * num2;
    } else if (operator === '/') {
        return num1 / num2;
    }

    return num2;
}

function clear() {
    displayValue = '0';
    firstValue = null;
    operator = null;
    waitingForSecondValue = false;
}

function calculate() {
    const secondValue = parseFloat(displayValue)

    if (operator) {
        const result = calculateTwoNumbers(firstValue, secondValue, operator);
        displayValue = String(result);
        firstValue = result;
        operator = null;
        waitingForSecondValue = true;
    }

}