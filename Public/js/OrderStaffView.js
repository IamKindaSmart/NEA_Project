document.addEventListener('DOMContentLoaded', function() {
    console.log("JavaScript file loaded"); // Verify if the file is being loaded

    const dateElements = document.querySelectorAll('.order-date');
    dateElements.forEach(function(element) {
        const date = new Date(element.textContent);
        const formattedDate = date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        element.textContent = formattedDate;
    });

    const statusSelects = document.querySelectorAll('.status-select');
    statusSelects.forEach(select => {
        select.addEventListener('change', function() {
            const form = this.closest('form');
            const formData = new FormData(form);
            const orderId = formData.get('order_id');
            const status = formData.get('status');

            // Submit the form asynchronously
            fetch('/update-order-status', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                console.log(`Order ${orderId} status updated to ${status}`);
                // Enable the checkbox if the status is "ready to collect"
                const checkbox = form.closest('tr').querySelector('.collected-checkbox');
                if (status === 'ready to collect') {
                    checkbox.disabled = false;
                } else {
                    checkbox.disabled = true;
                }
            })
            .catch(error => {
                console.error('Error updating order status:', error);
            });
        });

        // Initial check to enable/disable the checkbox based on the current status
        const form = select.closest('form');
        const status = select.value;
        const checkbox = form.closest('tr').querySelector('.collected-checkbox');
        if (status === 'ready to collect') {
            checkbox.disabled = false;
        } else {
            checkbox.disabled = true;
        }
    });

    const orderRows = document.querySelectorAll('tbody tr');
    const modal = document.getElementById('orderModal');
    const modalContent = document.getElementById('orderDetails');
    const closeModal = document.querySelector('.close');

    orderRows.forEach(function(row) {
        row.addEventListener('click', function(event) {
            const orderId = this.getAttribute('data-order-id');

            // Fetch order items from the server
            fetch(`/order-items/${orderId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(data => {
                    // Display order items in the modal, including the quantity but excluding the price
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(data, 'text/html');
                    const items = doc.querySelectorAll('li');
                    items.forEach(item => {
                        const quantityIndex = item.textContent.indexOf(' x ');
                        if (quantityIndex !== -1) {
                            item.textContent = item.textContent.substring(0, quantityIndex + 3) + item.textContent.substring(quantityIndex + 3).split(' - ')[0];
                        }
                    });
                    modalContent.innerHTML = doc.body.innerHTML;
                    modal.style.display = 'flex';
                })
                .catch(error => {
                    console.error('Error fetching order items:', error);
                    modalContent.innerHTML = '<p>Error fetching order items. Please try again later.</p>';
                    modal.style.display = 'flex';
                });
        });

        // Prevent the row click event when clicking on the dropdown
        const dropdown = row.querySelector('.dropdown select');
        dropdown.addEventListener('click', function(event) {
            event.stopPropagation();
        });

        // Prevent the row click event when clicking on the checkbox
        const checkbox = row.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('click', function(event) {
            event.stopPropagation();
            if (this.checked) {
                const form = this.closest('.delete-form');
                const formData = new FormData(form);
                const orderId = formData.get('order_id');

                // Show confirmation dialog
                const confirmed = confirm('Are you sure you want to delete this order?');
                if (confirmed) {
                    // Send delete request
                    fetch(`/delete-order/${orderId}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        // Remove the row from the table
                        row.remove();
                        console.log(`Order ${orderId} deleted`);
                    })
                    .catch(error => {
                        console.error('Error deleting order:', error);
                    });
                } else {
                    // Uncheck the checkbox if the action is not confirmed
                    this.checked = false;
                }
            }
        });
    });

    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
});