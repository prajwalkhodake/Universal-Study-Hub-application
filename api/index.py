import os
import json
from flask import Flask, render_template, request, jsonify

app = Flask(
    __name__,
    template_folder=os.path.join(os.path.dirname(__file__), '..', 'templates'),
    static_folder=os.path.join(os.path.dirname(__file__), '..', 'static'),
    static_url_path='/static'
)

# ─── Page Routes ────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/terms')
def terms():
    return render_template('terms.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

# ─── Grade Conversion API ──────────────────────────────────

@app.route('/api/calculate', methods=['POST'])
def calculate_grade():
    """
    Accepts JSON:
      { "value": float, "from_scale": str, "to_scale": str, "multiplier": float|null }
    Returns JSON:
      { "result": float, "label": str, "letter_grade": str }
    """
    try:
        data = request.get_json(force=True)
        value = float(data.get('value', 0))
        from_scale = data.get('from_scale', '10-point')
        to_scale = data.get('to_scale', 'percentage')
        multiplier = data.get('multiplier')

        result = None
        label = ''
        letter_grade = ''

        # ── 10-Point CGPA → Percentage ──
        if from_scale == '10-point' and to_scale == 'percentage':
            mult = float(multiplier) if multiplier else 9.5
            result = round(value * mult, 2)
            label = f'{value} × {mult} = {result}%'
            letter_grade = _percentage_to_letter(result)

        # ── Percentage → US 4.0 GPA ──
        elif from_scale == 'percentage' and to_scale == '4.0-gpa':
            result = _percentage_to_gpa(value)
            label = f'{value}% ≈ {result} GPA (4.0 scale)'
            letter_grade = _gpa_to_letter(result)

        # ── 10-Point CGPA → US 4.0 GPA (direct) ──
        elif from_scale == '10-point' and to_scale == '4.0-gpa':
            mult = float(multiplier) if multiplier else 9.5
            pct = value * mult
            result = _percentage_to_gpa(pct)
            label = f'{value} CGPA → {round(pct, 2)}% → {result} GPA'
            letter_grade = _gpa_to_letter(result)

        # ── 4.0 GPA → Percentage ──
        elif from_scale == '4.0-gpa' and to_scale == 'percentage':
            result = round(value * 25, 2)  # simplified linear
            label = f'{value} GPA ≈ {result}%'
            letter_grade = _percentage_to_letter(result)

        # ── Custom multiplier fallback ──
        else:
            mult = float(multiplier) if multiplier else 1.0
            result = round(value * mult, 2)
            label = f'{value} × {mult} = {result}'
            letter_grade = '—'

        return jsonify({
            'result': result,
            'label': label,
            'letter_grade': letter_grade,
            'success': True
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


def _percentage_to_gpa(pct):
    """WES-style percentage to 4.0 GPA mapping."""
    if pct >= 90:   return 4.0
    elif pct >= 80:  return round(3.5 + (pct - 80) * 0.05, 2)
    elif pct >= 70:  return round(3.0 + (pct - 70) * 0.05, 2)
    elif pct >= 60:  return round(2.5 + (pct - 60) * 0.05, 2)
    elif pct >= 50:  return round(2.0 + (pct - 50) * 0.05, 2)
    elif pct >= 40:  return round(1.0 + (pct - 40) * 0.10, 2)
    else:            return 0.0


def _percentage_to_letter(pct):
    if pct >= 90:   return 'A+'
    elif pct >= 80: return 'A'
    elif pct >= 70: return 'B+'
    elif pct >= 60: return 'B'
    elif pct >= 50: return 'C'
    elif pct >= 40: return 'D'
    else:           return 'F'


def _gpa_to_letter(gpa):
    if gpa >= 3.7:   return 'A'
    elif gpa >= 3.3: return 'A-'
    elif gpa >= 3.0: return 'B+'
    elif gpa >= 2.7: return 'B'
    elif gpa >= 2.3: return 'B-'
    elif gpa >= 2.0: return 'C+'
    elif gpa >= 1.7: return 'C'
    elif gpa >= 1.0: return 'D'
    else:            return 'F'


# ─── Local Development ─────────────────────────────────────

if __name__ == '__main__':
    app.run(debug=True, port=5000)
