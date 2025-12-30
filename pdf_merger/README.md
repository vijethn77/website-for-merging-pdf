# PDF Merger - Flask Web Application

A beautiful, user-friendly web application to merge multiple PDF files into one seamlessly.

## Features

✨ **Modern UI** - Beautiful gradient design with smooth animations
📄 **Easy Upload** - Drag & drop or click to upload multiple PDF files
🔀 **Reorder Files** - Drag files in the list to reorder them before merging
⚡ **Fast Merging** - Quick PDF merge using PyPDF2
💾 **Custom Output** - Name your merged PDF file
📱 **Responsive Design** - Works great on mobile and desktop

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Setup

1. Navigate to the project directory:
```bash
cd pdf_merger
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

Start the Flask development server:

```bash
python app.py
```

The application will be available at: **http://127.0.0.1:5000**

Open your browser and navigate to the URL. You should see the beautiful PDF Merger interface!

## Usage

1. **Upload PDFs**: Click the upload area or drag & drop PDF files
2. **Reorder**: Drag files in the list to change the merge order
3. **Customize**: Enter your desired output filename (optional)
4. **Merge**: Click the "Merge PDFs" button
5. **Download**: Download your merged PDF file

## Project Structure

```
pdf_merger/
├── app.py                 # Flask application with routes
├── requirements.txt       # Python dependencies
├── uploads/              # Temporary storage for uploaded & merged PDFs
├── templates/
│   └── index.html        # HTML template
└── static/
    ├── style.css         # Beautiful CSS styling
    └── script.js         # Interactive JavaScript
```

## Technologies Used

- **Backend**: Flask (Python)
- **PDF Processing**: PyPDF2
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Design**: Modern gradient UI with smooth animations

## API Endpoints

- `GET /` - Serve the main page
- `POST /upload` - Upload PDF files
- `POST /merge` - Merge selected PDFs
- `GET /download/<filename>` - Download merged PDF
- `POST /clear` - Clear all uploaded files

## Features in Detail

### Drag & Drop Upload
- Upload multiple PDFs by dragging them onto the upload area
- Or click to browse and select files

### File Reordering
- Drag files in the list to change their merge order
- Real-time visual feedback during dragging

### Error Handling
- File validation (only PDFs allowed)
- Size limit checking
- Graceful error messages

### Responsive Design
- Works on desktop, tablet, and mobile
- Optimized layout for all screen sizes

## Troubleshooting

**Issue**: "Port 5000 already in use"
- Solution: Change the port in `app.py` by modifying the last line to `app.run(debug=True, host='127.0.0.1', port=5001)`

**Issue**: PDF files not merging
- Check that all uploaded files are valid PDFs
- Ensure files are not corrupted

**Issue**: Download not working
- Clear browser cache
- Try a different browser

## License

Free to use for personal and commercial projects.

## Support

For issues or questions, check the error messages in the browser console or Flask terminal output.

---

Made with ❤️ | Easy PDF Merging Tool
