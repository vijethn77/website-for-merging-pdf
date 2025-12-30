from flask import Flask, render_template, request, send_file, jsonify
from PyPDF2 import PdfMerger
import os
from werkzeug.utils import secure_filename
from pathlib import Path
import shutil
import time
from io import BytesIO

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Get Downloads folder path
DOWNLOADS_FOLDER = str(Path.home() / 'Downloads')

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        
        if not files or len(files) == 0:
            return jsonify({'error': 'No files selected'}), 400
        
        # Validate files
        uploaded_files = []
        for file in files:
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Add timestamp to filename to avoid duplicates and conflicts
                base, ext = os.path.splitext(filename)
                filename = f"{base}_{int(time.time() * 1000)}{ext}"
                
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                # Ensure directory exists
                os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                
                file.save(filepath)
                
                # Verify file was saved
                if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                    uploaded_files.append(filename)
                else:
                    return jsonify({'error': f'Failed to save file: {file.filename}'}), 400
            else:
                return jsonify({'error': f'Invalid file: {file.filename}. Only PDF files allowed.'}), 400
        
        return jsonify({
            'success': True,
            'files': uploaded_files,
            'count': len(uploaded_files)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/merge', methods=['POST'])
def merge_pdfs():
    """
    Merge PDFs and return as download - accepts form data
    """
    temp_output_path = None
    file_data = None
    try:
        # Get form data
        file_order_str = request.form.get('fileOrder', '[]')
        output_filename = request.form.get('outputName', 'merged').strip()
        
        # Parse JSON
        import json
        try:
            file_order = json.loads(file_order_str)
        except:
            return jsonify({'error': 'Invalid file order'}), 400
        
        if not output_filename.endswith('.pdf'):
            output_filename += '.pdf'
        
        output_filename = secure_filename(output_filename)
        
        if not file_order or len(file_order) < 2:
            return jsonify({'error': 'Please select at least 2 files to merge'}), 400
        
        # Validate all files exist before merging
        files_to_merge = []
        for filename in file_order:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
            if not os.path.exists(filepath):
                return jsonify({'error': f'File not found: {filename}'}), 400
            if os.path.getsize(filepath) == 0:
                return jsonify({'error': f'File is empty: {filename}'}), 400
            files_to_merge.append(filepath)
        
        # Merge PDFs
        merger = PdfMerger()
        try:
            for filepath in files_to_merge:
                merger.append(filepath)
        except Exception as e:
            merger.close()
            return jsonify({'error': f'Error processing PDF: {str(e)}'}), 400
        
        # Write to BytesIO
        output_buffer = BytesIO()
        try:
            merger.write(output_buffer)
            merger.close()
        except Exception as e:
            merger.close()
            return jsonify({'error': f'Error writing merged file: {str(e)}'}), 400
        
        # Get the data from buffer
        output_buffer.seek(0)
        file_data = output_buffer.getvalue()
        output_buffer.close()
        
        if not file_data:
            return jsonify({'error': 'Merged file is empty'}), 500
        
        # Save to Downloads folder
        downloads_output_path = os.path.join(DOWNLOADS_FOLDER, output_filename)
        try:
            with open(downloads_output_path, 'wb') as f:
                f.write(file_data)
            # Success - file is saved to Downloads
            return jsonify({
                'success': True,
                'message': f'PDF merged successfully and saved to Downloads folder',
                'filename': output_filename
            })
        except Exception as e:
            return jsonify({'error': f'Could not save to Downloads: {str(e)}'}), 500
    
    except Exception as e:
        return jsonify({'error': f'Merge failed: {str(e)}'}), 500

@app.route('/download/<filename>')
def download_file(filename):
    try:
        filename = secure_filename(filename)
        
        # First check Downloads folder
        filepath = os.path.join(DOWNLOADS_FOLDER, filename)
        if not os.path.exists(filepath):
            # Fallback to uploads folder
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(filepath, as_attachment=True, download_name=filename)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/clear', methods=['POST'])
def clear_files():
    try:
        upload_dir = app.config['UPLOAD_FOLDER']
        for filename in os.listdir(upload_dir):
            filepath = os.path.join(upload_dir, filename)
            if os.path.isfile(filepath):
                os.remove(filepath)
        
        return jsonify({'success': True, 'message': 'All files cleared'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
