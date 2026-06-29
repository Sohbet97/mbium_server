from flask import Flask, request, jsonify, abort
from rembg import remove
from PIL import Image
import io, base64

app = Flask(__name__)


@app.post('/remove-bg')
def remove_bg():
    if 'image' not in request.files:
        abort(400, 'No image field')
    data = request.files['image'].read()

    transparent_bytes = remove(data)

    fg = Image.open(io.BytesIO(transparent_bytes)).convert('RGBA')
    bg = Image.new('RGBA', fg.size, (255, 255, 255, 255))
    composite = Image.alpha_composite(bg, fg).convert('RGB')
    white_buf = io.BytesIO()
    composite.save(white_buf, format='PNG')

    return jsonify({
        'transparent_b64': base64.b64encode(transparent_bytes).decode(),
        'white_b64':        base64.b64encode(white_buf.getvalue()).decode(),
    })


@app.get('/health')
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001)
