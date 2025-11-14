document.addEventListener('DOMContentLoaded', function() {
    const inputString = document.getElementById('inputString');
    const parseButton = document.getElementById('parseButton');
    const block1 = document.getElementById('block1');
    const block2 = document.getElementById('block2');
    const block3 = document.getElementById('block3');

    const elementsData = new Map();
    let dragSource = null;
    let currentDropZone = null;

    // Обработчик Разобрать
    parseButton.addEventListener('click', function() {
        block1.innerHTML = '';
        block2.innerHTML = '';
        block3.textContent = '';
        elementsData.clear();

        const input = inputString.value.trim();
        if (!input) return;

        const items = input.split('-').map(item => item.trim()).filter(item => item);

        const uniqueItems = removeDuplicates(items);

        const words = [];
        const numbers = [];

        uniqueItems.forEach(item => {
            if (!isNaN(item)) {
                numbers.push(parseInt(item));
            } else {
                words.push(item);
            }
        });

        const lowercaseWords = words.filter(word => word[0] === word[0].toLowerCase() && !(word[0] >= '0' && word[0] <= '9'));
        const uppercaseWords = words.filter(word => word[0] === word[0].toUpperCase() && !(word[0] >= '0' && word[0] <= '9'));

        lowercaseWords.sort();
        uppercaseWords.sort();

        numbers.sort((a, b) => a - b);

        lowercaseWords.forEach((word, index) => {
            createWordElement(word, `a${index + 1}`);
        });

        uppercaseWords.forEach((word, index) => {
            createWordElement(word, `b${index + 1}`);
        });

        numbers.forEach((number, index) => {
            createWordElement(number.toString(), `n${index + 1}`);
        });
    });

    function removeDuplicates(items) {
        const seen = new Set();
        const result = [];

        for (const item of items) {
            if (!seen.has(item)) {
                seen.add(item);
                result.push(item);
            }
        }

        return result;
    }

    function createWordElement(text, key) {
        const element = document.createElement('div');
        element.className = 'word-item';
        element.textContent = `${key} ${text}`;
        element.dataset.key = key;
        element.dataset.text = text;

        elementsData.set(key, {
            element: element,
            text: text,
            originalColor: '#f0f0f0',
            currentColor: '#f0f0f0',
            parent: block2,
            key: key
        });

        setupDragAndDrop(element);

        block2.appendChild(element);
    }

    // Настройка перетаскивания для элемента
    function setupDragAndDrop(element) {
        element.draggable = true;

        element.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', element.dataset.key);
            element.classList.add('dragging');
            dragSource = element.parentNode;
        });

        element.addEventListener('dragend', function() {
            element.classList.remove('dragging');
            removeDropZones();
        });

        element.addEventListener('click', function() {
            if (element.parentNode === block1) {
                block3.textContent = element.dataset.text;
            }
        });
    }

    [block1, block2].forEach(block => {
        block.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (this === block1) {
                createDropZones(block, e.clientX, e.clientY);
            }
        });

        block.addEventListener('drop', function(e) {
            e.preventDefault();
            const key = e.dataTransfer.getData('text/plain');
            const element = elementsData.get(key).element;

            if (element && dragSource) {
                handleDrop(element, this, e.clientX, e.clientY);
            }
        });

        block.addEventListener('dragleave', function(e) {
            if (!this.contains(e.relatedTarget)) {
                removeDropZones();
            }
        });
    });

    function createDropZones(block, clientX, clientY) {
        removeDropZones();

        const elements = Array.from(block.children).filter(child => child.classList.contains('word-item'));
        const rect = block.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (elements.length === 0) {
            const zone = createDropZone(block, null, 'start');
            currentDropZone = { zone, target: null, position: 'start', block: block };
            return;
        }

        const firstElement = elements[0];
        const firstRect = firstElement.getBoundingClientRect();
        const firstLeft = firstRect.left - rect.left;
        const firstWidth = firstRect.width;

        if (x < firstLeft + firstWidth * 0.3) {
            const zone = createDropZone(block, firstElement, 'before');
            currentDropZone = { zone, target: firstElement, position: 'before', block: block };
            return;
        }

        for (let i = 0; i < elements.length - 1; i++) {
            const currentElement = elements[i];
            const nextElement = elements[i + 1];

            const currentRect = currentElement.getBoundingClientRect();
            const nextRect = nextElement.getBoundingClientRect();

            const currentRight = currentRect.right - rect.left;
            const nextLeft = nextRect.left - rect.left;

            const gapStart = currentRight - 20;
            const gapEnd = nextLeft + 20;

            if (x > gapStart && x < gapEnd) {
                const zone = createDropZone(block, currentElement, 'after');
                currentDropZone = { zone, target: currentElement, position: 'after', block: block };
                return;
            }
        }

        const lastElement = elements[elements.length - 1];
        const lastRect = lastElement.getBoundingClientRect();
        const lastRight = lastRect.right - rect.left;
        const lastWidth = lastRect.width;

        if (x > lastRight - lastWidth * 0.3) {
            const zone = createDropZone(block, lastElement, 'after');
            currentDropZone = { zone, target: lastElement, position: 'after', block: block };
            return;
        }

        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const zone = createDropZone(block, lastElement, 'after');
            currentDropZone = { zone, target: lastElement, position: 'after', block: block };
        }
    }

    function createDropZone(block, targetElement, position) {
        const zone = document.createElement('div');
        zone.className = 'drop-zone active';

        if (position === 'start') {
            zone.style.cssText = 'margin-right: 12px;';
            block.prepend(zone);
        } else if (position === 'before') {
            zone.style.cssText = 'margin-right: 12px;';
            targetElement.before(zone);
        } else if (position === 'after') {
            zone.style.cssText = 'margin-left: 12px;';
            targetElement.after(zone);
        }

        return zone;
    }

    function removeDropZones() {
        document.querySelectorAll('.drop-zone').forEach(zone => zone.remove());
        currentDropZone = null;
    }

    function handleDrop(element, targetBlock, clientX, clientY) {
        const key = element.dataset.key;
        const elementData = elementsData.get(key);

        if (currentDropZone && currentDropZone.block === targetBlock) {
            const { target, position } = currentDropZone;

            if (target === element && position === 'after') {
                removeDropZones();
                dragSource = null;
                return;
            }

            if (target === element && position === 'before') {
                removeDropZones();
                dragSource = null;
                return;
            }
        }

        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }

        if (targetBlock === block1) {
            if (dragSource === block2) {
                const randomColor = getRandomColor();
                element.style.backgroundColor = randomColor;
                elementData.currentColor = randomColor;
            }

            const success = insertElementAtPosition(element, targetBlock);
            if (success) {
                elementData.parent = block1;
            } else {
                targetBlock.appendChild(element);
                elementData.parent = block1;
            }
        }
        else if (targetBlock === block2) {
            if (dragSource === block1) {
                element.style.backgroundColor = elementData.originalColor;
                elementData.currentColor = elementData.originalColor;
            }
            insertElementInSortedOrder(element, targetBlock);
            elementData.parent = block2;
        }

        if (element.parentNode !== block1 && block3.textContent === elementData.text) {
            block3.textContent = '';
        }

        removeDropZones();
        dragSource = null;
    }

    function insertElementAtPosition(element, block) {
        if (currentDropZone && currentDropZone.block === block) {
            const { target, position } = currentDropZone;

            try {
                if (position === 'start') {
                    block.prepend(element);
                    return true;
                } else if (position === 'before' && target) {
                    target.before(element);
                    return true;
                } else if (position === 'after' && target) {
                    target.after(element);
                    return true;
                }
            } catch (error) {
                return false;
            }
        }

        return false;
    }

    function insertElementInSortedOrder(element, block) {
        const elements = Array.from(block.children).filter(child => child.classList.contains('word-item'));
        const key = element.dataset.key;

        const allElements = [...elements, element];

        allElements.sort((a, b) => {
            const keyA = a.dataset.key;
            const keyB = b.dataset.key;

            const typeA = keyA.charAt(0);
            const numA = parseInt(keyA.slice(1));
            const typeB = keyB.charAt(0);
            const numB = parseInt(keyB.slice(1));

            const typeOrder = { 'a': 1, 'b': 2, 'n': 3 };

            if (typeOrder[typeA] !== typeOrder[typeB]) {
                return typeOrder[typeA] - typeOrder[typeB];
            }

            return numA - numB;
        });

        block.innerHTML = '';
        allElements.forEach(el => block.appendChild(el));
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
});