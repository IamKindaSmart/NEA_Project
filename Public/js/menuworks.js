document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('itemModal');
    const overlay = document.getElementById('modalOverlay');
    const modalQuantity = document.getElementById('modalQuantity');
    let cardQuantity; // To store the reference to the card's quantity input

    function openModal(title, description, image, ingredients, allergyInfo, price, itemId) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalDescription').textContent = description;
        document.getElementById('modalIngredients').textContent = ingredients;
        document.getElementById('modalAllergyInfo').textContent = allergyInfo;
        document.getElementById('modalPrice').textContent = price;

        const modalImage = document.getElementById('modalImage');
        if (image) {
            modalImage.src = `/uploads/${image}`;
            modalImage.style.display = 'block';
        } else {
            modalImage.style.display = 'none';
        }

        // Get the card's quantity input and sync it with the modal quantity
        cardQuantity = document.querySelector(`input[name="quantity_${itemId}"]`);
        modalQuantity.value = cardQuantity.value;

        modal.style.display = 'block';
        overlay.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }

// Function to increase the quantity of a specific item
function increaseQuantity(itemId) {
    const cardQuantity = document.querySelector(`input[name="quantity_${itemId}"]`);
    cardQuantity.value = parseInt(cardQuantity.value) + 1;
}

// Function to decrease the quantity of a specific item
function decreaseQuantity(itemId) {
    const cardQuantity = document.querySelector(`input[name="quantity_${itemId}"]`);
    if (parseInt(cardQuantity.value) > 0) {
        cardQuantity.value = parseInt(cardQuantity.value) - 1;
    }
}

    // Sync manual input changes in the modal with the card's quantity
    modalQuantity.addEventListener('input', () => {
        cardQuantity.value = modalQuantity.value;
    });

    overlay.addEventListener('click', closeModal);
    document.querySelector('.close').addEventListener('click', closeModal);

    window.openModal = openModal;
});