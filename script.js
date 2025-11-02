const reportForm = document.getElementById('reportForm');
const lostItemsGrid = document.getElementById('lostItemsGrid');
const foundItemsGrid = document.getElementById('foundItemsGrid');
const searchLost = document.getElementById('searchLost');
const searchFound = document.getElementById('searchFound');
const imageInput = document.getElementById('image');

reportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const submitBtn = reportForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    reportForm.reset();
    
    const existingPreview = imageInput.parentElement.querySelector('img');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    const successMsg = document.createElement('div');
    successMsg.textContent = '✓ Item reported successfully!';
    successMsg.style.cssText = 'background: #4caf50; color: white; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center; animation: fadeIn 0.3s;';
    reportForm.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.style.animation = 'fadeOut 0.3s';
        setTimeout(() => successMsg.remove(), 300);
    }, 3000);
});

searchLost.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const itemCards = lostItemsGrid.querySelectorAll('.item-card');
    
    itemCards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('.item-details').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s';
        } else {
            card.style.display = 'none';
        }
    });
});

searchFound.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const itemCards = foundItemsGrid.querySelectorAll('.item-card');
    
    itemCards.forEach(card => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('.item-details').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s';
        } else {
            card.style.display = 'none';
        }
    });
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.createElement('img');
            preview.src = event.target.result;
            preview.style.cssText = 'width: 100%; max-width: 200px; height: 150px; object-fit: cover; border-radius: 8px; margin-top: 10px; border: 2px solid #667eea;';
            
            const existingPreview = imageInput.parentElement.querySelector('img');
            if (existingPreview) {
                existingPreview.remove();
            }
            
            imageInput.parentElement.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }
});