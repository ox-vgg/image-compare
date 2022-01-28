class Action {
    constructor(container, result) {
        this.c = container;

        this.el = [
            ...this.c.querySelectorAll(':scope > div')
        ].reduce((_r, el) => {
            _r[el.id] = el
            return _r;
        }, {});

        this.overlay_slider = this.el['overlay'].querySelector('.mdc-slider');
        this.result_container = document.getElementById('result');
        //this.result_parent = this.result_container.parentElement
        this.image_slider = this.result_container.querySelector('.image_slider');
        this.dragElement(this.image_slider);
        this.result = result;

        // TODO: Infer from document or set the document
        this._MODE = 'toggle';
        this._TOGGLE_SPEED = 2;
        this._OVERLAY = 0.5;
        this._SLIDE = 0.5;
        this._HORIZONTAL = true;
        this._HOVER = 1;

        this.download_el = document.createElement('a');

        this.el['toggle'].onclick = this.handle_toggle.bind(this);
        this.el['slide'].onchange = this.handle_slide.bind(this);
        this.el['diff'].onclick = this.handle_diff.bind(this);

        this.hover_text = document.getElementById('hover-image');
        this.overlay_slider.addEventListener('MDCSlider:input', this.handle_overlay.bind(this));

        this.draw = this._draw.bind(this);
        this.updating = false;

        const { add: hover_add, remove: hover_remove } = this.hoverSwitch(this.result_container);
        this.hover_add = hover_add;
        this.hover_remove = hover_remove;


    }

    get MODE() {
        return this._MODE;
    }

    set MODE(val) {
        // Hide current one
        if (this._MODE != val) {
            this.el[this._MODE].classList.add('hide');
            this.el[val].classList.remove('hide');
        }
        if (val === 'overlay') {
            window.requestAnimationFrame(() => {
                this.overlay_slider.MDCSlider.layout();
            });
        }
        if(val === 'slide') {
            this.image_slider.classList.remove('hide');
        } else {
            this.image_slider.classList.add('hide');
        }

        // Hover
        if (val === 'hover') {
            // Add handlers
            this.hover_add();
        } else {
            // Remove handlers
            this.hover_remove();
        }
        this._MODE = val;
        this.show();
    }

    get TOGGLE_SPEED() {
        return this._TOGGLE_SPEED;
    }

    set TOGGLE_SPEED(val) {
        this._TOGGLE_SPEED = val;
        this.show();
    }

    get OVERLAY() {
        return this._OVERLAY;
    }
    set OVERLAY(val) {
        this._OVERLAY = val;
        this.show();
    }

    get SLIDE() {
        return this._SLIDE;
    }
    set SLIDE(val) {
        this._SLIDE = val;
        this.show();
    }

    get HORIZONTAL() {
        return this._HORIZONTAL;
    }
    set HORIZONTAL(val) {
        this._HORIZONTAL = val;
        this.show();
    }
    get HOVER() {
        return this._HOVER;
    }
    set HOVER(val) {
        this._HOVER = val;
        this.show();
    }

    _draw() {
        if (this.MODE !== 'toggle') {
            this.result.toggle_images(0);
        }

        switch(this.MODE){
            case 'toggle':
                this.result.toggle_images(this.TOGGLE_SPEED);
                break;
            case 'diff':
                this.result.draw_diff_image();
                break;
            case 'overlay':
                this.result.draw_overlay_image(this.OVERLAY);
                break;
            case 'slide':
                this.result.draw_slide_image(this.SLIDE, this.HORIZONTAL);
                break;
            case 'hover':
                this.hover_text.textContent = this.HOVER;
                this.result.draw_toggle_image(this.HOVER === '2');
                break;
            default:
                this.result.draw_diff_image();
                throw new Error('Unknown mode', this.MODE);
        }
        this.el[this.MODE].classList.remove('hide');
    }

    show() {
        if(this.updating) {
            return;
        }
        this.updating = true;
        window.requestAnimationFrame(() => {
            this.draw();
            this.updating = false;
        });
    }
    reset () {
        // Reset state
        this._MODE = 'toggle';
        this._TOGGLE_SPEED = 2;
        this._OVERLAY = 0.5;
        this._SLIDE = 0.5;
        this._HORIZONTAL = true;
        this.result.toggle_images(0);

        // Hide all
        Object.values(this.el).forEach((_el) => {
            _el.classList.add('hide');
        });

        // Reset toggle ui
        const active_btn = this.el['toggle'].querySelector('button.mdc-tab.active');
        const clicked_btn = this.el['toggle'].querySelector('button.mdc-tab[data-speed="2"]');
        if (active_btn !== clicked_btn) {
            this.reset_toggle_ui(clicked_btn, active_btn);
        }

        // Reset radio and slider ui
        document.getElementById('radio-horizontal').checked = this._HORIZONTAL;
        document.getElementById('radio-vertical').checked = !this._HORIZONTAL;
        this.image_slider.classList.add('horizontal');
        this.image_slider.style.left = '50%';
        this.image_slider.style.top = '50%';

        // Reset overlay ui
        this.overlay_slider.MDCSlider.value =
            Math.round(this._OVERLAY * 100);

        // Reset hover ui

    }
    handle_overlay(e) {
        this.OVERLAY = (e.detail.value / 100);
    }
    handle_diff(e) {
        if (e.target === e.currentTarget) {
            return;
        }
        e.stopPropagation();
        this.download_el.href = this.result.canvas.toDataURL("image/png");
        this.download_el.download = "image_compare_visualisation.png";
        this.download_el.click();
    }

    handle_slide(e) {
        if (e.target.checked) {
            this.HORIZONTAL = e.target.value === 'horizontal';
        }
        if (this.HORIZONTAL) {
            this.image_slider.classList.add('horizontal');
        } else {
            this.image_slider.classList.remove('horizontal');
        }
        this.image_slider.style.left = '50%';
        this.image_slider.style.top = '50%';
        this.SLIDE = 0.5;
    }

    dragElement(el) {
        // Track width and padding are equal
        const _PADDING = (0.25 * parseFloat(getComputedStyle(el.parentElement).fontSize));
        const dragMove = (e) => {
          e = e || window.event;

          if (
            e.touches &&
            (e.touches.length > 1 ||
              (e.type === "touchend" && e.touches.length > 0))
          ) {
            return;
          }
          e.preventDefault();

          const {
            x,
            y,
            width: w,
            height: h,
          } = el.parentElement.getBoundingClientRect();

          // TODO Get padding programmatically of the canvas element
          // Now the padding is manually copied from CSS - 2.5% LR and 0.5em TB;
          const PADDING = _PADDING;

          // TODO: Done manually
          // need to do math -> (padding - track_width / 2) < - > width - track width
          const m = PADDING / 2;
          const M = this.HORIZONTAL ? (w - PADDING) : (h - PADDING);

          let _slide_factor = 0.5;
          if (this.HORIZONTAL) {
            const cx = (e.clientX || e.changedTouches[0].clientX) - x;
            _slide_factor = Math.max(m, Math.min(cx, M));
            el.style.left = `${_slide_factor}px`;
          } else {
            const cy = (e.clientY || e.changedTouches[0].clientY) - y;
            _slide_factor = Math.max(m, Math.min(cy, M));
            el.style.top = `${_slide_factor}px`
          }

          // https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
          _slide_factor -= m;
          _slide_factor /= M - m;
          _slide_factor = +_slide_factor.toFixed(2);
          this.SLIDE = _slide_factor;
        };

        const dragEnd = () => {
          window.onmouseup = null;
          window.ontouchend = null;
          this.result_container.ontouchmove = null;
          this.result_container.onmousemove = null;
        };

        const dragStart = (e) => {
          e = e || window.event;

          if (
            e.touches &&
            (e.touches.length > 1 ||
              (e.type === "touchend" && e.touches.length > 0))
          ) {
            return;
          }

          e.preventDefault();
          this.result_container.onmousemove = this.result_container.ontouchmove =
            dragMove;
          window.onmouseup = window.ontouchend =
            dragEnd;
        };

        el.onmousedown = dragStart;
        el.ontouchstart = dragStart;
    }

    hoverSwitch (el) {
        let flag = false;
        const flip_draw = (flip) => {
          if (flip) {
            if (!flag) {
              this.HOVER = '2'
              flag = true;
            }
          } else {
            if (flag) {
              this.HOVER = '1'
              flag = false;
            }
          }
        };
        const hover_move_listener = (e) => {
          e = e || window.event;

          if (
            e.touches &&
            (e.touches.length > 1 ||
              (e.type === "touchend" && e.touches.length > 0))
          ) {
            return;
          }
          e.preventDefault();

          const { width: w, left: l} = el.getBoundingClientRect();
          const cx = e.offsetX || (e.changedTouches[0].clientX - l);
          flip_draw(cx > w / 2);
        };
        const touch_end_listener = (e) => {
          el.ontouchend = null;
          el.ontouchmove = null;
        };
        const touch_start_listener = (e) => {
          e = e || window.event;

          if (
            e.touches &&
            (e.touches.length > 1 ||
              (e.type === "touchend" && e.touches.length > 0))
          ) {
            return;
          }

          e.preventDefault();
          const { width: w, left: l} = el.getBoundingClientRect();
          const cx = e.offsetX || (e.changedTouches[0].clientX - l);
          flip_draw(cx > w / 2);

          el.ontouchmove = hover_move_listener;
          el.ontouchend = touch_end_listener;
        };
        const add = () => {
          flag = false;
          this.HOVER = '1'
          el.onmousemove = hover_move_listener;
          el.ontouchstart = touch_start_listener;
        };
        const remove = () => {
          el.onmousemove = null;
          el.ontouchstart = null;
        };
        return {
          add,
          remove,
        };
    };

    reset_toggle_ui(clicked_btn, active_btn) {

        clicked_btn.classList.add('active', 'mdc-theme--primary-bg');
        active_btn.classList.remove('active', 'mdc-theme--primary-bg');

        const clicked_label = clicked_btn.querySelector('span.mdc-tab__text-label');
        const active_label = active_btn.querySelector('span.mdc-tab__text-label');

        active_label.classList.replace('mdc-theme--on-primary', 'mdc-theme--primary');
        clicked_label.classList.replace('mdc-theme--primary', 'mdc-theme--on-primary');

    }

    handle_toggle(e) {
        const clicked_btn = e.target.closest('button.mdc-tab');
        if (!(clicked_btn)) {
            // Button is not clicked?
            return;
        }
        const active_btn = e.currentTarget.querySelector('button.mdc-tab.active');
        if (clicked_btn === active_btn) {
            // Active button is clicked
            return;
        }
        this.reset_toggle_ui(clicked_btn, active_btn);

        this.TOGGLE_SPEED = Number.parseInt(clicked_btn.dataset.speed);
    }
}