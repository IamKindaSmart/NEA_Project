document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('update-times-form');
  const addTimeButton = document.getElementById('add-time');
  const collectionTimesContainer = document.getElementById('collection-times-container');
  const hoursInput = document.getElementById('hours');
  const minutesSelect = document.getElementById('minutes');
  const alertBox = document.getElementById('alert');

  function validateInputs() {
    const hours = hoursInput.value;
    const minutes = minutesSelect.value;
    if (hours !== '' && minutes !== '') {
      addTimeButton.disabled = false;
    } else {
      addTimeButton.disabled = true;
    }
  }

  hoursInput.addEventListener('input', validateInputs);
  minutesSelect.addEventListener('change', validateInputs);

  addTimeButton.addEventListener('click', function() {
    const hours = hoursInput.value;
    const minutes = minutesSelect.value;
    if (hours === '' || minutes === '') {
      alertBox.style.display = 'block';
    } else {
      alertBox.style.display = 'none';
      const time = `${hours.padStart(2, '0')}:${minutes}`;
      const timeInput = document.createElement('input');
      timeInput.type = 'hidden';
      timeInput.name = 'collectionTimes[]';
      timeInput.value = time;
      collectionTimesContainer.appendChild(timeInput);
      form.submit();
    }
  });

  document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', function() {
      const time = this.getAttribute('data-time');
      fetch(`/delete-collection-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ time })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.parentElement.remove();
        } else {
          alert('Failed to delete collection time.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting collection time.');
      });
    });
  });

  form.addEventListener('submit', function(event) {
    event.preventDefault();
    const collectionTimes = Array.from(document.getElementsByName('collectionTimes[]')).map(input => input.value);
    fetch('/update-collection-times', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ collectionTimes })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Collection times updated successfully!');
        location.reload(); // Reload the page to refresh the list of collection times
      } else {
        alert('Failed to update collection times.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while updating collection times.');
    });
  });
});