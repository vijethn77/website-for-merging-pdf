// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const filesSection = document.getElementById('filesSection');
const filesList = document.getElementById('filesList');
const fileCount = document.getElementById('fileCount');
const addMoreBtn = document.getElementById('addMoreBtn');
const mergeBtn = document.getElementById('mergeBtn');
const clearBtn = document.getElementById('clearBtn');
const outputName = document.getElementById('outputName');
const alert = document.getElementById('alert');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const downloadBtn = document.getElementById('downloadBtn');
const newMergeBtn = document.getElementById('newMergeBtn');

let uploadedFiles = [];
let mergedFilename = '';

// File upload handling
uploadArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Add more PDFs button
addMoreBtn.addEventListener('click', () => fileInput.click());

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

// Handle file upload
async function handleFiles(files) {
    if (files.length === 0) {
        showAlert('No file selected', 'warning');
        return;
    }

    // Get the first file (since input accept only one at a time now)
    const file = files[0];

    if (file.type !== 'application/pdf') {
        showAlert('Only PDF files are allowed!', 'error');
        fileInput.value = '';
        return;
    }

    const formData = new FormData();
    formData.append('files', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            uploadedFiles = uploadedFiles.concat(data.files);
            renderFilesList();
            uploadSection.style.display = 'none';
            filesSection.style.display = 'block';
            showAlert(`✓ "${file.name}" added successfully!`, 'success');
        } else {
            showAlert(data.error || 'Upload failed', 'error');
        }
    } catch (error) {
        showAlert('Error uploading file: ' + error.message, 'error');
    }

    // Reset file input
    fileInput.value = '';
}

// Render files list with drag and drop
function renderFilesList() {
    filesList.innerHTML = '';
    fileCount.textContent = `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`;

    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.draggable = true;
        fileItem.dataset.index = index;

        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-number">${index + 1}</div>
                <div class="file-icon">📄</div>
                <div class="file-details">
                    <div class="file-name">${file}</div>
                    <div class="file-size">PDF Document</div>
                </div>
            </div>
            <div class="file-actions">
                <button class="file-btn" title="Remove" onclick="removeFile(${index})">✕</button>
            </div>
        `;

        // Drag events
        fileItem.addEventListener('dragstart', handleDragStart);
        fileItem.addEventListener('dragover', handleDragOver);
        fileItem.addEventListener('drop', handleDrop);
        fileItem.addEventListener('dragend', handleDragEnd);
        fileItem.addEventListener('dragleave', handleDragLeave);

        filesList.appendChild(fileItem);
    });

    // Show/hide merge button based on file count
    updateButtonVisibility();
}

// Update merge button visibility
function updateButtonVisibility() {
    const buttonGroup = document.querySelector('.button-group');
    const addHint = document.getElementById('addHint');
    if (uploadedFiles.length >= 2) {
        buttonGroup.style.display = 'flex';
        addHint.style.display = 'none';
    } else {
        buttonGroup.style.display = 'none';
        addHint.style.display = 'block';
    }
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    if (draggedItem !== this) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (draggedItem !== this) {
        const draggedIndex = parseInt(draggedItem.dataset.index);
        const targetIndex = parseInt(this.dataset.index);

        // Swap files
        [uploadedFiles[draggedIndex], uploadedFiles[targetIndex]] = 
        [uploadedFiles[targetIndex], uploadedFiles[draggedIndex]];

        renderFilesList();
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

// Remove file
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    if (uploadedFiles.length === 0) {
        resetUI();
    } else {
        renderFilesList();
    }
}

// Merge PDFs - Simple direct form submission
mergeBtn.addEventListener('click', mergePDFs);

function mergePDFs() {
    if (uploadedFiles.length < 2) {
        showAlert('Please select at least 2 PDF files', 'error');
        return;
    }

    const outputFileName = outputName.value.trim() || 'merged';

    loading.style.display = 'flex';
    mergeBtn.disabled = true;

    // Create and submit form directly to server
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/merge';
    form.style.display = 'none';

    // Add fileOrder as hidden input
    const fileOrderInput = document.createElement('input');
    fileOrderInput.type = 'hidden';
    fileOrderInput.name = 'fileOrder';
    fileOrderInput.value = JSON.stringify(uploadedFiles);
    form.appendChild(fileOrderInput);

    // Add outputName as hidden input
    const outputNameInput = document.createElement('input');
    outputNameInput.type = 'hidden';
    outputNameInput.name = 'outputName';
    outputNameInput.value = outputFileName;
    form.appendChild(outputNameInput);

    // Override form submission to use fetch
    document.body.appendChild(form);
    
    const formData = new FormData(form);
    
    fetch('/merge', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        loading.style.display = 'none';
        if (data.success) {
            mergedFilename = outputFileName;
            showResultSection(outputFileName);
            showAlert('✓ PDF merged successfully! Check your Downloads folder.', 'success');
        } else {
            showAlert('Error: ' + (data.error || 'Unknown error'), 'error');
        }
        mergeBtn.disabled = false;
    })
    .catch(error => {
        showAlert('Error: ' + error.message, 'error');
        loading.style.display = 'none';
        mergeBtn.disabled = false;
    })
    .finally(() => {
        if (document.body.contains(form)) {
            document.body.removeChild(form);
        }
    });
}

// Show result section
function showResultSection(filename) {
    filesSection.style.display = 'none';
    resultSection.style.display = 'block';
    document.getElementById('resultMessage').textContent = 'PDFs merged successfully!';
    document.getElementById('resultDetails').innerHTML = `
        <p>✓ Your merged PDF has been saved to your <strong>Downloads</strong> folder!</p>
        <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">Filename: <strong>${filename}.pdf</strong></p>
    `;
}

// Download merged PDF (if user clicks download button)
downloadBtn.addEventListener('click', () => {
    if (mergedFilename) {
        window.location.href = `/download/${mergedFilename}`;
    }
});

// Start new merge
newMergeBtn.addEventListener('click', resetUI);

// Clear all files
clearBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all files?')) {
        try {
            const response = await fetch('/clear', { method: 'POST' });
            const data = await response.json();

            if (response.ok) {
                resetUI();
                showAlert('All files cleared', 'success');
            }
        } catch (error) {
            showAlert('Error clearing files: ' + error.message, 'error');
        }
    }
});

// Reset UI
function resetUI() {
    uploadedFiles = [];
    mergedFilename = '';
    fileInput.value = '';
    filesList.innerHTML = '';
    uploadSection.style.display = 'block';
    filesSection.style.display = 'none';
    resultSection.style.display = 'none';
    outputName.value = 'merged';
    mergeBtn.disabled = false;
    alert.style.display = 'none';
}

// Show alert
function showAlert(message, type = 'info') {
    alert.textContent = message;
    alert.className = `alert ${type}`;
    alert.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Set default output name
outputName.addEventListener('focus', function() {
    if (this.value === 'merged') {
        this.select();
    }
});
