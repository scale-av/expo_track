from flask import Blueprint, request, render_template, url_for

# Root level of application
mod = Blueprint('root', __name__, url_prefix='')

@mod.route('/')
def index():
    return render_template('root/index.html')
