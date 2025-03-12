document.addEventListener('DOMContentLoaded', () => {
    let totalQuantity = 0;
    let totalPrice = 0;
    const maxTotalQuantity = 50;
    const notification = document.getElementById('notification');
    const progressBar = document.getElementById('progress-bar');
    const summaryBar = document.getElementById('summary-bar');
    const totalItemsElement = document.getElementById('total-items');
    const totalPriceElement = document.getElementById('total-price');

    function showNotification() {
        notification.classList.add('show');
        progressBar.style.animation = 'none'; // Reset animation
        progressBar.offsetHeight; // Trigger reflow
        progressBar.style.animation = 'progress 3s linear forwards'; // Start animation
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    function updateSummary() {
        totalItemsElement.textContent = `Total Items: ${totalQuantity}`;
        totalPriceElement.textContent = `Total Price: £${totalPrice.toFixed(2)}`;
        if (totalQuantity > 0) {
            summaryBar.style.display = 'flex';
            summaryBar.style.animation = 'slideUp 0.5s ease-in-out';
        } else {
            summaryBar.style.display = 'none';
        }
    }

    document.querySelectorAll('.card').forEach(card => {
        const decreaseButton = card.querySelector('.decrease');
        const increaseButton = card.querySelector('.increase');
        const quantityInput = card.querySelector('.quantity');
        const itemPrice = parseFloat(card.getAttribute('data-price'));

        decreaseButton.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value);
            if (quantity > 0) {
                quantity--;
                totalQuantity--;
                totalPrice -= itemPrice;
                quantityInput.value = quantity;
                quantityInput.setAttribute('data-previous-value', quantity);
                updateSummary();
            }
        });

        increaseButton.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value);
            if (totalQuantity + 1 <= maxTotalQuantity) {
                quantity++;
                totalQuantity++;
                totalPrice += itemPrice;
                quantityInput.value = quantity;
                quantityInput.setAttribute('data-previous-value', quantity);
                updateSummary();
            } else {
                showNotification();
            }
        });

        quantityInput.addEventListener('change', () => {
            let quantity = parseInt(quantityInput.value);
            if (isNaN(quantity) || quantity < 0) {
                quantity = 0;
            }
            const previousQuantity = parseInt(quantityInput.getAttribute('data-previous-value') || 0);
            const quantityDifference = quantity - previousQuantity;
            if (totalQuantity + quantityDifference <= maxTotalQuantity) {
                totalQuantity += quantityDifference;
                totalPrice += quantityDifference * itemPrice;
                quantityInput.setAttribute('data-previous-value', quantity);
                updateSummary();
            } else {
                showNotification();
                quantityInput.value = previousQuantity;
            }
        });

        quantityInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                quantityInput.blur(); // Trigger the change event
            }
        });

        card.addEventListener('click', () => {
            card.classList.add('expanded');
        });
    });

    document.getElementById('order-form').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    });

    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const cards = document.querySelectorAll('.card');

    function filterCards() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categorySelect.value.toLowerCase();

        cards.forEach(card => {
            const itemName = card.querySelector('h3').textContent.toLowerCase();
            const category = card.getAttribute('data-category').toLowerCase();

            const matchesSearchTerm = itemName.includes(searchTerm);
            const matchesCategory = selectedCategory === '' || category === selectedCategory;

            if (matchesSearchTerm && matchesCategory) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    searchInput.addEventListener('input', filterCards);
    categorySelect.addEventListener('change', filterCards);
});

function closeCard(event) {
    event.stopPropagation();
    const card = event.target.closest('.card');
    card.classList.remove('expanded');
}